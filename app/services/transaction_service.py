"""
Transaction business logic: creating, listing (with filtering, sorting, and
pagination), updating, and deleting transactions.

Income and expense transactions are always tied to a category. Transfer
transactions are always tied to a financial goal instead and represent a
contribution toward it — creating, editing, or deleting a transfer keeps the
goal's current_amount in sync via `goal_service.apply_goal_delta`.
"""
from datetime import date
from decimal import Decimal
from typing import Dict, Optional, Tuple

from sqlalchemy import asc, desc, func
from sqlalchemy.orm import Query, Session, joinedload

from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate
from app.services.goal_service import apply_goal_delta, get_goal_or_404
from app.utils.enums import TransactionType
from app.utils.exceptions import BadRequestException, NotFoundException
from app.utils.money import to_money
from app.utils.pagination import PaginationParams, paginate

SORTABLE_FIELDS = {
    "date": Transaction.transaction_date,
    "amount": Transaction.amount,
    "created_at": Transaction.created_at,
}


def sum_transactions(
    db: Session,
    user_id: int,
    type_: TransactionType,
    start: Optional[date] = None,
    end: Optional[date] = None,
) -> Decimal:
    """
    Total amount of a user's transactions of one type, optionally restricted
    to a date range (pass neither bound for an all-time total). Shared by
    the dashboard and analytics services so each doesn't need its own copy
    of this query.
    """
    query = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id, Transaction.type == type_
    )
    if start:
        query = query.filter(Transaction.transaction_date >= start)
    if end:
        query = query.filter(Transaction.transaction_date <= end)
    return to_money(query.scalar())


def _validate_category(
    db: Session, user_id: int, category_id: int, expected_type: TransactionType
) -> Category:
    """Look up a category and make sure its type matches the transaction type."""
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id)
        .first()
    )
    if category is None:
        raise NotFoundException("Category not found")
    if category.type.value != expected_type.value:
        raise BadRequestException(
            f"Category type '{category.type.value}' does not match transaction type "
            f"'{expected_type.value}'"
        )
    return category


def create_transaction(
    db: Session, user_id: int, data: TransactionCreate, currency: str
) -> Transaction:
    """
    Create a transaction. The schema-level validator already guarantees
    transfers come with a goal_id (and no category_id) while income/expense
    come with a category_id (and no goal_id) — here we just look up and
    validate whichever one applies, and credit the goal for transfers.
    """
    is_transfer = data.type == TransactionType.transfer

    if is_transfer:
        goal = get_goal_or_404(db, user_id, data.goal_id)
        category_id, goal_id = None, data.goal_id
    else:
        _validate_category(db, user_id, data.category_id, data.type)
        goal = None
        category_id, goal_id = data.category_id, None

    transaction = Transaction(
        user_id=user_id,
        category_id=category_id,
        goal_id=goal_id,
        type=data.type,
        amount=data.amount,
        currency=currency,
        description=data.description,
        transaction_date=data.transaction_date,
    )
    db.add(transaction)

    if goal is not None:
        apply_goal_delta(db, goal, data.amount)

    db.commit()
    db.refresh(transaction)
    return transaction


def get_transaction_or_404(db: Session, user_id: int, transaction_id: int) -> Transaction:
    transaction = (
        db.query(Transaction)
        .options(joinedload(Transaction.category))
        .filter(Transaction.id == transaction_id, Transaction.user_id == user_id)
        .first()
    )
    if transaction is None:
        raise NotFoundException("Transaction not found")
    return transaction


def list_transactions(
    db: Session,
    user_id: int,
    params: PaginationParams,
    type_: Optional[TransactionType] = None,
    category_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    min_amount: Optional[Decimal] = None,
    max_amount: Optional[Decimal] = None,
    search: Optional[str] = None,
    sort_by: str = "date",
    sort_order: str = "desc",
) -> Tuple[list, Dict]:
    """List a user's transactions, applying whichever optional filters were given."""
    query: Query = (
        db.query(Transaction)
        .options(joinedload(Transaction.category))
        .filter(Transaction.user_id == user_id)
    )

    if type_:
        query = query.filter(Transaction.type == type_)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if date_from:
        query = query.filter(Transaction.transaction_date >= date_from)
    if date_to:
        query = query.filter(Transaction.transaction_date <= date_to)
    if min_amount is not None:
        query = query.filter(Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Transaction.amount <= max_amount)
    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))

    sort_column = SORTABLE_FIELDS.get(sort_by, Transaction.transaction_date)
    order_func = desc if sort_order == "desc" else asc
    query = query.order_by(order_func(sort_column), desc(Transaction.id))

    return paginate(query, params)


def _validate_transaction_update(
    db: Session, user_id: int, transaction: Transaction, update_data: dict
) -> None:
    """Enforce the same category/goal rules on update as on create."""
    if transaction.type == TransactionType.transfer:
        if update_data.get("category_id") is not None:
            raise BadRequestException("Transfer transactions cannot have a category")
        return

    if update_data.get("goal_id") is not None:
        raise BadRequestException("Only transfer transactions can be linked to a goal")
    if "category_id" in update_data and update_data["category_id"] is None:
        raise BadRequestException(
            "category_id cannot be removed from an income or expense transaction"
        )
    if "category_id" in update_data:
        _validate_category(db, user_id, update_data["category_id"], transaction.type)


def _resync_goal_balance_for_update(
    db: Session, user_id: int, transaction: Transaction, update_data: dict
) -> None:
    """
    Update goal balances after editing a transfer transaction.
    """
    previous_goal_id = transaction.goal_id
    previous_amount = transaction.amount
    new_goal_id = update_data.get("goal_id", previous_goal_id)
    new_amount = update_data.get("amount", previous_amount)

    if previous_goal_id is not None:
        previous_goal = get_goal_or_404(db, user_id, previous_goal_id)
        apply_goal_delta(db, previous_goal, -previous_amount)

    if new_goal_id is not None:
        new_goal = get_goal_or_404(db, user_id, new_goal_id)
        apply_goal_delta(db, new_goal, new_amount)


def update_transaction(
    db: Session, user_id: int, transaction_id: int, data: TransactionUpdate
) -> Transaction:
    """
    Update a transaction.
    """
    transaction = get_transaction_or_404(db, user_id, transaction_id)
    update_data = data.model_dump(exclude_unset=True)

    _validate_transaction_update(db, user_id, transaction, update_data)

    if transaction.type == TransactionType.transfer:
        _resync_goal_balance_for_update(db, user_id, transaction, update_data)

    for field, value in update_data.items():
        setattr(transaction, field, value)

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(db: Session, user_id: int, transaction_id: int) -> None:
    """Delete a transaction, reversing its effect on a linked goal if it was a transfer."""
    transaction = get_transaction_or_404(db, user_id, transaction_id)

    if transaction.type == TransactionType.transfer and transaction.goal_id is not None:
        goal = get_goal_or_404(db, user_id, transaction.goal_id)
        apply_goal_delta(db, goal, -transaction.amount)

    db.delete(transaction)
    db.commit()
