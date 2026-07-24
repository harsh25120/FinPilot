from fastapi import APIRouter, Depends

from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.simulator import (
    GoalPlannerRequest,
    GoalPlannerResponse,
    ProjectionRequest,
    ProjectionResponse,
)
from app.services import simulator_service

router = APIRouter(prefix="/simulator", tags=["Financial Simulator"])


@router.post(
    "/projection",
    response_model=ProjectionResponse,
    summary="Project savings growth with compound interest and monthly contributions",
)
def projection(
    data: ProjectionRequest,
    current_user: User = Depends(get_current_active_user),
):
    return simulator_service.run_projection(data)


@router.post(
    "/goal-planner",
    response_model=GoalPlannerResponse,
    summary="Given a monthly contribution or a target date, plan how to reach a goal",
    description=(
        "Provide either monthly_contribution (to find months needed and whether a "
        "target_date is feasible) or target_date (to find the required monthly "
        "contribution)."
    ),
)
def goal_planner(
    data: GoalPlannerRequest,
    current_user: User = Depends(get_current_active_user),
):
    return simulator_service.run_goal_planner(data)
