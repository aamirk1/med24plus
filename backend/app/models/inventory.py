import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
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

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.order import OrderItem
    from app.models.product import Product
    from app.models.user import User


class Inventory(Base, UUIDMixin, TimestampMixin):
    """Aggregated product-level inventory status and replenishment thresholds."""
    __tablename__ = "inventory"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    total_available_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    total_reserved_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    total_damaged_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    total_quarantined_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    reorder_level: Mapped[int] = mapped_column(
        Integer,
        default=20,
        nullable=False,
    )
    reorder_quantity: Mapped[int] = mapped_column(
        Integer,
        default=50,
        nullable=False,
    )
    is_in_stock: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    # Relationships
    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="inventory",
    )

    __table_args__ = (
        CheckConstraint("total_available_quantity >= 0", name="check_inv_total_available_non_negative"),
        CheckConstraint("total_reserved_quantity >= 0", name="check_inv_total_reserved_non_negative"),
        CheckConstraint("total_damaged_quantity >= 0", name="check_inv_total_damaged_non_negative"),
        CheckConstraint("total_quarantined_quantity >= 0", name="check_inv_total_quarantined_non_negative"),
        CheckConstraint("total_reserved_quantity <= total_available_quantity", name="check_inv_total_reserved_lte_available"),
    )


class InventoryBatch(Base, UUIDMixin, TimestampMixin):
    """Batch-level inventory tracking supporting statutory FEFO allocation."""
    __tablename__ = "inventory_batches"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    batch_number: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )
    manufacturing_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    expiry_date: Mapped[date] = mapped_column(
        Date,
        index=True,
        nullable=False,
    )
    received_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    available_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    reserved_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    damaged_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    quarantined_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    purchase_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    batch_mrp: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    supplier_name: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
    )
    supplier_invoice_number: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    batch_status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        index=True,
        nullable=False,
    )
    storage_location: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    # Relationships
    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="batches",
    )
    movements: Mapped[List["StockMovement"]] = relationship(
        "StockMovement",
        back_populates="batch",
        cascade="all, delete-orphan",
    )
    alerts: Mapped[List["StockAlert"]] = relationship(
        "StockAlert",
        back_populates="batch",
        cascade="all, delete-orphan",
    )
    adjustment_items: Mapped[List["StockAdjustmentItem"]] = relationship(
        "StockAdjustmentItem",
        back_populates="batch",
    )
    order_items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="batch",
    )

    __table_args__ = (
        UniqueConstraint("product_id", "batch_number", name="uq_product_batch_number"),
        CheckConstraint("available_quantity >= 0", name="check_batch_available_non_negative"),
        CheckConstraint("reserved_quantity >= 0", name="check_batch_reserved_non_negative"),
        CheckConstraint("damaged_quantity >= 0", name="check_batch_damaged_non_negative"),
        CheckConstraint("quarantined_quantity >= 0", name="check_batch_quarantined_non_negative"),
        CheckConstraint("reserved_quantity <= available_quantity", name="check_batch_reserved_lte_available"),
        CheckConstraint("expiry_date > manufacturing_date", name="check_batch_expiry_after_mfg"),
        CheckConstraint("purchase_price >= 0", name="check_batch_purchase_price_non_negative"),
        CheckConstraint("batch_mrp >= 0", name="check_batch_mrp_non_negative"),
        Index("ix_batches_fefo", "product_id", "expiry_date", "batch_status"),
        Index("ix_batches_status_expiry", "batch_status", "expiry_date"),
    )


class StockMovement(Base, UUIDMixin):
    """Immutable audit trail for every pharmaceutical inventory movement."""
    __tablename__ = "stock_movements"

    batch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("inventory_batches.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    movement_type: Mapped[str] = mapped_column(
        String(30),
        index=True,
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    balance_after: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    reference_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    reference_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        index=True,
        nullable=True,
    )
    performed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
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
    batch: Mapped["InventoryBatch"] = relationship(
        "InventoryBatch",
        back_populates="movements",
    )
    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="stock_movements",
    )
    performed_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[performed_by_id],
    )

    __table_args__ = (
        Index("ix_stock_movements_prod_time", "product_id", "created_at"),
        Index("ix_stock_movements_ref", "reference_type", "reference_id"),
    )


class StockAdjustment(Base, UUIDMixin, TimestampMixin):
    """Formal stock correction requests following physical pharmacy audits."""
    __tablename__ = "stock_adjustments"

    adjustment_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    reason: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="draft",
        index=True,
        nullable=False,
    )
    requested_by_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    approved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    applied_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    requested_by: Mapped["User"] = relationship(
        "User",
        foreign_keys=[requested_by_id],
    )
    approved_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[approved_by_id],
    )
    items: Mapped[List["StockAdjustmentItem"]] = relationship(
        "StockAdjustmentItem",
        back_populates="adjustment",
        cascade="all, delete-orphan",
    )


class StockAdjustmentItem(Base, UUIDMixin, TimestampMixin):
    """Line items for physical stock adjustment audits."""
    __tablename__ = "stock_adjustment_items"

    adjustment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stock_adjustments.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("inventory_batches.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    system_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    counted_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    quantity_delta: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    discrepancy_reason: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    # Relationships
    adjustment: Mapped["StockAdjustment"] = relationship(
        "StockAdjustment",
        back_populates="items",
    )
    batch: Mapped["InventoryBatch"] = relationship(
        "InventoryBatch",
        back_populates="adjustment_items",
    )
    product: Mapped["Product"] = relationship(
        "Product",
    )


class StockAlert(Base, UUIDMixin, TimestampMixin):
    """Automated operational warnings for low stock, expiry, and cold chain."""
    __tablename__ = "stock_alerts"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    batch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("inventory_batches.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    alert_type: Mapped[str] = mapped_column(
        String(30),
        index=True,
        nullable=False,
    )
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    is_resolved: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        index=True,
        nullable=False,
    )
    resolved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="stock_alerts",
    )
    batch: Mapped[Optional["InventoryBatch"]] = relationship(
        "InventoryBatch",
        back_populates="alerts",
    )
    resolved_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[resolved_by_id],
    )

    __table_args__ = (
        Index("ix_stock_alerts_unresolved", "is_resolved", "alert_type"),
    )

