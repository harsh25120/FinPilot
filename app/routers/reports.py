import io
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.report import MonthlyReport, YearlyReport
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get(
    "/monthly/{year}/{month}",
    response_model=MonthlyReport,
    summary="Full monthly report: totals, category breakdowns, budgets, and goal progress",
)
def monthly_report(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return report_service.get_monthly_report(db, current_user.id, year, month)


@router.get(
    "/yearly/{year}",
    response_model=YearlyReport,
    summary="Yearly report aggregated by month",
)
def yearly_report(
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return report_service.get_yearly_report(db, current_user.id, year)


@router.get(
    "/export/csv",
    summary="Export transactions as a CSV file",
    response_class=StreamingResponse,
)
def export_csv(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    csv_data = report_service.export_transactions_csv(db, current_user.id, start_date, end_date)
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )
