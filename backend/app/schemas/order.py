from decimal import Decimal
from datetime import datetime

from pydantic import BaseModel, Field


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=99)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=160)
    phone: str = Field(min_length=8, max_length=40, pattern=r"^[+\d][\d\s\-()]{6,38}\d$")
    address: str = Field(min_length=8, max_length=500)
    payment_method: str = Field(default="cod", pattern=r"^(cod|bkash|nagad|rocket|card)$")
    coupon_code: str | None = Field(default=None, min_length=3, max_length=40)
    items: list[OrderItemCreate] = Field(min_length=1, max_length=50)


class OrderItemRead(BaseModel):
    product_id: str
    quantity: int
    unit_price: Decimal
    product_name: str | None = None
    product_image_url: str | None = None
    product_slug: str | None = None

    model_config = {"from_attributes": True}


class OrderRead(BaseModel):
    id: str
    customer_name: str
    phone: str
    address: str
    payment_method: str
    status: str
    subtotal: Decimal = Decimal("0")
    discount_amount: Decimal = Decimal("0")
    coupon_code: str | None = None
    total: Decimal
    items: list[OrderItemRead]
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: str
