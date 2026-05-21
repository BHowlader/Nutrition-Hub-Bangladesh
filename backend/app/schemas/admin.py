from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.order import OrderRead


class AdminStats(BaseModel):
    orders: int
    pending_orders: int
    revenue: Decimal
    products: int
    published_products: int
    low_stock_products: int


class AuditLogRead(BaseModel):
    id: str
    actor_email: str | None = None
    action: str
    entity_type: str
    entity_id: str | None = None
    summary: str
    metadata_json: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserAdminRead(BaseModel):
    id: str
    name: str
    email: str
    is_admin: bool
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserRoleUpdate(BaseModel):
    role: str = Field(pattern="^(customer|editor|admin|owner)$")


class CustomerSummary(BaseModel):
    id: str
    name: str
    email: str
    phone: str | None = None
    address: str | None = None
    photo_url: str | None = None
    auth_provider: str
    created_at: datetime
    order_count: int = 0
    total_spent: Decimal = Decimal("0")
    pending_count: int = 0
    delivered_count: int = 0
    cancelled_count: int = 0
    last_order_at: datetime | None = None
    orders: list[OrderRead] = []

    model_config = {"from_attributes": True}
