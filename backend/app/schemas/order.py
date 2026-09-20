from decimal import Decimal
from datetime import datetime

from pydantic import BaseModel, Field



class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=99)
    variant: str | None = Field(default=None, max_length=200)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=160)
    phone: str = Field(min_length=8, max_length=40, pattern=r"^[+\d][\d\s\-()]{6,38}\d$")
    # Street-level address only; the area and division below are appended to it.
    address: str = Field(min_length=8, max_length=400)
    payment_method: str = Field(default="cod", pattern=r"^(cod|bkash|nagad|rocket|card)$")
    coupon_code: str | None = Field(default=None, min_length=3, max_length=40)
    # The delivery zone — and so the charge — is derived from these, never sent.
    division: str = Field(min_length=2, max_length=40)
    area: str = Field(min_length=2, max_length=60)
    items: list[OrderItemCreate] = Field(min_length=1, max_length=50)


class OrderItemRead(BaseModel):
    product_id: str
    quantity: int
    unit_price: Decimal
    variant: str | None = None
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
    division: str | None = None
    area: str | None = None
    delivery_zone: str | None = None
    delivery_charge: Decimal = Decimal("0")
    total: Decimal
    items: list[OrderItemRead]
    created_at: datetime | None = None
    user_id: str | None = None

    model_config = {"from_attributes": True}


class DeliveryAreaRead(BaseModel):
    name: str
    zone: str
    charge: Decimal


class DeliveryDivisionRead(BaseModel):
    name: str
    areas: list[DeliveryAreaRead]


class OrderStatusUpdate(BaseModel):
    status: str
