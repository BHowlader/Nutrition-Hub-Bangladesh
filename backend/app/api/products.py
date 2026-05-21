from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import require_admin
from app.core.database import get_db
from app.models.catalog import Product, ProductStatus
from app.models.user import User
from app.schemas.catalog import ProductCreate, ProductRead, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
def list_products(
    db: Session = Depends(get_db),
    status_filter: ProductStatus | None = Query(default=ProductStatus.published, alias="status"),
    category: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[Product]:
    from app.models.catalog import Category
    stmt = select(Product).order_by(Product.created_at.desc())
    if status_filter:
        stmt = stmt.where(Product.status == status_filter)
    if category:
        stmt = stmt.join(Category, Product.category_id == Category.id).where(Category.name == category)
    stmt = stmt.offset(offset).limit(limit)
    return list(db.scalars(stmt))


@router.get("/by-slug/{slug}", response_model=ProductRead)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)) -> Product:
    product = db.query(Product).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/admin", response_model=list[ProductRead])
def admin_list_products(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> list[Product]:
    stmt = select(Product).order_by(Product.created_at.desc())
    return list(db.scalars(stmt))


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> Product:
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> Product:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> None:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
