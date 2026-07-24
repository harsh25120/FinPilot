from datetime import date
from decimal import Decimal
from typing import Dict, List, Tuple

from dateutil.relativedelta import relativedelta
from sqlalchemy import func
from sqlalchemy.orm import Query, Session, joinedload

from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetStatus, BudgetUpdate
from app.utils.enums import BudgetPeriod, TransactionType
from app.utils.exceptions import BadRequestException, NotFoundException
from app.utils.money import to_money
from app.utils.pagination import PaginationParams, paginate


def compute_end_date(start_date: date, period: BudgetPeriod) -> date:
    if period == BudgetPeriod.weekly:
        return start_date + relativedelta(weeks=1) - relativedelta(days=1)
    if period == BudgetPeriod.monthly:
        return start_date + relativedelta(months=1) - relativedelta(days=1)
    return start_date + relativedelta(years=1) - relativedelta(days=1)


def create_budget(db: Session, user_id: int, data: BudgetCreate) -> Budget:
    category = (
        db.query(Category)
        .filter(Category.id == data.category_id, Category.user_id == user_id)
        .first()
    )
    if category is None:
        raise NotFoundException("Category not found")
    if category.type.value != "expense":
        raise BadRequestException("Budgets can only be created for expense categories")

    end_date = compute_end_date(data.start_date, data.period)

    overlapping = (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id,
            Budget.category_id == data.category_id,
            Budget.start_date <= end_date,
            Budget.end_date >= data.start_date,
        )
        .first()
    )
    if overlapping:
        raise BadRequestException(
            "An overlapping budget already exists for this category and period"
        )

    budget = Budget(
        user_id=user_id,
        category_id=data.category_id,
        amount=data.amount,
        period=data.period,
        start_date=data.start_date,
        end_date=end_date,
        alert_threshold=data.alert_threshold,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def get_budget_or_404(db: Session, user_id: int, budget_id: int) -> Budget:
    budget = (
        db.query(Budget)
        .options(joinedload(Budget.category))
        .filter(Budget.id == budget_id, Budget.user_id == user_id)
        .first()
    )
    if budget is None:
        raise NotFoundException("Budget not found")
    return budget


def list_budgets(
    db: Session, user_id: int, params: PaginationParams, active_only: bool = False
) -> Tuple[list, Dict]:
    query: Query = (
        db.query(Budget).options(joinedload(Budget.category)).filter(Budget.user_id == user_id)
    )
    if active_only:
        today = date.today()
        query = query.filter(Budget.start_date <= today, Budget.end_date >= today)
    query = query.order_by(Budget.start_date.desc())
    return paginate(query, params)


def update_budget(db: Session, user_id: int, budget_id: int, data: BudgetUpdate) -> Budget:
    budget = get_budget_or_404(db, user_id, budget_id)
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(budget, field, value)

    if "start_date" in update_data:
        budget.end_date = compute_end_date(budget.start_date, budget.period)

    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def delete_budget(db: Session, user_id: int, budget_id: int) -> None:
    budget = get_budget_or_404(db, user_id, budget_id)
    db.delete(budget)
    db.commit()


def compute_budget_status(db: Session, budget: Budget) -> BudgetStatus:
    spent_raw = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == budget.user_id,
            Transaction.category_id == budget.category_id,
            Transaction.type == TransactionType.expense,
            Transaction.transaction_date >= budget.start_date,
            Transaction.transaction_date <= budget.end_date,
        )
        .scalar()
    )

    spent = to_money(spent_raw)
    remaining = budget.amount - spent
    fraction_used = float(spent / budget.amount) if budget.amount else 0.0

    return BudgetStatus(
        budget_id=budget.id,
        category_id=budget.category_id,
        category_name=budget.category.name,
        period=budget.period,
        limit=budget.amount,
        spent=spent,
        remaining=remaining,
        percentage_used=round(fraction_used * 100, 2),
        is_exceeded=spent > budget.amount,
        is_alert=fraction_used >= budget.alert_threshold,
        start_date=budget.start_date,
        end_date=budget.end_date,
    )


def get_budget_alerts(db: Session, user_id: int) -> List[BudgetStatus]:
    today = date.today()
    budgets = (
        db.query(Budget)
        .options(joinedload(Budget.category))
        .filter(Budget.user_id == user_id, Budget.start_date <= today, Budget.end_date >= today)
        .all()
    )
    statuses = [compute_budget_status(db, b) for b in budgets]
    return [s for s in statuses if s.is_alert or s.is_exceeded]
