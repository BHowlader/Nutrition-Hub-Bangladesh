from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.auth import require_admin, require_trusted_admin_origin
from app.core.cache import cache_delete_prefix, cache_get_json, cache_set_json
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.catalog import Category, Product, ProductStatus
from app.models.user import User
from app.schemas.catalog import ProductCreate, ProductRead, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
def list_products(
    response: Response,
    db: Session = Depends(get_db),
    status_filter: ProductStatus | None = Query(default=ProductStatus.published, alias="status"),
    category: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[Product]:
    cache_key = f"products:list:status={status_filter}:category={category}:limit={limit}:offset={offset}"
    cached = cache_get_json(cache_key)
    if cached is not None:
        response.headers["Cache-Control"] = "public, max-age=30, s-maxage=120, stale-while-revalidate=300"
        response.headers["X-Total-Count"] = str(cached["total"])
        response.headers["X-Limit"] = str(limit)
        response.headers["X-Offset"] = str(offset)
        return cached["items"]

    stmt = select(Product).options(selectinload(Product.category))
    count_stmt = select(func.count()).select_from(Product)
    if status_filter:
        stmt = stmt.where(Product.status == status_filter)
        count_stmt = count_stmt.where(Product.status == status_filter)
    if category:
        stmt = stmt.join(Category, Product.category_id == Category.id).where(Category.name == category)
        count_stmt = count_stmt.join(Category, Product.category_id == Category.id).where(Category.name == category)
    total = db.scalar(count_stmt) or 0
    stmt = stmt.order_by(Product.created_at.desc()).offset(offset).limit(limit)
    response.headers["Cache-Control"] = "public, max-age=30, s-maxage=120, stale-while-revalidate=300"
    response.headers["X-Total-Count"] = str(total)
    response.headers["X-Limit"] = str(limit)
    response.headers["X-Offset"] = str(offset)
    products = list(db.scalars(stmt))
    cache_set_json(
        cache_key,
        {
            "total": total,
            "items": [ProductRead.model_validate(product).model_dump(mode="json") for product in products],
        },
        ttl=120,
    )
    return products


@router.get("/by-slug/{slug}", response_model=ProductRead)
def get_product_by_slug(slug: str, response: Response, db: Session = Depends(get_db)) -> Product:
    cache_key = f"products:slug:{slug}"
    cached = cache_get_json(cache_key)
    if cached is not None:
        response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
        return cached

    product = db.scalars(
        select(Product).options(selectinload(Product.category)).where(Product.slug == slug)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    cache_set_json(cache_key, ProductRead.model_validate(product).model_dump(mode="json"), ttl=300)
    return product


@router.get("/admin", response_model=list[ProductRead])
def admin_list_products(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> list[Product]:
    stmt = select(Product).options(selectinload(Product.category)).order_by(Product.created_at.desc())
    return list(db.scalars(stmt))


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
def create_product(
    request: Request,
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> Product:
    require_trusted_admin_origin(request)
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    cache_delete_prefix("products:")
    return product


@router.patch("/{product_id}", response_model=ProductRead)
@limiter.limit("60/minute")
def update_product(
    request: Request,
    product_id: str,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> Product:
    require_trusted_admin_origin(request)
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    cache_delete_prefix("products:")
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/minute")
def delete_product(
    request: Request,
    product_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> None:
    require_trusted_admin_origin(request)
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    cache_delete_prefix("products:")
