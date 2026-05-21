from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.coupon import CouponDiscountType


class CouponBase(BaseModel):
    code: str = Field(min_length=3, max_length=40, pattern=r"^[A-Z0-9][A-Z0-9_-]{1,38}[A-Z0-9]$")
    description: str | None = Field(default=None, max_length=500)
    discount_type: CouponDiscountType = CouponDiscountType.percent
    value: Decimal = Field(ge=0)
    min_order_amount: Decimal = Field(default=Decimal("0"), ge=0)
    max_discount_amount: Decimal | None = Field(default=None, ge=0)
    active: bool = True
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    usage_limit: int | None = Field(default=None, ge=1)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper()

    @model_validator(mode="after")
    def validate_coupon(self):
        if self.discount_type == CouponDiscountType.percent and self.value > 100:
            raise ValueError("Percent discount cannot exceed 100")
        if self.ends_at and self.starts_at and self.ends_at <= self.starts_at:
            raise ValueError("End date must be after start date")
        return self


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=3, max_length=40, pattern=r"^[A-Z0-9][A-Z0-9_-]{1,38}[A-Z0-9]$")
    description: str | None = Field(default=None, max_length=500)
    discount_type: CouponDiscountType | None = None
    value: Decimal | None = Field(default=None, ge=0)
    min_order_amount: Decimal | None = Field(default=None, ge=0)
    max_discount_amount: Decimal | None = Field(default=None, ge=0)
    active: bool | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    usage_limit: int | None = Field(default=None, ge=1)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str | None) -> str | None:
        return value.strip().upper() if value else value


class CouponRead(CouponBase):
    id: str
    usage_count: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class CouponValidateRequest(BaseModel):
    code: str = Field(min_length=3, max_length=40)
    subtotal: Decimal = Field(ge=0)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper()


class CouponValidateResponse(BaseModel):
    code: str
    discount_amount: Decimal
    total: Decimal
    message: str
