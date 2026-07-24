from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.utils.enums import GoalStatus


class GoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    target_amount: Decimal = Field(..., gt=0)
    target_date: Optional[date] = None


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    target_amount: Optional[Decimal] = Field(None, gt=0)
    target_date: Optional[date] = None
    status: Optional[GoalStatus] = None


class GoalContribution(BaseModel):
    amount: Decimal = Field(..., gt=0)
    description: Optional[str] = Field(None, max_length=500)
    transaction_date: Optional[date] = None


class GoalOut(GoalBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    current_amount: Decimal
    status: GoalStatus
    created_at: datetime
    updated_at: datetime


class GoalProgress(BaseModel):
    goal_id: int
    name: str
    target_amount: Decimal
    current_amount: Decimal
    remaining_amount: Decimal
    percentage_complete: float
    target_date: Optional[date] = None
    days_remaining: Optional[int] = None
    projected_completion_date: Optional[date] = None
    required_monthly_contribution: Optional[Decimal] = None
    on_track: Optional[bool] = None
