from decimal import Decimal

from pydantic import BaseModel, Field


class CartItemUpsert(BaseModel):
    quantity: int = Field(ge=1, le=99)


class CartItemProduct(BaseModel):
    id: str
    name: str
    slug: str
    price: Decimal
    image_url: str | None = None
    stock: int

    model_config = {"from_attributes": True}


class CartItemRead(BaseModel):
    product_id: str
    quantity: int
    product: CartItemProduct

    model_config = {"from_attributes": True}
