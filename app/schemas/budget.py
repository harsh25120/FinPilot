from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.category import CategoryMini
from app.utils.enums import BudgetPeriod


class BudgetBase(BaseModel):
    category_id: int
    amount: Decimal = Field(..., gt=0)
    period: BudgetPeriod = BudgetPeriod.monthly
    start_date: date
    alert_threshold: float = Field(default=0.8, ge=0, le=1, description="Fraction, e.g. 0.8 = 80%")


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0)
    alert_threshold: Optional[float] = Field(None, ge=0, le=1)
    start_date: Optional[date] = None


class BudgetOut(BudgetBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    end_date: date
    created_at: datetime
    updated_at: datetime
    category: CategoryMini


class BudgetStatus(BaseModel):
    budget_id: int
    category_id: int
    category_name: str
    period: BudgetPeriod
    limit: Decimal
    spent: Decimal
    remaining: Decimal
    percentage_used: float
    is_exceeded: bool
    is_alert: bool
    start_date: date
    end_date: date
