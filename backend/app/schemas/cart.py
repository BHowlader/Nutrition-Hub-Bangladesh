from decimal import Decimal

from pydantic import BaseModel, Field


class CartItemUpsert(BaseModel):
    quantity: int = Field(ge=1, le=99)
    variant: str | None = Field(default=None, max_length=200)


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
    variant: str | None = None
    # Base price plus the selected variant's deltas — the storefront must never
    # compute what the customer pays from the product price alone.
    unit_price: Decimal
    # Units left for THIS variant. Falls back to the product's pool when no chosen
    # option declares its own, so the storefront never has to work that rule out.
    available_stock: int
    product: CartItemProduct

    model_config = {"from_attributes": True}
