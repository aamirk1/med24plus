import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import (
    CheckConstraint,
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
    from app.models.order import Order
    from app.models.user import User


class Payment(Base, UUIDMixin, TimestampMixin):
    """
    Payment transaction ledger for Indian payment gateways (Razorpay, UPI, NetBanking) and COD.
    Supports multi-attempt lifecycle, provider synchronization, and financial audit trails.
    """
    __tablename__ = "payments"

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    payment_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    gateway_name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    gateway_order_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        index=True,
        nullable=True,
    )
    gateway_payment_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        index=True,
        nullable=True,
    )
    gateway_signature: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        default="INR",
        nullable=False,
    )
    payment_method: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="initiated",
        index=True,
        nullable=False,
    )
    error_code: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    error_description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    captured_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # In-memory / virtual property compatibility aliases
    @property
    def customer_id(self) -> Optional[uuid.UUID]:
        return self.order.customer_id if self.order else None

    @customer_id.setter
    def customer_id(self, val: Any) -> None:
        pass

    @property
    def initiated_at(self) -> Optional[datetime]:
        return self.created_at

    @initiated_at.setter
    def initiated_at(self, val: Any) -> None:
        pass

    @property
    def authorized_at(self) -> Optional[datetime]:
        return self.captured_at

    @authorized_at.setter
    def authorized_at(self, val: Any) -> None:
        pass

    @property
    def failed_at(self) -> Optional[datetime]:
        return self.updated_at

    @failed_at.setter
    def failed_at(self, val: Any) -> None:
        pass

    @property
    def failure_code(self) -> Optional[str]:
        return self.error_code

    @failure_code.setter
    def failure_code(self, val: Optional[str]) -> None:
        self.error_code = val

    @property
    def failure_message(self) -> Optional[str]:
        return self.error_description

    @failure_message.setter
    def failure_message(self, val: Optional[str]) -> None:
        self.error_description = val

    @property
    def gateway_response_reference(self) -> Optional[str]:
        return self.gateway_payment_id

    @gateway_response_reference.setter
    def gateway_response_reference(self, val: Optional[str]) -> None:
        self.gateway_payment_id = val

    # Convenience aliases adhering to Phase 9 specification
    @property
    def payment_reference(self) -> str:
        return self.payment_number

    @payment_reference.setter
    def payment_reference(self, val: str) -> None:
        self.payment_number = val

    @property
    def provider(self) -> str:
        return self.gateway_name

    @provider.setter
    def provider(self, val: str) -> None:
        self.gateway_name = val

    @property
    def provider_order_id(self) -> Optional[str]:
        return self.gateway_order_id

    @provider_order_id.setter
    def provider_order_id(self, val: Optional[str]) -> None:
        self.gateway_order_id = val

    @property
    def provider_payment_id(self) -> Optional[str]:
        return self.gateway_payment_id

    @provider_payment_id.setter
    def provider_payment_id(self, val: Optional[str]) -> None:
        self.gateway_payment_id = val

    @property
    def provider_signature(self) -> Optional[str]:
        return self.gateway_signature

    @provider_signature.setter
    def provider_signature(self, val: Optional[str]) -> None:
        self.gateway_signature = val

    # Relationships
    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="payments",
    )
    refunds: Mapped[List["Refund"]] = relationship(
        "Refund",
        back_populates="payment",
        cascade="all, delete-orphan",
    )
    events: Mapped[List["PaymentEvent"]] = relationship(
        "PaymentEvent",
        back_populates="payment",
        cascade="all, delete-orphan",
    )
    transactions: Mapped[List["PaymentTransaction"]] = relationship(
        "PaymentTransaction",
        back_populates="payment",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint("amount >= 0", name="check_payment_amount_non_negative"),
        Index("ix_payments_gateway_lookup", "gateway_name", "gateway_payment_id"),
    )


class Refund(Base, UUIDMixin, TimestampMixin):
    """Customer refund ledger for order cancellations, clinical rejections, or partial adjustments."""
    __tablename__ = "refunds"

    payment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("payments.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    refund_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    gateway_refund_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        index=True,
        nullable=True,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        default="INR",
        nullable=False,
    )
    reason: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        index=True,
        nullable=False,
    )  # requested, pending, processed, failed
    initiated_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    approved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    initiated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    processed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    failure_reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # Convenience aliases
    @property
    def refund_reference(self) -> str:
        return self.refund_number

    @refund_reference.setter
    def refund_reference(self, val: str) -> None:
        self.refund_number = val

    @property
    def payment_transaction_id(self) -> uuid.UUID:
        return self.payment_id

    @payment_transaction_id.setter
    def payment_transaction_id(self, val: uuid.UUID) -> None:
        self.payment_id = val

    @property
    def provider_refund_id(self) -> Optional[str]:
        return self.gateway_refund_id

    @provider_refund_id.setter
    def provider_refund_id(self, val: Optional[str]) -> None:
        self.gateway_refund_id = val

    @property
    def requested_by_id(self) -> Optional[uuid.UUID]:
        return self.initiated_by_id

    @requested_by_id.setter
    def requested_by_id(self, val: Optional[uuid.UUID]) -> None:
        self.initiated_by_id = val

    # Relationships
    payment: Mapped["Payment"] = relationship(
        "Payment",
        back_populates="refunds",
    )
    order: Mapped["Order"] = relationship(
        "Order",
    )
    initiated_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[initiated_by_id],
    )
    approved_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[approved_by_id],
    )

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_refund_amount_positive"),
        Index("ix_refunds_order_status", "order_id", "status"),
    )


class PaymentEvent(Base, UUIDMixin, TimestampMixin):
    """Raw and normalized gateway webhook event audit ledger."""
    __tablename__ = "payment_events"

    provider: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    provider_event_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=True,
    )
    event_type: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )
    payment_transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("payments.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    provider_order_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        index=True,
        nullable=True,
    )
    provider_payment_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        index=True,
        nullable=True,
    )
    processing_status: Mapped[str] = mapped_column(
        String(30),
        default="received",
        index=True,
        nullable=False,
    )  # received, processed, ignored, failed
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    processed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    processing_error: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    event_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB_COMPAT,
        nullable=True,
    )

    # Relationships
    payment: Mapped[Optional["Payment"]] = relationship(
        "Payment",
        back_populates="events",
    )

    __table_args__ = (
        Index("ix_payment_events_provider_type", "provider", "event_type"),
    )


class PaymentIdempotencyRecord(Base, UUIDMixin):
    """Database-level idempotency record preventing duplicate payment and refund submissions."""
    __tablename__ = "payment_idempotency_records"

    idempotency_key: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    operation_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )  # payment_initiate, payment_verify, refund_initiate, webhook
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    request_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )
    response_code: Mapped[Optional[int]] = mapped_column(
        Integer,
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


class PaymentReconciliation(Base, UUIDMixin, TimestampMixin):
    """Financial reconciliation record comparing local transactions with gateway provider transactions."""
    __tablename__ = "payment_reconciliations"

    reconciliation_reference: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    batch_start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    batch_end_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    total_records_checked: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    matched_records: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    discrepancy_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="completed",
        nullable=False,
    )  # running, completed, failed
    discrepancies: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(
        JSONB_COMPAT,
        nullable=True,
    )
    performed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    performed_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[performed_by_id],
    )


class PaymentTransaction(Base, UUIDMixin):
    """Raw communication audit log for payment providers."""
    __tablename__ = "payment_transactions"

    payment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("payments.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    transaction_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    raw_response_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB_COMPAT,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    payment: Mapped["Payment"] = relationship(
        "Payment",
        back_populates="transactions",
    )
