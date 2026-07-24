from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    monthly_income = Column(Numeric(12, 2), nullable=False, default=0)
    preferred_currency = Column(String(3), nullable=False, default="USD")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    categories = relationship(
        "Category", back_populates="owner", cascade="all, delete-orphan", passive_deletes=True
    )
    transactions = relationship(
        "Transaction", back_populates="owner", cascade="all, delete-orphan", passive_deletes=True
    )
    budgets = relationship(
        "Budget", back_populates="owner", cascade="all, delete-orphan", passive_deletes=True
    )
    goals = relationship(
        "Goal", back_populates="owner", cascade="all, delete-orphan", passive_deletes=True
    )
    refresh_tokens = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"
