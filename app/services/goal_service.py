from datetime import date
from decimal import ROUND_CEILING, Decimal
from typing import Dict, Optional, Tuple

from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Query, Session

from app.models.goal import Goal
from app.models.transaction import Transaction
from app.schemas.goal import GoalContribution, GoalCreate, GoalProgress, GoalUpdate
from app.utils.enums import GoalStatus, TransactionType
from app.utils.exceptions import BadRequestException, NotFoundException
from app.utils.pagination import PaginationParams, paginate


def create_goal(db: Session, user_id: int, data: GoalCreate) -> Goal:
    goal = Goal(user_id=user_id, **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def get_goal_or_404(db: Session, user_id: int, goal_id: int) -> Goal:
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
    if goal is None:
        raise NotFoundException("Goal not found")
    return goal


def list_goals(
    db: Session, user_id: int, params: PaginationParams, status_: Optional[GoalStatus] = None
) -> Tuple[list, Dict]:
    query: Query = db.query(Goal).filter(Goal.user_id == user_id)
    if status_:
        query = query.filter(Goal.status == status_)
    query = query.order_by(Goal.created_at.desc())
    return paginate(query, params)


def update_goal(db: Session, user_id: int, goal_id: int, data: GoalUpdate) -> Goal:
    goal = get_goal_or_404(db, user_id, goal_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def delete_goal(db: Session, user_id: int, goal_id: int) -> None:
    goal = get_goal_or_404(db, user_id, goal_id)
    has_transactions = (
        db.query(Transaction.id).filter(Transaction.goal_id == goal_id).first()
    )
    if has_transactions:
        raise BadRequestException(
            "Cannot delete a goal with linked transfer transactions. Delete them first."
        )
    db.delete(goal)
    db.commit()


def apply_goal_delta(db: Session, goal: Goal, delta: Decimal) -> None:
    """
    Adjust a goal's stored current_amount by `delta` (positive for a new
    contribution, negative when reverting/removing one), clamp at zero, and
    keep `status` in sync — auto-completing when the target is reached and
    reverting an auto-completed goal if it later dips back below target.
    A manually "cancelled" goal is left untouched by this auto-status logic.
    """
    goal.current_amount = (goal.current_amount or Decimal("0")) + delta
    if goal.current_amount < 0:
        goal.current_amount = Decimal("0")

    if (
        goal.target_amount
        and goal.current_amount >= goal.target_amount
        and goal.status == GoalStatus.in_progress
    ):
        goal.status = GoalStatus.completed
    elif goal.status == GoalStatus.completed and goal.current_amount < goal.target_amount:
        goal.status = GoalStatus.in_progress

    db.add(goal)


def contribute_to_goal(
    db: Session, user_id: int, goal_id: int, data: GoalContribution
) -> Goal:
    goal = get_goal_or_404(db, user_id, goal_id)
    if goal.status != GoalStatus.in_progress:
        raise BadRequestException("Cannot contribute to a goal that is not in progress")

    transaction = Transaction(
        user_id=user_id,
        category_id=None,
        goal_id=goal.id,
        type=TransactionType.transfer,
        amount=data.amount,
        description=data.description or f"Contribution to {goal.name}",
        transaction_date=data.transaction_date or date.today(),
    )
    db.add(transaction)
    apply_goal_delta(db, goal, data.amount)

    db.commit()
    db.refresh(goal)
    return goal


def _average_monthly_contribution(contributions: list) -> Decimal:
    """Average size of transfer contributions per month since the first one."""
    if not contributions:
        return Decimal("0")

    first_date = contributions[0].transaction_date
    months_elapsed = max(
        1,
        (date.today().year - first_date.year) * 12
        + (date.today().month - first_date.month)
        + 1,
    )
    total_contributed = sum((c.amount for c in contributions), Decimal("0"))
    return total_contributed / months_elapsed


def compute_goal_progress(db: Session, goal: Goal) -> GoalProgress:
    remaining_amount = goal.target_amount - goal.current_amount
    if remaining_amount < 0:
        remaining_amount = Decimal("0.00")

    percentage = 0.0
    if goal.target_amount:
        percentage = min(float(goal.current_amount / goal.target_amount) * 100, 100.0)

    days_remaining = None
    if goal.target_date:
        days_remaining = (goal.target_date - date.today()).days

    contributions = (
        db.query(Transaction)
        .filter(Transaction.goal_id == goal.id, Transaction.type == TransactionType.transfer)
        .order_by(Transaction.transaction_date.asc())
        .all()
    )
    avg_monthly_contribution = _average_monthly_contribution(contributions)

    projected_completion_date = None
    on_track = None
    if remaining_amount <= 0:
        projected_completion_date = date.today()
        on_track = True
    elif avg_monthly_contribution > 0:
        months_needed = int(
            (remaining_amount / avg_monthly_contribution).to_integral_value(rounding=ROUND_CEILING)
        )
        projected_completion_date = date.today() + relativedelta(months=months_needed)
        if goal.target_date:
            on_track = projected_completion_date <= goal.target_date

    required_monthly_contribution = None
    if goal.target_date and remaining_amount > 0:
        months_left = max(
            1,
            (goal.target_date.year - date.today().year) * 12
            + (goal.target_date.month - date.today().month),
        )
        required_monthly_contribution = (remaining_amount / Decimal(months_left)).quantize(
            Decimal("0.01"), rounding=ROUND_CEILING
        )

    return GoalProgress(
        goal_id=goal.id,
        name=goal.name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        remaining_amount=remaining_amount,
        percentage_complete=round(percentage, 2),
        target_date=goal.target_date,
        days_remaining=days_remaining,
        projected_completion_date=projected_completion_date,
        required_monthly_contribution=required_monthly_contribution,
        on_track=on_track,
    )
