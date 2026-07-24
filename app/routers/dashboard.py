from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.dashboard import CashFlowResponse, DashboardOverview
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/overview",
    response_model=DashboardOverview,
    summary="Get the current month's financial overview",
)
def overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return dashboard_service.get_overview(db, current_user.id, current_user.monthly_income)


@router.get(
    "/cash-flow",
    response_model=CashFlowResponse,
    summary="Get monthly income/expense/net cash-flow history",
)
def cash_flow(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return dashboard_service.get_cash_flow(db, current_user.id, months)
