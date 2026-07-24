from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.dashboard import CategoryBreakdownItem


class SpendingByCategoryResponse(BaseModel):
    start_date: str
    end_date: str
    total_spent: Decimal
    breakdown: List[CategoryBreakdownItem]


class IncomeVsExpensePoint(BaseModel):
    period: str
    income: Decimal
    expense: Decimal
    net: Decimal


class IncomeVsExpenseResponse(BaseModel):
    points: List[IncomeVsExpensePoint]


class SavingsRatePoint(BaseModel):
    period: str
    income: Decimal
    savings: Decimal
    savings_rate: float


class SavingsRateResponse(BaseModel):
    average_savings_rate: float
    points: List[SavingsRatePoint]


class TrendItem(BaseModel):
    category_id: int
    category_name: str
    current_period_amount: Decimal
    previous_period_amount: Decimal
    change_amount: Decimal
    change_percentage: Optional[float] = None
    direction: str


class TrendsResponse(BaseModel):
    trends: List[TrendItem]
