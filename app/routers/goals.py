from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.common import Page
from app.schemas.goal import GoalContribution, GoalCreate, GoalOut, GoalProgress, GoalUpdate
from app.services import goal_service
from app.utils.enums import GoalStatus
from app.utils.pagination import PaginationParams

router = APIRouter(prefix="/goals", tags=["Financial Goals"])


@router.get("", response_model=Page[GoalOut], summary="List financial goals")
def list_goals(
    status_: Optional[GoalStatus] = Query(None, alias="status"),
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items, meta = goal_service.list_goals(db, current_user.id, params, status_)
    return {"items": items, "meta": meta}


@router.post(
    "", response_model=GoalOut, status_code=status.HTTP_201_CREATED, summary="Create a financial goal"
)
def create_goal(
    data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return goal_service.create_goal(db, current_user.id, data)


@router.get("/{goal_id}", response_model=GoalOut, summary="Get a single goal")
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return goal_service.get_goal_or_404(db, current_user.id, goal_id)


@router.put("/{goal_id}", response_model=GoalOut, summary="Update a goal")
def update_goal(
    goal_id: int,
    data: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return goal_service.update_goal(db, current_user.id, goal_id, data)


@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a goal",
    description="Fails if the goal has linked transfer transactions.",
)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    goal_service.delete_goal(db, current_user.id, goal_id)
    return None


@router.post(
    "/{goal_id}/contribute",
    response_model=GoalOut,
    summary="Contribute funds toward a goal",
    description="Creates a transfer transaction and updates the goal's current_amount.",
)
def contribute(
    goal_id: int,
    data: GoalContribution,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return goal_service.contribute_to_goal(db, current_user.id, goal_id, data)


@router.get(
    "/{goal_id}/progress",
    response_model=GoalProgress,
    summary="Get computed progress, pace, and projected completion for a goal",
)
def get_progress(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    goal = goal_service.get_goal_or_404(db, current_user.id, goal_id)
    return goal_service.compute_goal_progress(db, goal)
