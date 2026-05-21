from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.audit import write_audit_log
from app.core.auth import require_admin_google, require_trusted_admin_origin
from app.core.database import get_db
from app.models.settings import SiteSettings
from app.models.user import User
from app.schemas.settings import HeroSettingsRead, HeroSettingsUpdate

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
