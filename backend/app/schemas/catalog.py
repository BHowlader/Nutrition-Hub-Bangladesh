from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.models.catalog import ProductStatus
from app.core.variants import VARIANT_SEPARATOR


class VariantOption(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    price_delta: Decimal = Decimal("0")

    @field_validator("label")
    @classmethod
    def _keep_separator_unambiguous(cls, value: str) -> str:
        value = value.strip()
        if "/" in value:
            raise ValueError(f"Variant labels cannot contain '/' (it separates choices as '{VARIANT_SEPARATOR.strip()}')")
        return value


class VariantGroup(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    options: list[VariantOption] = Field(min_length=1, max_length=20)

    @field_validator("name")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()


class CategoryRead(BaseModel):
    id: str
    name: str
    slug: str

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=140)


class ProductBase(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    slug: str = Field(min_length=2, max_length=220)
    sku: str = Field(min_length=2, max_length=80)
    description: str
    price: Decimal
    compare_at_price: Decimal | None = None
    stock: int = Field(ge=0)
    rating: Decimal = Field(default=Decimal("5.0"), ge=0, le=5)
    batch_no: str | None = None
    expiry_date: str | None = None
    image_url: str | None = None
    gallery: list[str] | None = None
    variants: list[VariantGroup] | None = None
    badge: str | None = None
    detail: str | None = None
    accent: str | None = None
    subcategory: str | None = None
    status: ProductStatus = ProductStatus.draft
    category_id: str


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    sku: str | None = None
    description: str | None = None
    price: Decimal | None = None
    compare_at_price: Decimal | None = None
    stock: int | None = Field(default=None, ge=0)
    rating: Decimal | None = Field(default=None, ge=0, le=5)
    batch_no: str | None = None
    expiry_date: str | None = None
    badge: str | None = None
    detail: str | None = None
    accent: str | None = None
    subcategory: str | None = None
    image_url: str | None = None
    gallery: list[str] | None = None
    variants: list[VariantGroup] | None = None
    status: ProductStatus | None = None
    category_id: str | None = None


class ProductRead(ProductBase):
    id: str
    category: CategoryRead | None = None

    model_config = {"from_attributes": True}
