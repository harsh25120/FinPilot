from datetime import date
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.category import Category
from app.models.goal import Goal
from app.models.transaction import Transaction
from app.schemas.dashboard import (
    CashFlowPoint,
    CashFlowResponse,
    CategoryBreakdownItem,
    DashboardOverview,
)
from app.schemas.goal import GoalOut
from app.schemas.transaction import TransactionOut
from app.services.budget_service import get_budget_alerts
from app.services.transaction_service import sum_transactions
from app.utils.dates import get_last_n_months, get_month_bounds
from app.utils.enums import GoalStatus, TransactionType


def get_overview(db: Session, user_id: int, monthly_income_target: Decimal) -> DashboardOverview:
    today = date.today()
    start, end = get_month_bounds(today.year, today.month)

    total_income = sum_transactions(db, user_id, TransactionType.income, start, end)
    total_expense = sum_transactions(db, user_id, TransactionType.expense, start, end)
    net_savings = total_income - total_expense
    savings_rate = float(net_savings / total_income) * 100 if total_income > 0 else 0.0

    category_rows = (
        db.query(
            Category.id,
            Category.name,
            Category.color,
            Category.icon,
            func.coalesce(func.sum(Transaction.amount), 0).label("total"),
        )
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.expense,
            Transaction.transaction_date >= start,
            Transaction.transaction_date <= end,
        )
        .group_by(Category.id, Category.name, Category.color, Category.icon)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(5)
        .all()
    )

    top_categories = []
    for row in category_rows:
        row_total = Decimal(row.total)
        pct = float(row_total / total_expense) * 100 if total_expense > 0 else 0.0
        top_categories.append(
            CategoryBreakdownItem(
                category_id=row.id,
                category_name=row.name,
                amount=row_total,
                percentage=round(pct, 2),
                color=row.color,
                icon=row.icon,
            )
        )

    recent = (
        db.query(Transaction)
        .options(joinedload(Transaction.category))
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.transaction_date.desc(), Transaction.id.desc())
        .limit(5)
        .all()
    )

    active_goals = (
        db.query(Goal)
        .filter(Goal.user_id == user_id, Goal.status == GoalStatus.in_progress)
        .order_by(Goal.created_at.desc())
        .limit(5)
        .all()
    )

    alerts = get_budget_alerts(db, user_id)

    all_time_income = sum_transactions(db, user_id, TransactionType.income)
    all_time_expense = sum_transactions(db, user_id, TransactionType.expense)
    total_balance = all_time_income - all_time_expense

    return DashboardOverview(
        month=start.strftime("%Y-%m"),
        total_income=total_income,
        total_expense=total_expense,
        net_savings=net_savings,
        savings_rate=round(savings_rate, 2),
        monthly_income_target=monthly_income_target,
        total_balance=total_balance,
        top_spending_categories=top_categories,
        recent_transactions=[TransactionOut.model_validate(t) for t in recent],
        active_goals=[GoalOut.model_validate(g) for g in active_goals],
        budget_alerts_count=len(alerts),
    )


def get_cash_flow(db: Session, user_id: int, months: int = 6) -> CashFlowResponse:
    points = []
    for year, month in get_last_n_months(months):
        start, end = get_month_bounds(year, month)
        income = sum_transactions(db, user_id, TransactionType.income, start, end)
        expense = sum_transactions(db, user_id, TransactionType.expense, start, end)
        points.append(
            CashFlowPoint(
                period=start.strftime("%Y-%m"), income=income, expense=expense, net=income - expense
            )
        )
    return CashFlowResponse(points=points)
