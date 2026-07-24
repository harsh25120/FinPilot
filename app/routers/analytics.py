from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.analytics import (
    IncomeVsExpenseResponse,
    SavingsRateResponse,
    SpendingByCategoryResponse,
    TrendsResponse,
)
from app.services import analytics_service
from app.utils.dates import get_month_bounds

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/spending-by-category",
    response_model=SpendingByCategoryResponse,
    summary="Spending breakdown by category over a date range (defaults to current month)",
)
def spending_by_category(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if start_date is None or end_date is None:
        today = date.today()
        default_start, default_end = get_month_bounds(today.year, today.month)
        start_date = start_date or default_start
        end_date = end_date or default_end
    return analytics_service.get_spending_by_category(db, current_user.id, start_date, end_date)


@router.get(
    "/income-vs-expense",
    response_model=IncomeVsExpenseResponse,
    summary="Monthly income vs. expense trend",
)
def income_vs_expense(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return analytics_service.get_income_vs_expense(db, current_user.id, months)


@router.get(
    "/savings-rate",
    response_model=SavingsRateResponse,
    summary="Savings rate trend and average over the last N months",
)
def savings_rate(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return analytics_service.get_savings_rate(db, current_user.id, months)


@router.get(
    "/trends",
    response_model=TrendsResponse,
    summary="Category spending trends: this month vs. last month",
)
def trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return analytics_service.get_trends(db, current_user.id)
