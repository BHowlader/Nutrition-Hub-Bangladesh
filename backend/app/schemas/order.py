from decimal import Decimal

from pydantic import BaseModel, Field


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=99)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=160)
    phone: str = Field(min_length=8, max_length=40)
    address: str = Field(min_length=8, max_length=500)
    payment_method: str = "cod"
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderItemRead(BaseModel):
    product_id: str
    quantity: int
    unit_price: Decimal

    model_config = {"from_attributes": True}


class OrderRead(BaseModel):
    id: str
    customer_name: str
    phone: str
    address: str
    payment_method: str
    status: str
    total: Decimal
    items: list[OrderItemRead]

    model_config = {"from_attributes": True}
