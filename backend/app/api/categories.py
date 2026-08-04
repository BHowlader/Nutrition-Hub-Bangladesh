from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.audit import write_audit_log
from app.core.auth import require_admin_google, require_trusted_admin_origin
from app.core.cache import cache_delete_prefix
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.catalog import Category
from app.models.user import User
from app.schemas.catalog import CategoryCreate, CategoryRead, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.sort_order, Category.name)))


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
def create_category(
    request: Request,
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_google),
) -> Category:
    require_trusted_admin_origin(request)
    if db.query(Category).filter((Category.name == payload.name) | (Category.slug == payload.slug)).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name or slug already exists")
    category = Category(name=payload.name, slug=payload.slug, sort_order=payload.sort_order)
    db.add(category)
    db.flush()
    write_audit_log(
        db,
        actor=admin,
        action="category.create",
        entity_type="category",
        entity_id=category.id,
        summary=f"Created category {category.name}",
        request=request,
    )
    db.commit()
    db.refresh(category)
    return category


@router.patch("/{category_id}", response_model=CategoryRead)
@limiter.limit("60/minute")
def update_category(
    request: Request,
    category_id: str,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_google),
) -> Category:
    require_trusted_admin_origin(request)
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    changes = payload.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(category, key, value)

    write_audit_log(
        db,
        actor=admin,
        action="category.update",
        entity_type="category",
        entity_id=category.id,
        summary=f"Updated category {category.name}",
        metadata={"fields": sorted(changes.keys())},
        request=request,
    )
    db.commit()
    db.refresh(category)
    # Product payloads embed the category, so the cached product lists are stale too.
    cache_delete_prefix("products:")
    return category
