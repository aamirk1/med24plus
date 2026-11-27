import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base, JSONB_COMPAT, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.address import UserAddress
    from app.models.cart import Cart
    from app.models.user import User


class CheckoutValidation(Base, UUIDMixin, TimestampMixin):
    """
    Lightweight, time-limited checkout validation and quote record.
    Acts as the source of truth for validated totals, eligibility, and serviceability prior to order placement.
    DOES NOT reserve inventory or create an order.
    """
    __tablename__ = "checkout_validations"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    cart_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("carts.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    delivery_address_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("user_addresses.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    validation_status: Mapped[str] = mapped_column(
        String(30),
        default="valid",
        index=True,
        nullable=False,
    )  # 'valid', 'valid_with_warnings', 'blocked'

    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    discount_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    tax_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    delivery_fee: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    grand_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    # Detailed structured validation errors, warnings, and item breakdown
    validation_errors: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONB_COMPAT,
        default=list,
        nullable=False,
    )
    item_validations: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONB_COMPAT,
        default=list,
        nullable=False,
    )
    tax_breakdown: Mapped[Dict[str, Any]] = mapped_column(
        JSONB_COMPAT,
        default=dict,
        nullable=False,
    )

    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
    )

    # Relationships
    customer: Mapped["User"] = relationship(
        "User",
        foreign_keys=[customer_id],
    )
    cart: Mapped["Cart"] = relationship(
        "Cart",
        foreign_keys=[cart_id],
    )
    delivery_address: Mapped[Optional["UserAddress"]] = relationship(
        "UserAddress",
        foreign_keys=[delivery_address_id],
    )

    __table_args__ = (
        Index("ix_checkout_validations_cust_cart", "customer_id", "cart_id"),
        Index("ix_checkout_validations_expires", "expires_at"),
    )


class ServiceablePincode(Base, UUIDMixin, TimestampMixin):
    """
    Statutory hyper-local pharmacy delivery geofence serviceability matrix.
    Defines Indian postal codes where Med24Plus operates temperature-controlled courier fulfillment.
    """
    __tablename__ = "serviceable_pincodes"

    pincode: Mapped[str] = mapped_column(
        String(10),
        unique=True,
        index=True,
        nullable=False,
    )
    area_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    city: Mapped[str] = mapped_column(
        String(100),
        default="Mumbai",
        nullable=False,
    )
    state: Mapped[str] = mapped_column(
        String(100),
        default="Maharashtra",
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
        nullable=False,
    )
    estimated_delivery_hours: Mapped[int] = mapped_column(
        Integer,
        default=4,
        nullable=False,
    )
    min_order_value: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )


class CheckoutSetting(Base, UUIDMixin, TimestampMixin):
    """
    Pharmacy checkout operational rules, delivery thresholds, and statutory limits.
    """
    __tablename__ = "checkout_settings"

    standard_delivery_fee: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("40.00"),
        nullable=False,
    )
    free_delivery_threshold: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("499.00"),
        nullable=False,
    )
    express_cold_chain_fee: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("99.00"),
        nullable=False,
    )
    minimum_cart_value: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("100.00"),
        nullable=False,
    )
    max_quantity_per_product: Mapped[int] = mapped_column(
        Integer,
        default=10,
        nullable=False,
    )
    is_serviceability_enforced: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    updated_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    updated_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[updated_by_id],
    )
