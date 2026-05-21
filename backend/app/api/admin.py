from decimal import Decimal

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.audit import write_audit_log
from app.core.auth import require_admin_google, require_owner, require_trusted_admin_origin
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.audit import AuditLog
from app.models.catalog import Product, ProductStatus
from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole
from app.schemas.admin import AdminStats, AuditLogRead, UserAdminRead, UserRoleUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
def admin_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin_google),
) -> AdminStats:
    revenue = db.scalar(select(func.coalesce(func.sum(Order.total), 0)).where(Order.status != OrderStatus.cancelled))
    return AdminStats(
        orders=db.scalar(select(func.count()).select_from(Order)) or 0,
        pending_orders=db.scalar(select(func.count()).select_from(Order).where(Order.status == OrderStatus.pending)) or 0,
        revenue=revenue or Decimal("0"),
        products=db.scalar(select(func.count()).select_from(Product)) or 0,
        published_products=db.scalar(select(func.count()).select_from(Product).where(Product.status == ProductStatus.published)) or 0,
        low_stock_products=db.scalar(select(func.count()).select_from(Product).where(Product.stock < 10)) or 0,
    )


@router.get("/audit-logs", response_model=list[AuditLogRead])
def audit_logs(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin_google),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[AuditLog]:
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
    return list(db.scalars(stmt))


@router.get("/users", response_model=list[UserAdminRead])
def admin_users(
    db: Session = Depends(get_db),
    _owner: User = Depends(require_owner),
    limit: int = Query(default=100, ge=1, le=200),
) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.desc()).limit(limit)))


@router.patch("/users/{user_id}/role", response_model=UserAdminRead)
@limiter.limit("20/minute")
def update_user_role(
    request: Request,
    user_id: str,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    owner: User = Depends(require_owner),
) -> User:
    require_trusted_admin_origin(request)
    user = db.get(User, user_id)
    if user is None:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    old_role = user.role
    user.role = UserRole(payload.role)
    user.is_admin = user.role in {UserRole.editor, UserRole.admin, UserRole.owner}
    write_audit_log(
        db,
        actor=owner,
        action="role.update",
        entity_type="user",
        entity_id=user.id,
        summary=f"Changed {user.email} role from {old_role.value} to {user.role.value}",
    )
    db.commit()
    db.refresh(user)
    return user
