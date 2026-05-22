from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session, selectinload

from app.core.audit import write_audit_log
from app.core.auth import get_current_user, get_optional_user, require_admin_google, require_trusted_admin_origin
from app.core.coupons import get_valid_coupon, money, normalize_coupon_code
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.catalog import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User
from app.schemas.coupon import CouponValidateRequest, CouponValidateResponse
from app.schemas.order import OrderCreate, OrderRead, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def create_order(
    request: Request,
    payload: OrderCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> Order:
    # H3: collapse duplicate product_ids so a single item can't bypass per-row stock checks.
    aggregated: dict[str, int] = {}
    for item in payload.items:
        aggregated[item.product_id] = aggregated.get(item.product_id, 0) + item.quantity

    order = Order(
        customer_name=payload.customer_name,
        phone=payload.phone,
        address=payload.address,
        payment_method=payload.payment_method,
        user_id=user.id if user else None,
    )

    total = Decimal("0")
    decremented: list[tuple[str, int]] = []
    try:
        for product_id, quantity in aggregated.items():
            product = db.get(Product, product_id)
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

            # H3: atomic conditional decrement. Only succeeds if there is still enough stock
            # at the moment of UPDATE, preventing race conditions across concurrent orders.
            result = db.execute(
                update(Product)
                .where(Product.id == product_id, Product.stock >= quantity)
                .values(stock=Product.stock - quantity)
            )
            if result.rowcount == 0:
                raise HTTPException(
                    status_code=409,
                    detail=f"{product.name} does not have enough stock",
                )
            decremented.append((product_id, quantity))

            total += product.price * quantity
            order.items.append(
                OrderItem(product_id=product_id, quantity=quantity, unit_price=product.price)
            )

        discount = Decimal("0")
        if payload.coupon_code:
            coupon, discount = get_valid_coupon(db, payload.coupon_code, total)
            coupon.usage_count += 1
            order.coupon_code = normalize_coupon_code(payload.coupon_code)
            order.discount_amount = discount
        order.subtotal = total
        order.total = money(total - discount)
        db.add(order)
        db.commit()
        db.refresh(order)
        return order
    except HTTPException:
        # Roll the SQLAlchemy unit-of-work back so the order row is not persisted.
        # The atomic UPDATEs above are part of the same transaction — rollback restores stock.
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.post("/coupon/validate", response_model=CouponValidateResponse)
@limiter.limit("30/minute")
def validate_coupon(
    request: Request,
    payload: CouponValidateRequest,
    db: Session = Depends(get_db),
    _user: User | None = Depends(get_optional_user),
) -> CouponValidateResponse:
    _coupon, discount = get_valid_coupon(db, payload.code, payload.subtotal)
    total = money(payload.subtotal - discount)
    return CouponValidateResponse(
        code=normalize_coupon_code(payload.code),
        discount_amount=discount,
        total=total,
        message="Coupon applied",
    )


@router.get("/my", response_model=list[OrderRead])
def my_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/admin", response_model=list[OrderRead])
def admin_orders(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin_google),
    status_filter: OrderStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[Order]:
    stmt = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product)).order_by(Order.created_at.desc())
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
    admin: User = Depends(require_admin_google),
) -> Order:
    require_trusted_admin_origin(request)
    order = db.scalars(select(Order).options(selectinload(Order.items).selectinload(OrderItem.product)).where(Order.id == order_id)).first()
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
        request=request,
    )
    db.commit()
    db.refresh(order)
    return order
