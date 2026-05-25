from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import uuid4

from sqlalchemy import DateTime, Enum as SqlEnum, ForeignKey, Index, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProductStatus(str, Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_status_created_at", "status", "created_at"),
        Index("ix_products_category_status_created_at", "category_id", "status", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(180), index=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    sku: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), index=True)
    compare_at_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    batch_no: Mapped[str | None] = mapped_column(String(80), nullable=True)
    expiry_date: Mapped[str | None] = mapped_column(String(40), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    gallery: Mapped[list | None] = mapped_column(JSON, nullable=True, default=None)
    badge: Mapped[str | None] = mapped_column(String(120), nullable=True)
    detail: Mapped[str | None] = mapped_column(String(200), nullable=True)
    accent: Mapped[str | None] = mapped_column(String(20), nullable=True)
    subcategory: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    status: Mapped[ProductStatus] = mapped_column(SqlEnum(ProductStatus), default=ProductStatus.draft, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id"), index=True)
    category: Mapped[Category] = relationship(back_populates="products")
