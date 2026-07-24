from datetime import date
from decimal import Decimal
from typing import Dict, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.analytics import (
    IncomeVsExpensePoint,
    IncomeVsExpenseResponse,
    SavingsRatePoint,
    SavingsRateResponse,
    SpendingByCategoryResponse,
    TrendItem,
    TrendsResponse,
)
from app.schemas.dashboard import CategoryBreakdownItem
from app.services.transaction_service import sum_transactions
from app.utils.dates import get_last_n_months, get_month_bounds
from app.utils.enums import TransactionType


def get_spending_by_category(
    db: Session, user_id: int, start: date, end: date
) -> SpendingByCategoryResponse:
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
            Transaction.type == TransactionType.expense,
            Transaction.transaction_date >= start,
            Transaction.transaction_date <= end,
        )
        .group_by(Category.id, Category.name, Category.color, Category.icon)
        .order_by(func.sum(Transaction.amount).desc())
        .all()
    )

    total_spent = sum((Decimal(r.total) for r in rows), Decimal("0.00"))

    breakdown = []
    for r in rows:
        row_total = Decimal(r.total)
        pct = float(row_total / total_spent) * 100 if total_spent > 0 else 0.0
        breakdown.append(
            CategoryBreakdownItem(
                category_id=r.id,
                category_name=r.name,
                amount=row_total,
                percentage=round(pct, 2),
                color=r.color,
                icon=r.icon,
            )
        )

    return SpendingByCategoryResponse(
        start_date=start.isoformat(), end_date=end.isoformat(), total_spent=total_spent, breakdown=breakdown
    )


def get_income_vs_expense(db: Session, user_id: int, months: int = 6) -> IncomeVsExpenseResponse:
    points = []
    for year, month in get_last_n_months(months):
        start, end = get_month_bounds(year, month)
        income = sum_transactions(db, user_id, TransactionType.income, start, end)
        expense = sum_transactions(db, user_id, TransactionType.expense, start, end)
        points.append(
            IncomeVsExpensePoint(
                period=start.strftime("%Y-%m"), income=income, expense=expense, net=income - expense
            )
        )
    return IncomeVsExpenseResponse(points=points)


def get_savings_rate(db: Session, user_id: int, months: int = 6) -> SavingsRateResponse:
    flow = get_income_vs_expense(db, user_id, months)
    points = []
    rates = []
    for p in flow.points:
        rate = float(p.net / p.income) * 100 if p.income > 0 else 0.0
        rates.append(rate)
        points.append(
            SavingsRatePoint(period=p.period, income=p.income, savings=p.net, savings_rate=round(rate, 2))
        )
    average_rate = round(sum(rates) / len(rates), 2) if rates else 0.0
    return SavingsRateResponse(average_savings_rate=average_rate, points=points)


def _category_totals(
    db: Session, user_id: int, start: date, end: date
) -> Dict[int, Tuple[str, Decimal]]:
    """Expense total per category, keyed by category id, for one date range."""
    rows = (
        db.query(
            Category.id,
            Category.name,
            func.coalesce(func.sum(Transaction.amount), 0).label("total"),
        )
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.expense,
            Transaction.transaction_date >= start,
            Transaction.transaction_date <= end,
        )
        .group_by(Category.id, Category.name)
        .all()
    )
    return {r.id: (r.name, Decimal(r.total)) for r in rows}


def get_trends(db: Session, user_id: int) -> TrendsResponse:
    """Compare this month's spending per category against last month's."""
    (prev_year, prev_month), (cur_year, cur_month) = get_last_n_months(2)
    cur_start, cur_end = get_month_bounds(cur_year, cur_month)
    prev_start, prev_end = get_month_bounds(prev_year, prev_month)

    current = _category_totals(db, user_id, cur_start, cur_end)
    previous = _category_totals(db, user_id, prev_start, prev_end)

    all_ids = set(current.keys()) | set(previous.keys())
    trends = []
    for cid in all_ids:
        cur_name, cur_amount = current.get(cid, (None, Decimal("0.00")))
        prev_name, prev_amount = previous.get(cid, (None, Decimal("0.00")))
        name = cur_name or prev_name or "Unknown"

        change = cur_amount - prev_amount
        change_pct = round(float(change / prev_amount) * 100, 2) if prev_amount > 0 else None
        direction = "up" if change > 0 else "down" if change < 0 else "flat"

        trends.append(
            TrendItem(
                category_id=cid,
                category_name=name,
                current_period_amount=cur_amount,
                previous_period_amount=prev_amount,
                change_amount=change,
                change_percentage=change_pct,
                direction=direction,
            )
        )

    trends.sort(key=lambda t: abs(t.change_amount), reverse=True)
    return TrendsResponse(trends=trends)
