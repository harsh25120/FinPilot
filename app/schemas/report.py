from decimal import Decimal
from typing import List

from pydantic import BaseModel

from app.schemas.budget import BudgetStatus
from app.schemas.dashboard import CategoryBreakdownItem
from app.schemas.goal import GoalProgress


class MonthlyReport(BaseModel):
    year: int
    month: int
    total_income: Decimal
    total_expense: Decimal
    net_savings: Decimal
    savings_rate: float
    transaction_count: int
    income_breakdown: List[CategoryBreakdownItem]
    expense_breakdown: List[CategoryBreakdownItem]
    budgets: List[BudgetStatus]
    goals_progress: List[GoalProgress]


class YearlyMonthSummary(BaseModel):
    month: int
    income: Decimal
    expense: Decimal
    net: Decimal


class YearlyReport(BaseModel):
    year: int
    total_income: Decimal
    total_expense: Decimal
    net_savings: Decimal
    monthly_breakdown: List[YearlyMonthSummary]
