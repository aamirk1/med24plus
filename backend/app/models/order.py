import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base, JSONB_COMPAT, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.delivery import Delivery
    from app.models.inventory import InventoryBatch
    from app.models.payment import Payment
    from app.models.prescription import Prescription
    from app.models.product import Product
    from app.models.user import User


class Order(Base, UUIDMixin, TimestampMixin):
    """Customer medication order and statutory GST billing invoice master."""
    __tablename__ = "orders"

    order_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    prescription_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("prescriptions.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="placed",
        index=True,
        nullable=False,
    )
    payment_status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        index=True,
        nullable=False,
    )
    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    coupon_code: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    cgst_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    sgst_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    igst_amount: Mapped[Decimal] = mapped_column(
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
    delivery_address_snapshot: Mapped[Dict[str, Any]] = mapped_column(
        JSONB_COMPAT,
        nullable=False,
    )
    billing_address_snapshot: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB_COMPAT,
        nullable=True,
    )
    customer_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    admin_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    is_cold_chain_required: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Relationships
    customer: Mapped["User"] = relationship(
        "User",
        back_populates="orders",
        foreign_keys=[customer_id],
    )
    prescription: Mapped[Optional["Prescription"]] = relationship(
        "Prescription",
        back_populates="orders",
    )
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    status_history: Mapped[List["OrderStatusHistory"]] = relationship(
        "OrderStatusHistory",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    payments: Mapped[List["Payment"]] = relationship(
        "Payment",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    delivery: Mapped[Optional["Delivery"]] = relationship(
        "Delivery",
        back_populates="order",
        uselist=False,
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint("grand_total >= 0", name="check_order_grand_total_non_negative"),
        CheckConstraint("subtotal >= 0", name="check_order_subtotal_non_negative"),
        CheckConstraint("tax_amount >= 0", name="check_order_tax_non_negative"),
        Index("ix_orders_customer_status", "customer_id", "status"),
        Index("ix_orders_created_at_status", "created_at", "status"),
    )


class OrderItem(Base, UUIDMixin, TimestampMixin):
    """Statutory order line item snapshot with allocated batch credentials."""
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    batch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("inventory_batches.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    product_name_snapshot: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
    )
    product_sku_snapshot: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    generic_name_snapshot: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
    )
    manufacturer_snapshot: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    batch_number_snapshot: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    expiry_date_snapshot: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    hsn_code_snapshot: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    gst_rate_snapshot: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )
    unit_mrp: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    # Relationships
    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="items",
    )
    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="order_items",
    )
    batch: Mapped[Optional["InventoryBatch"]] = relationship(
        "InventoryBatch",
        back_populates="order_items",
    )

    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_order_item_qty_positive"),
        CheckConstraint("unit_price >= 0", name="check_order_item_unit_price_non_neg"),
        CheckConstraint("unit_mrp >= 0", name="check_order_item_unit_mrp_non_neg"),
        CheckConstraint("total_amount >= 0", name="check_order_item_total_non_neg"),
    )


class OrderStatusHistory(Base, UUIDMixin):
    """Full lifecycle state transitions and audit logs for customer orders."""
    __tablename__ = "order_status_history"

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    previous_status: Mapped[Optional[str]] = mapped_column(
        String(30),
        nullable=True,
    )
    new_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    changed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
        nullable=False,
    )

    # Relationships
    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="status_history",
    )
    changed_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[changed_by_id],
    )

