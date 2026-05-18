from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.catalog import ProductStatus


class CategoryRead(BaseModel):
    id: str
    name: str
    slug: str

    model_config = {"from_attributes": True}


class ProductBase(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    slug: str = Field(min_length=2, max_length=220)
    sku: str = Field(min_length=2, max_length=80)
    description: str
    price: Decimal
    compare_at_price: Decimal | None = None
    stock: int = Field(ge=0)
    batch_no: str | None = None
    expiry_date: str | None = None
    image_url: str | None = None
    status: ProductStatus = ProductStatus.draft
    category_id: str


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    stock: int | None = Field(default=None, ge=0)
    status: ProductStatus | None = None


class ProductRead(ProductBase):
    id: str

    model_config = {"from_attributes": True}
