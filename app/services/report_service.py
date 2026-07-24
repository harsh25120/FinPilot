import csv
import io
from datetime import date
from decimal import Decimal
from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.budget import Budget
from app.models.category import Category
from app.models.goal import Goal
from app.models.transaction import Transaction
from app.schemas.dashboard import CategoryBreakdownItem
from app.schemas.report import MonthlyReport, YearlyMonthSummary, YearlyReport
from app.services.budget_service import compute_budget_status
from app.services.goal_service import compute_goal_progress
from app.services.transaction_service import sum_transactions
from app.utils.dates import get_month_bounds
from app.utils.enums import GoalStatus, TransactionType
from app.utils.exceptions import BadRequestException


def _breakdown(
    db: Session, user_id: int, type_: TransactionType, start: date, end: date
) -> Tuple[Decimal, List[CategoryBreakdownItem]]:
    rows = (
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
            Transaction.type == type_,
            Transaction.transaction_date >= start,
            Transaction.transaction_date <= end,
        )
        .group_by(Category.id, Category.name, Category.color, Category.icon)
        .order_by(func.sum(Transaction.amount).desc())
        .all()
    )

    total = sum((Decimal(r.total) for r in rows), Decimal("0.00"))
    items = []
    for r in rows:
        row_total = Decimal(r.total)
        pct = float(row_total / total) * 100 if total > 0 else 0.0
        items.append(
            CategoryBreakdownItem(
                category_id=r.id,
                category_name=r.name,
                amount=row_total,
                percentage=round(pct, 2),
                color=r.color,
                icon=r.icon,
            )
        )
    return total, items


def get_monthly_report(db: Session, user_id: int, year: int, month: int) -> MonthlyReport:
    if month < 1 or month > 12:
        raise BadRequestException("Month must be between 1 and 12")

    start, end = get_month_bounds(year, month)

    total_income, income_breakdown = _breakdown(db, user_id, TransactionType.income, start, end)
    total_expense, expense_breakdown = _breakdown(db, user_id, TransactionType.expense, start, end)
    net_savings = total_income - total_expense
    savings_rate = float(net_savings / total_income) * 100 if total_income > 0 else 0.0

    budgets = (
        db.query(Budget)
        .options(joinedload(Budget.category))
        .filter(Budget.user_id == user_id, Budget.start_date <= end, Budget.end_date >= start)
        .all()
    )
    budget_statuses = [compute_budget_status(db, b) for b in budgets]

    goals = (
        db.query(Goal)
        .filter(Goal.user_id == user_id, Goal.status == GoalStatus.in_progress)
        .all()
    )
    goals_progress = [compute_goal_progress(db, g) for g in goals]

    transaction_count = (
        db.query(func.count(Transaction.id))
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= start,
            Transaction.transaction_date <= end,
        )
        .scalar()
    )

    return MonthlyReport(
        year=year,
        month=month,
        total_income=total_income,
        total_expense=total_expense,
        net_savings=net_savings,
        savings_rate=round(savings_rate, 2),
        transaction_count=transaction_count or 0,
        income_breakdown=income_breakdown,
        expense_breakdown=expense_breakdown,
        budgets=budget_statuses,
        goals_progress=goals_progress,
    )


def get_yearly_report(db: Session, user_id: int, year: int) -> YearlyReport:
    monthly_breakdown = []
    total_income = Decimal("0.00")
    total_expense = Decimal("0.00")

    for month in range(1, 13):
        start, end = get_month_bounds(year, month)
        income = sum_transactions(db, user_id, TransactionType.income, start, end)
        expense = sum_transactions(db, user_id, TransactionType.expense, start, end)
        total_income += income
        total_expense += expense
        monthly_breakdown.append(
            YearlyMonthSummary(month=month, income=income, expense=expense, net=income - expense)
        )

    return YearlyReport(
        year=year,
        total_income=total_income,
        total_expense=total_expense,
        net_savings=total_income - total_expense,
        monthly_breakdown=monthly_breakdown,
    )


def export_transactions_csv(
    db: Session, user_id: int, start: Optional[date], end: Optional[date]
) -> str:
    query = (
        db.query(Transaction)
        .options(joinedload(Transaction.category))
        .filter(Transaction.user_id == user_id)
    )
    if start:
        query = query.filter(Transaction.transaction_date >= start)
    if end:
        query = query.filter(Transaction.transaction_date <= end)
    transactions = query.order_by(Transaction.transaction_date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Type", "Category", "Amount", "Currency", "Description"])
    for t in transactions:
        writer.writerow(
            [
                t.transaction_date.isoformat(),
                t.type.value,
                t.category.name if t.category else "",
                str(t.amount),
                t.currency,
                t.description or "",
            ]
        )
    return output.getvalue()
