from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.audit import write_audit_log
from app.core.auth import require_admin, require_trusted_admin_origin
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.catalog import Category
from app.models.user import User
from app.schemas.catalog import CategoryCreate, CategoryRead

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.name)))


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
def create_category(
    request: Request,
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Category:
    require_trusted_admin_origin(request)
    if db.query(Category).filter((Category.name == payload.name) | (Category.slug == payload.slug)).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name or slug already exists")
    category = Category(name=payload.name, slug=payload.slug)
    db.add(category)
    db.flush()
    write_audit_log(
        db,
        actor=admin,
        action="category.create",
        entity_type="category",
        entity_id=category.id,
        summary=f"Created category {category.name}",
    )
    db.commit()
    db.refresh(category)
    return category
