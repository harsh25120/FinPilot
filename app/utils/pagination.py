from typing import Any, Dict, Tuple

from fastapi import Query
from sqlalchemy.orm import Query as SAQuery


class PaginationParams:
    """Reusable class-based FastAPI dependency for page/page_size query params."""

    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number, starting at 1"),
        page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    ) -> None:
        self.page = page
        self.page_size = page_size

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


def paginate(query: SAQuery, params: PaginationParams) -> Tuple[list, Dict[str, Any]]:
    """Apply offset/limit to a SQLAlchemy query and return (items, meta)."""
    total = query.count()
    items = query.offset(params.offset).limit(params.limit).all()
    pages = (total + params.page_size - 1) // params.page_size if total > 0 else 0
    meta = {
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
        "pages": pages,
    }
    return items, meta
