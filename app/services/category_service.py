from typing import List, Optional

from sqlalchemy.orm import Query, Session

from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.utils.enums import CategoryType
from app.utils.exceptions import BadRequestException, ConflictException, NotFoundException

# (name, type, icon, color) — seeded automatically for every new user on registration.
DEFAULT_CATEGORIES = [
    ("Salary", CategoryType.income, "briefcase", "#22C55E"),
    ("Freelance", CategoryType.income, "laptop", "#16A34A"),
    ("Investments", CategoryType.income, "trending-up", "#0EA5E9"),
    ("Other Income", CategoryType.income, "plus-circle", "#10B981"),
    ("Groceries", CategoryType.expense, "shopping-cart", "#F97316"),
    ("Rent", CategoryType.expense, "home", "#EF4444"),
    ("Utilities", CategoryType.expense, "zap", "#F59E0B"),
    ("Transportation", CategoryType.expense, "car", "#6366F1"),
    ("Dining Out", CategoryType.expense, "coffee", "#EC4899"),
    ("Entertainment", CategoryType.expense, "film", "#8B5CF6"),
    ("Healthcare", CategoryType.expense, "heart", "#DC2626"),
    ("Insurance", CategoryType.expense, "shield", "#0891B2"),
    ("Shopping", CategoryType.expense, "shopping-bag", "#D946EF"),
    ("Education", CategoryType.expense, "book-open", "#2563EB"),
    ("Savings", CategoryType.expense, "piggy-bank", "#14B8A6"),
    ("Other Expense", CategoryType.expense, "more-horizontal", "#6B7280"),
]


def create_default_categories(db: Session, user_id: int) -> None:
    categories = [
        Category(user_id=user_id, name=name, type=ctype, icon=icon, color=color, is_default=True)
        for name, ctype, icon, color in DEFAULT_CATEGORIES
    ]
    db.add_all(categories)
    db.commit()


def get_categories(
    db: Session,
    user_id: int,
    type_: Optional[CategoryType] = None,
    search: Optional[str] = None,
) -> List[Category]:
    query: Query = db.query(Category).filter(Category.user_id == user_id)
    if type_:
        query = query.filter(Category.type == type_)
    if search:
        query = query.filter(Category.name.ilike(f"%{search}%"))
    return query.order_by(Category.name.asc()).all()


def get_category_or_404(db: Session, user_id: int, category_id: int) -> Category:
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id)
        .first()
    )
    if category is None:
        raise NotFoundException("Category not found")
    return category


def create_category(db: Session, user_id: int, data: CategoryCreate) -> Category:
    existing = (
        db.query(Category)
        .filter(
            Category.user_id == user_id,
            Category.name.ilike(data.name),
            Category.type == data.type,
        )
        .first()
    )
    if existing:
        raise ConflictException("A category with this name and type already exists")

    category = Category(user_id=user_id, **data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db: Session, user_id: int, category_id: int, data: CategoryUpdate) -> Category:
    category = get_category_or_404(db, user_id, category_id)
    update_data = data.model_dump(exclude_unset=True)

    if "name" in update_data:
        duplicate = (
            db.query(Category)
            .filter(
                Category.user_id == user_id,
                Category.id != category_id,
                Category.name.ilike(update_data["name"]),
                Category.type == category.type,
            )
            .first()
        )
        if duplicate:
            raise ConflictException("A category with this name and type already exists")

    for field, value in update_data.items():
        setattr(category, field, value)

    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, user_id: int, category_id: int) -> None:
    category = get_category_or_404(db, user_id, category_id)

    has_transactions = (
        db.query(Transaction.id).filter(Transaction.category_id == category_id).first()
    )
    if has_transactions:
        raise BadRequestException(
            "Cannot delete a category with existing transactions. Reassign or delete them first."
        )

    has_budgets = db.query(Budget.id).filter(Budget.category_id == category_id).first()
    if has_budgets:
        raise BadRequestException(
            "Cannot delete a category with existing budgets. Delete the budgets first."
        )

    db.delete(category)
    db.commit()
