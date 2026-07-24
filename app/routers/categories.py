from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate
from app.services import category_service
from app.utils.enums import CategoryType

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryOut], summary="List the user's categories")
def list_categories(
    type: Optional[CategoryType] = Query(None, description="Filter by income or expense"),
    search: Optional[str] = Query(None, min_length=1, max_length=100, description="Search by name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return category_service.get_categories(db, current_user.id, type, search)


@router.post(
    "", response_model=CategoryOut, status_code=status.HTTP_201_CREATED, summary="Create a category"
)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return category_service.create_category(db, current_user.id, data)


@router.get("/{category_id}", response_model=CategoryOut, summary="Get a single category")
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return category_service.get_category_or_404(db, current_user.id, category_id)


@router.put("/{category_id}", response_model=CategoryOut, summary="Update a category")
def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return category_service.update_category(db, current_user.id, category_id, data)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a category",
    description="Fails if the category has any transactions or budgets attached to it.",
)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    category_service.delete_category(db, current_user.id, category_id)
    return None
