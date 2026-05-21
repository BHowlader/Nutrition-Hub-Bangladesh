from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.audit import write_audit_log
from app.core.auth import get_current_user, get_optional_user, require_admin, require_trusted_admin_origin
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.catalog import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User
from app.schemas.order import OrderCreate, OrderRead, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> Order:
    order = Order(
        customer_name=payload.customer_name,
        phone=payload.phone,
        address=payload.address,
        payment_method=payload.payment_method,
        user_id=user.id if user else None,
    )

    total = Decimal("0")
    for item in payload.items:
        product = db.get(Product, item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.stock < item.quantity:
            raise HTTPException(status_code=409, detail=f"{product.name} does not have enough stock")

        product.stock -= item.quantity
        total += product.price * item.quantity
        order.items.append(OrderItem(product_id=product.id, quantity=item.quantity, unit_price=product.price))

    order.total = total
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/my", response_model=list[OrderRead])
def my_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()


@router.get("/admin", response_model=list[OrderRead])
def admin_orders(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
    status_filter: OrderStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[Order]:
    stmt = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
    if status_filter:
        stmt = stmt.where(Order.status == status_filter)
    return list(db.scalars(stmt.offset(offset).limit(limit)))


@router.patch("/admin/{order_id}/status", response_model=OrderRead)
@limiter.limit("60/minute")
def update_order_status(
    request: Request,
    order_id: str,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Order:
    require_trusted_admin_origin(request)
    order = db.scalars(select(Order).options(selectinload(Order.items)).where(Order.id == order_id)).first()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    try:
        new_status = OrderStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid order status")
    old_status = order.status
    order.status = new_status
    write_audit_log(
        db,
        actor=admin,
        action="order.status",
        entity_type="order",
        entity_id=order.id,
        summary=f"Changed order {order.id[:8]} from {old_status.value} to {new_status.value}",
    )
    db.commit()
    db.refresh(order)
    return order
