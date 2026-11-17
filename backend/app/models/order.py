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
    UniqueConstraint,
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
    currency: Mapped[str] = mapped_column(
        String(10),
        default="INR",
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
    placed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        nullable=True,
    )
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    idempotency_key: Mapped[Optional[str]] = mapped_column(
        String(255),
        index=True,
        nullable=True,
    )

    # Convenience properties
    @property
    def order_status(self) -> str:
        return self.status

    @order_status.setter
    def order_status(self, val: str) -> None:
        self.status = val

    @property
    def discount_total(self) -> Decimal:
        return self.discount_amount

    @discount_total.setter
    def discount_total(self, val: Decimal) -> None:
        self.discount_amount = val

    @property
    def tax_total(self) -> Decimal:
        return self.tax_amount

    @tax_total.setter
    def tax_total(self, val: Decimal) -> None:
        self.tax_amount = val

    @property
    def internal_notes(self) -> Optional[str]:
        return self.admin_notes

    @internal_notes.setter
    def internal_notes(self, val: Optional[str]) -> None:
        self.admin_notes = val

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
    batch_allocations: Mapped[List["OrderBatchAllocation"]] = relationship(
        "OrderBatchAllocation",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    reservations: Mapped[List["InventoryReservation"]] = relationship(
        "InventoryReservation",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    cancellation: Mapped[Optional["OrderCancellation"]] = relationship(
        "OrderCancellation",
        back_populates="order",
        uselist=False,
        cascade="all, delete-orphan",
    )
    invoice: Mapped[Optional["Invoice"]] = relationship(
        "Invoice",
        back_populates="order",
        uselist=False,
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
    strength_snapshot: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    pack_size_snapshot: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
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
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    taxable_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
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
    prescription_required: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Convenience properties
    @property
    def product_sku(self) -> str:
        return self.product_sku_snapshot

    @property
    def line_total(self) -> Decimal:
        return self.total_amount

    @line_total.setter
    def line_total(self, val: Decimal) -> None:
        self.total_amount = val

    @property
    def tax_rate(self) -> Decimal:
        return self.gst_rate_snapshot

    @tax_rate.setter
    def tax_rate(self, val: Decimal) -> None:
        self.gst_rate_snapshot = val

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
    batch_allocations: Mapped[List["OrderBatchAllocation"]] = relationship(
        "OrderBatchAllocation",
        back_populates="order_item",
        cascade="all, delete-orphan",
    )
    reservations: Mapped[List["InventoryReservation"]] = relationship(
        "InventoryReservation",
        back_populates="order_item",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_order_item_qty_positive"),
        CheckConstraint("unit_price >= 0", name="check_order_item_unit_price_non_neg"),
        CheckConstraint("unit_mrp >= 0", name="check_order_item_unit_mrp_non_neg"),
        CheckConstraint("total_amount >= 0", name="check_order_item_total_non_neg"),
    )


class OrderBatchAllocation(Base, UUIDMixin, TimestampMixin):
    """Specific batch allocation split for an order item under FEFO dispensing."""
    __tablename__ = "order_batch_allocations"

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    order_item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("order_items.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("inventory_batches.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    allocated_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    released_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    consumed_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    allocation_status: Mapped[str] = mapped_column(
        String(30),
        default="allocated",
        index=True,
        nullable=False,
    )  # allocated, partially_released, released, consumed

    # Relationships
    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="batch_allocations",
    )
    order_item: Mapped["OrderItem"] = relationship(
        "OrderItem",
        back_populates="batch_allocations",
    )
    batch: Mapped["InventoryBatch"] = relationship(
        "InventoryBatch",
    )

    __table_args__ = (
        CheckConstraint("allocated_quantity > 0", name="check_order_batch_alloc_qty_pos"),
        CheckConstraint("released_quantity >= 0", name="check_order_batch_rel_qty_non_neg"),
        CheckConstraint("consumed_quantity >= 0", name="check_order_batch_con_qty_non_neg"),
        CheckConstraint(
            "released_quantity + consumed_quantity <= allocated_quantity",
            name="check_order_batch_qty_sum_valid",
        ),
    )


class InventoryReservation(Base, UUIDMixin, TimestampMixin):
    """Batch-level physical inventory reservation holding stock between order creation and dispatch."""
    __tablename__ = "inventory_reservations"

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    order_item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("order_items.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("inventory_batches.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    reserved_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    released_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    consumed_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        index=True,
        nullable=False,
    )  # active, partially_released, released, consumed, expired
    reserved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    released_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    consumed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="reservations",
    )
    order_item: Mapped["OrderItem"] = relationship(
        "OrderItem",
        back_populates="reservations",
    )
    batch: Mapped["InventoryBatch"] = relationship(
        "InventoryBatch",
    )

    __table_args__ = (
        CheckConstraint("reserved_quantity > 0", name="check_inv_res_qty_pos"),
        CheckConstraint("released_quantity >= 0", name="check_inv_res_rel_qty_non_neg"),
        CheckConstraint("consumed_quantity >= 0", name="check_inv_res_con_qty_non_neg"),
        CheckConstraint(
            "released_quantity + consumed_quantity <= reserved_quantity",
            name="check_inv_res_qty_sum_valid",
        ),
        Index("ix_inv_reservations_status_batch", "status", "batch_id"),
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
    changed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    actor_role: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    reason: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
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


class OrderCancellation(Base, UUIDMixin, TimestampMixin):
    """Formal cancellation record for customer, pharmacist, or administrative cancellations."""
    __tablename__ = "order_cancellations"

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    requested_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    cancellation_reason: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    cancellation_type: Mapped[str] = mapped_column(
        String(50),
        default="customer_requested",
        nullable=False,
    )  # customer_requested, admin_cancelled, pharmacist_rejected, system_cancelled
    approved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    cancellation_status: Mapped[str] = mapped_column(
        String(30),
        default="completed",
        nullable=False,
    )  # pending, approved, rejected, completed

    # Relationships
    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="cancellation",
    )
    requested_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[requested_by_id],
    )
    approved_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[approved_by_id],
    )


class Invoice(Base, UUIDMixin, TimestampMixin):
    """Statutory GST Tax Invoice / Form 20 Cash Memo generated from immutable order snapshot."""
    __tablename__ = "invoices"

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="RESTRICT"),
        unique=True,
        index=True,
        nullable=False,
    )
    invoice_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    invoice_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    invoice_type: Mapped[str] = mapped_column(
        String(30),
        default="tax_invoice",
        nullable=False,
    )  # tax_invoice, bill_of_supply
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
    document_storage_key: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    pharmacy_details_snapshot: Mapped[Dict[str, Any]] = mapped_column(
        JSONB_COMPAT,
        nullable=False,
    )
    customer_details_snapshot: Mapped[Dict[str, Any]] = mapped_column(
        JSONB_COMPAT,
        nullable=False,
    )

    # Relationships
    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="invoice",
    )

    __table_args__ = (
        CheckConstraint("grand_total >= 0", name="check_invoice_grand_total_non_neg"),
        CheckConstraint("subtotal >= 0", name="check_invoice_subtotal_non_neg"),
        CheckConstraint("tax_total >= 0", name="check_invoice_tax_non_neg"),
    )


class OrderIdempotencyRecord(Base, UUIDMixin):
    """PostgreSQL-backed idempotency protection for order creation."""
    __tablename__ = "order_idempotency_records"

    idempotency_key: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    request_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
    )
    response_payload: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB_COMPAT,
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="processing",
        nullable=False,
    )  # processing, completed, failed
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("idempotency_key", "customer_id", name="uq_order_idempotency_key_customer"),
    )
