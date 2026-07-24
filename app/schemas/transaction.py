from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.category import CategoryMini
from app.utils.enums import TransactionType


class TransactionBase(BaseModel):
    type: TransactionType
    amount: Decimal = Field(..., gt=0, description="Always a positive amount")
    category_id: Optional[int] = Field(
        None, description="Required for income/expense, forbidden for transfer"
    )
    goal_id: Optional[int] = Field(None, description="Required for transfer, forbidden otherwise")
    description: Optional[str] = Field(None, max_length=500)
    transaction_date: date


class TransactionCreate(TransactionBase):
    @model_validator(mode="after")
    def _validate_type_specific_fields(self) -> "TransactionCreate":
        if self.type == TransactionType.transfer:
            if self.goal_id is None:
                raise ValueError("goal_id is required for transfer transactions")
            if self.category_id is not None:
                raise ValueError("category_id must not be set for transfer transactions")
        else:
            if self.category_id is None:
                raise ValueError("category_id is required for income and expense transactions")
            if self.goal_id is not None:
                raise ValueError("goal_id must not be set for income or expense transactions")
        return self


class TransactionUpdate(BaseModel):
    category_id: Optional[int] = None
    goal_id: Optional[int] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    description: Optional[str] = Field(None, max_length=500)
    transaction_date: Optional[date] = None


class TransactionOut(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    currency: str
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryMini] = None
