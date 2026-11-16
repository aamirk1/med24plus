from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.product import Product


class Brand(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Pharmaceutical manufacturers and healthcare consumer brands."""
    __tablename__ = "brands"

    name: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True,
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True,
        nullable=False,
    )
    manufacturer_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    logo_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    country_of_origin: Mapped[str] = mapped_column(
        String(100),
        default="India",
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )

    # Relationships
    products: Mapped[List["Product"]] = relationship(
        "Product",
        back_populates="brand",
    )

    __table_args__ = (
        Index("ix_brands_active_name", "is_active", "name"),
    )

