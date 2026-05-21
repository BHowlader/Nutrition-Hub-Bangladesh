import hashlib
import os
import time
from uuid import uuid4

import requests
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.audit import write_audit_log
from app.core.auth import require_admin_google, require_trusted_admin_origin
from app.core.cache import cache_delete_prefix, cache_get_json, cache_set_json
from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.catalog import Category, Product, ProductStatus
from app.models.user import User
from app.schemas.catalog import ProductCreate, ProductRead, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "uploads", "products")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


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
    _admin: User = Depends(require_admin_google),
) -> list[Product]:
    stmt = select(Product).options(selectinload(Product.category)).order_by(Product.created_at.desc())
    return list(db.scalars(stmt))


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
def create_product(
    request: Request,
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin_google),
) -> Product:
    require_trusted_admin_origin(request)
    product = Product(**payload.model_dump())
    db.add(product)
    db.flush()
    write_audit_log(
        db,
        actor=_admin,
        action="product.create",
        entity_type="product",
        entity_id=product.id,
        summary=f"Created product {product.name}",
    )
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
    _admin: User = Depends(require_admin_google),
) -> Product:
    require_trusted_admin_origin(request)
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    changes = payload.model_dump(exclude_unset=True)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)

    write_audit_log(
        db,
        actor=_admin,
        action="product.update",
        entity_type="product",
        entity_id=product.id,
        summary=f"Updated product {product.name}",
        metadata={"fields": sorted(changes.keys())},
    )
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
    _admin: User = Depends(require_admin_google),
) -> None:
    require_trusted_admin_origin(request)
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    write_audit_log(
        db,
        actor=_admin,
        action="product.delete",
        entity_type="product",
        entity_id=product.id,
        summary=f"Deleted product {product.name}",
    )
    db.delete(product)
    db.commit()
    cache_delete_prefix("products:")


@router.post("/admin/upload-image")
@limiter.limit("30/minute")
def upload_product_image(
    request: Request,
    file: UploadFile,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_google),
) -> dict[str, str]:
    require_trusted_admin_origin(request)
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Image must be JPEG, PNG, or WEBP")

    content = file.file.read(MAX_IMAGE_BYTES + 1)
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Image exceeds 5 MB limit")

    if settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret:
        timestamp = str(int(time.time()))
        public_id = f"nutrition-hub/products/{uuid4().hex}"
        to_sign = f"public_id={public_id}&timestamp={timestamp}{settings.cloudinary_api_secret}"
        signature = hashlib.sha1(to_sign.encode("utf-8")).hexdigest()
        res = requests.post(
            f"https://api.cloudinary.com/v1_1/{settings.cloudinary_cloud_name}/image/upload",
            data={
                "api_key": settings.cloudinary_api_key,
                "timestamp": timestamp,
                "public_id": public_id,
                "signature": signature,
            },
            files={"file": (file.filename or "product-image", content, file.content_type)},
            timeout=20,
        )
        if not res.ok:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Cloudinary upload failed")
        url = res.json()["secure_url"]
    else:
        ext = ALLOWED_IMAGE_TYPES[file.content_type]
        filename = f"{uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as buf:
            buf.write(content)
        url = f"/static/uploads/products/{filename}"

    write_audit_log(
        db,
        actor=admin,
        action="product.image_upload",
        entity_type="product",
        entity_id=None,
        summary="Uploaded product image",
        metadata={"image_url": url},
    )
    db.commit()
    return {"image_url": url}
