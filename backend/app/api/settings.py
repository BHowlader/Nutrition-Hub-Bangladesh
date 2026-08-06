from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.audit import write_audit_log
from app.core.auth import require_admin_google, require_trusted_admin_origin
from app.core.database import get_db
from app.models.settings import SiteSettings
from app.models.user import User
from app.schemas.settings import (
    CategoryImagesRead,
    CategoryImagesUpdate,
    HeroSettingsRead,
    HeroSettingsUpdate,
)

router = APIRouter(tags=["settings"])


def _get_or_create(db: Session) -> SiteSettings:
    row = db.get(SiteSettings, 1)
    if row is None:
        row = SiteSettings(id=1)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@router.get("/settings/hero", response_model=HeroSettingsRead)
def get_hero_settings(db: Session = Depends(get_db)) -> SiteSettings:
    return _get_or_create(db)


@router.put("/admin/hero", response_model=HeroSettingsRead)
def update_hero_settings(
    request: Request,
    payload: HeroSettingsUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_google),
) -> SiteSettings:
    require_trusted_admin_origin(request)
    row = _get_or_create(db)
    row.hero_description = payload.hero_description
    row.hero_product_slug_1 = payload.hero_product_slug_1
    row.hero_product_slug_2 = payload.hero_product_slug_2
    row.hero_product_slug_3 = payload.hero_product_slug_3
    write_audit_log(
        db,
        actor=admin,
        action="settings.hero.update",
        entity_type="site_settings",
        entity_id="1",
        summary="Updated hero section settings",
        request=request,
    )
    db.commit()
    db.refresh(row)
    return row


@router.get("/settings/category-images", response_model=CategoryImagesRead)
def get_category_images(db: Session = Depends(get_db)) -> SiteSettings:
    return _get_or_create(db)


@router.put("/admin/category-images", response_model=CategoryImagesRead)
def update_category_images(
    request: Request,
    payload: CategoryImagesUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_google),
) -> SiteSettings:
    require_trusted_admin_origin(request)
    row = _get_or_create(db)
    row.category_image_1 = payload.category_image_1
    row.category_image_2 = payload.category_image_2
    row.category_image_3 = payload.category_image_3
    row.category_image_4 = payload.category_image_4
    for slot in (1, 2, 3, 4):
        name = getattr(payload, f"category_name_{slot}")
        setattr(row, f"category_name_{slot}", name.strip() or None if name else None)
    write_audit_log(
        db,
        actor=admin,
        action="settings.category_images.update",
        entity_type="site_settings",
        entity_id="1",
        summary="Updated homepage category cards",
        request=request,
    )
    db.commit()
    db.refresh(row)
    return row
