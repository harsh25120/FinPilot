from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.utils.validators import normalize_currency_code, validate_password_strength


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=72)
    monthly_income: Decimal = Field(default=Decimal("0"), ge=0)
    preferred_currency: str = Field(default="USD", min_length=3, max_length=3)

    @field_validator("password")
    @classmethod
    def _check_password_strength(cls, v: str) -> str:
        return validate_password_strength(v)

    @field_validator("preferred_currency")
    @classmethod
    def _normalize_currency(cls, v: str) -> str:
        return normalize_currency_code(v)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    monthly_income: Optional[Decimal] = Field(None, ge=0)
    preferred_currency: Optional[str] = Field(None, min_length=3, max_length=3)

    @field_validator("preferred_currency")
    @classmethod
    def _normalize_currency(cls, v: Optional[str]) -> Optional[str]:
        return normalize_currency_code(v) if v else v


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=72)

    @field_validator("new_password")
    @classmethod
    def _check_password_strength(cls, v: str) -> str:
        return validate_password_strength(v)


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    monthly_income: Decimal
    preferred_currency: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
