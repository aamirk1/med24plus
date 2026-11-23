import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.product import Product


class Category(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Hierarchical medicine and healthcare product categories."""
    __tablename__ = "categories"

    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    image_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
    sort_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # Relationships
    parent: Mapped[Optional["Category"]] = relationship(
        "Category",
        remote_side="Category.id",
        back_populates="subcategories",
    )
    subcategories: Mapped[List["Category"]] = relationship(
        "Category",
        back_populates="parent",
        lazy="selectin",
    )
    products: Mapped[List["Product"]] = relationship(
        "Product",
        back_populates="category",
    )

    __table_args__ = (
        Index("ix_categories_active_sort", "is_active", "sort_order"),
    )

