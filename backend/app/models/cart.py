import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User


class Cart(Base, UUIDMixin, TimestampMixin):
    """Customer shopping cart for medications and healthcare items."""
    __tablename__ = "carts"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        index=True,
        nullable=False,
    )  # 'active', 'abandoned', 'converted', 'inactive'

    # Relationships
    customer: Mapped["User"] = relationship(
        "User",
        foreign_keys=[customer_id],
    )
    items: Mapped[List["CartItem"]] = relationship(
        "CartItem",
        back_populates="cart",
        cascade="all, delete-orphan",
        order_by="CartItem.created_at",
    )

    __table_args__ = (
        Index("ix_carts_customer_status", "customer_id", "status"),
        # Partial unique index ensuring at most one active cart per customer
        Index(
            "uq_carts_customer_active",
            "customer_id",
            unique=True,
            postgresql_where=text("status = 'active'"),
        ),
    )


class CartItem(Base, UUIDMixin, TimestampMixin):
    """Individual product item in a shopping cart with real-time price snapshot."""
    __tablename__ = "cart_items"

    cart_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("carts.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    # Informational unit price snapshot taken at the moment item was added to cart
    unit_price_snapshot: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    # Relationships
    cart: Mapped["Cart"] = relationship(
        "Cart",
        back_populates="items",
    )
    product: Mapped["Product"] = relationship(
        "Product",
    )

    __table_args__ = (
        UniqueConstraint("cart_id", "product_id", name="uq_cart_items_cart_product"),
        CheckConstraint("quantity > 0", name="check_cart_item_quantity_positive"),
        Index("ix_cart_items_cart_id", "cart_id"),
        Index("ix_cart_items_product_id", "product_id"),
    )
