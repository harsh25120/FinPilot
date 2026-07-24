from datetime import date
from decimal import Decimal
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.common import Page
from app.schemas.transaction import TransactionCreate, TransactionOut, TransactionUpdate
from app.services import transaction_service
from app.utils.enums import TransactionType
from app.utils.pagination import PaginationParams

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get(
    "",
    response_model=Page[TransactionOut],
    summary="List transactions with filtering, search, sorting, and pagination",
)
def list_transactions(
    type: Optional[TransactionType] = Query(None),
    category_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    min_amount: Optional[Decimal] = Query(None, ge=0),
    max_amount: Optional[Decimal] = Query(None, ge=0),
    search: Optional[str] = Query(None, max_length=200, description="Search in description"),
    sort_by: Literal["date", "amount", "created_at"] = Query("date"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items, meta = transaction_service.list_transactions(
        db,
        current_user.id,
        params,
        type_=type,
        category_id=category_id,
        date_from=date_from,
        date_to=date_to,
        min_amount=min_amount,
        max_amount=max_amount,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return {"items": items, "meta": meta}


@router.post(
    "",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a transaction",
    description=(
        "For type=income/expense, category_id is required. "
        "For type=transfer, goal_id is required (the transfer is treated as a "
        "contribution toward that financial goal)."
    ),
)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return transaction_service.create_transaction(
        db, current_user.id, data, current_user.preferred_currency
    )


@router.get("/{transaction_id}", response_model=TransactionOut, summary="Get a single transaction")
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return transaction_service.get_transaction_or_404(db, current_user.id, transaction_id)


@router.put("/{transaction_id}", response_model=TransactionOut, summary="Update a transaction")
def update_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return transaction_service.update_transaction(db, current_user.id, transaction_id, data)


@router.delete(
    "/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a transaction"
)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    transaction_service.delete_transaction(db, current_user.id, transaction_id)
    return None
