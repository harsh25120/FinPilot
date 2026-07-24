from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.goal import GoalOut
from app.schemas.transaction import TransactionOut


class CategoryBreakdownItem(BaseModel):
    category_id: int
    category_name: str
    amount: Decimal
    percentage: float
    color: Optional[str] = None
    icon: Optional[str] = None


class DashboardOverview(BaseModel):
    month: str
    total_income: Decimal
    total_expense: Decimal
    net_savings: Decimal
    savings_rate: float
    monthly_income_target: Decimal
    total_balance: Decimal
    top_spending_categories: List[CategoryBreakdownItem]
    recent_transactions: List[TransactionOut]
    active_goals: List[GoalOut]
    budget_alerts_count: int


class CashFlowPoint(BaseModel):
    period: str
    income: Decimal
    expense: Decimal
    net: Decimal


class CashFlowResponse(BaseModel):
    points: List[CashFlowPoint]
