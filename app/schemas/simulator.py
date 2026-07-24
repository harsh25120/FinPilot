from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class ProjectionRequest(BaseModel):
    starting_balance: Decimal = Field(default=Decimal("0"), ge=0)
    monthly_contribution: Decimal = Field(..., ge=0)
    annual_interest_rate: float = Field(default=0.0, ge=0, le=1, description="e.g. 0.05 = 5% APR")
    months: int = Field(..., gt=0, le=600)


class ProjectionPoint(BaseModel):
    month: int
    contribution: Decimal
    interest_earned: Decimal
    balance: Decimal


class ProjectionResponse(BaseModel):
    final_balance: Decimal
    total_contributed: Decimal
    total_interest_earned: Decimal
    schedule: List[ProjectionPoint]


class GoalPlannerRequest(BaseModel):
    target_amount: Decimal = Field(..., gt=0)
    current_amount: Decimal = Field(default=Decimal("0"), ge=0)
    annual_interest_rate: float = Field(default=0.0, ge=0, le=1)
    monthly_contribution: Optional[Decimal] = Field(default=None, ge=0)
    target_date: Optional[date] = None


class GoalPlannerResponse(BaseModel):
    months_needed: Optional[int] = None
    projected_completion_date: Optional[date] = None
    required_monthly_contribution: Optional[Decimal] = None
    feasible: Optional[bool] = None
