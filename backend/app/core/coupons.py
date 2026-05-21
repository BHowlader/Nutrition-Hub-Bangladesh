from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.coupon import Coupon, CouponDiscountType


CENT = Decimal("0.01")


def normalize_coupon_code(code: str) -> str:
    return code.strip().upper()


def money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def calculate_coupon_discount(coupon: Coupon, subtotal: Decimal, *, now: datetime | None = None) -> Decimal:
    now = now or datetime.utcnow()
    if not coupon.active:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Coupon is inactive")
    if coupon.starts_at and coupon.starts_at > now:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Coupon is not active yet")
    if coupon.ends_at and coupon.ends_at < now:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Coupon has expired")
    if coupon.usage_limit is not None and coupon.usage_count >= coupon.usage_limit:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Coupon usage limit reached")
    if subtotal < Decimal(coupon.min_order_amount or 0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Minimum order amount is Tk {money(Decimal(coupon.min_order_amount or 0))}",
        )

    if coupon.discount_type == CouponDiscountType.percent:
        discount = subtotal * Decimal(coupon.value) / Decimal("100")
        if coupon.max_discount_amount is not None:
            discount = min(discount, Decimal(coupon.max_discount_amount))
    else:
        discount = Decimal(coupon.value)

    return money(min(discount, subtotal))


def get_valid_coupon(db: Session, code: str, subtotal: Decimal) -> tuple[Coupon, Decimal]:
    coupon = db.scalar(select(Coupon).where(Coupon.code == normalize_coupon_code(code)))
    if coupon is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
    return coupon, calculate_coupon_discount(coupon, subtotal)
