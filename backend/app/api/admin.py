from decimal import Decimal

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.audit import write_audit_log
from app.core.auth import require_admin_google, require_owner, require_trusted_admin_origin
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.audit import AuditLog
from app.models.catalog import Product, ProductStatus
from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole
from app.schemas.admin import AdminStats, AuditLogRead, CustomerSummary, UserAdminRead, UserRoleUpdate
from app.schemas.order import OrderRead

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


@router.get("/customers", response_model=list[CustomerSummary])
def admin_customers(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin_google),
    q: str | None = Query(default=None, description="Search by name, email, or phone"),
    limit: int = Query(default=200, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[CustomerSummary]:
    # Start from customer users only. Privileged accounts are intentionally excluded.
    user_stmt = select(User).where(User.role == UserRole.customer)
    if q:
        like = f"%{q.lower()}%"
        user_stmt = user_stmt.where(
            func.lower(User.name).like(like)
            | func.lower(User.email).like(like)
            | func.lower(func.coalesce(User.phone, "")).like(like)
        )
    user_stmt = user_stmt.order_by(User.created_at.desc()).offset(offset).limit(limit)
    users = list(db.scalars(user_stmt))
    if not users:
        return []

    user_ids = [u.id for u in users]

    # Aggregate order stats per user in a single query.
    agg_rows = db.execute(
        select(
            Order.user_id,
            func.count(Order.id).label("order_count"),
            func.coalesce(
                func.sum(
                    func.case((Order.status != OrderStatus.cancelled, Order.total), else_=0)
                ),
                0,
            ).label("total_spent"),
            func.sum(func.case((Order.status == OrderStatus.pending, 1), else_=0)).label("pending_count"),
            func.sum(func.case((Order.status == OrderStatus.delivered, 1), else_=0)).label("delivered_count"),
            func.sum(func.case((Order.status == OrderStatus.cancelled, 1), else_=0)).label("cancelled_count"),
            func.max(Order.created_at).label("last_order_at"),
        )
        .where(Order.user_id.in_(user_ids))
        .group_by(Order.user_id)
    ).all()
    agg_by_user = {row.user_id: row for row in agg_rows}

    # Fetch all orders for these users with items, then bucket by user_id.
    orders_stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id.in_(user_ids))
        .order_by(Order.created_at.desc())
    )
    orders_by_user: dict[str, list[Order]] = {}
    for o in db.scalars(orders_stmt):
        orders_by_user.setdefault(o.user_id, []).append(o)

    summaries: list[CustomerSummary] = []
    for u in users:
        row = agg_by_user.get(u.id)
        user_orders = orders_by_user.get(u.id, [])
        summaries.append(
            CustomerSummary(
                id=u.id,
                name=u.name,
                email=u.email,
                phone=u.phone,
                address=u.address,
                photo_url=u.photo_url,
                auth_provider=u.auth_provider.value if hasattr(u.auth_provider, "value") else str(u.auth_provider),
                created_at=u.created_at,
                order_count=int(row.order_count) if row else 0,
                total_spent=Decimal(row.total_spent) if row else Decimal("0"),
                pending_count=int(row.pending_count) if row else 0,
                delivered_count=int(row.delivered_count) if row else 0,
                cancelled_count=int(row.cancelled_count) if row else 0,
                last_order_at=row.last_order_at if row else None,
                orders=[OrderRead.model_validate(o) for o in user_orders],
            )
        )
    return summaries


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
    # M5: invalidate every outstanding JWT for this user so a demotion takes effect immediately.
    user.token_version = int(user.token_version or 0) + 1
    write_audit_log(
        db,
        actor=owner,
        action="role.update",
        entity_type="user",
        entity_id=user.id,
        summary=f"Changed {user.email} role from {old_role.value} to {user.role.value}",
        request=request,
    )
    db.commit()
    db.refresh(user)
    return user
