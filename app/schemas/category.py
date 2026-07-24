from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.utils.enums import CategoryType

HEX_COLOR_PATTERN = r"^#[0-9A-Fa-f]{6}$"


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: CategoryType
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, pattern=HEX_COLOR_PATTERN)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, pattern=HEX_COLOR_PATTERN)


class CategoryOut(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_default: bool
    created_at: datetime


class CategoryMini(BaseModel):
    """Lightweight nested representation used inside transaction/budget responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
