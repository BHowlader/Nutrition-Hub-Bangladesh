from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SiteSettings(Base):
    __tablename__ = "site_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    hero_description: Mapped[str] = mapped_column(
        Text,
        default="Elevate your training with 100% verified authentic supplements. Batch-checked, sealed, and delivered nationwide with uncompromising trust.",
    )
    hero_product_slug_1: Mapped[str | None] = mapped_column(String(220), nullable=True, default="creatine-tropical-tango")
    hero_product_slug_2: Mapped[str | None] = mapped_column(String(220), nullable=True, default="pintola-protein-oats")
    hero_product_slug_3: Mapped[str | None] = mapped_column(String(220), nullable=True, default="kapiva-shilajit-gold")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
