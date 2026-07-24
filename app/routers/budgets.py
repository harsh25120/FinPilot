from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetOut, BudgetStatus, BudgetUpdate
from app.schemas.common import Page
from app.services import budget_service
from app.utils.pagination import PaginationParams

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("", response_model=Page[BudgetOut], summary="List budgets")
def list_budgets(
    active_only: bool = Query(False, description="Only budgets whose period covers today"),
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items, meta = budget_service.list_budgets(db, current_user.id, params, active_only)
    return {"items": items, "meta": meta}


@router.post(
    "", response_model=BudgetOut, status_code=status.HTTP_201_CREATED, summary="Create a budget"
)
def create_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return budget_service.create_budget(db, current_user.id, data)


# NOTE: this static route must be declared before the dynamic "/{budget_id}"
# route below, or FastAPI will try (and fail) to parse "alerts" as an int.
@router.get(
    "/alerts",
    response_model=List[BudgetStatus],
    summary="List budgets that are at or over their alert threshold",
)
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return budget_service.get_budget_alerts(db, current_user.id)


@router.get("/{budget_id}", response_model=BudgetOut, summary="Get a single budget")
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return budget_service.get_budget_or_404(db, current_user.id, budget_id)


@router.get(
    "/{budget_id}/status",
    response_model=BudgetStatus,
    summary="Get computed spend/remaining/alert status for a budget",
)
def get_budget_status(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    budget = budget_service.get_budget_or_404(db, current_user.id, budget_id)
    return budget_service.compute_budget_status(db, budget)


@router.put("/{budget_id}", response_model=BudgetOut, summary="Update a budget")
def update_budget(
    budget_id: int,
    data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return budget_service.update_budget(db, current_user.id, budget_id, data)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a budget")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    budget_service.delete_budget(db, current_user.id, budget_id)
    return None
