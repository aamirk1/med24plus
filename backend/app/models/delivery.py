import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.user import User


class DeliveryPartner(Base, UUIDMixin, TimestampMixin):
    """Logistics providers and hyper-local last-mile delivery fleet configuration."""
    __tablename__ = "delivery_partners"

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    partner_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    contact_person: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    contact_phone: Mapped[Optional[str]] = mapped_column(
        String(15),
        nullable=True,
    )
    api_code: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    is_cold_chain_capable: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    deliveries: Mapped[List["Delivery"]] = relationship(
        "Delivery",
        back_populates="partner",
    )


class Delivery(Base, UUIDMixin, TimestampMixin):
    """Order dispatch, cold chain temperature compliance, and OTP handover verification."""
    __tablename__ = "deliveries"

    delivery_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    delivery_partner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("delivery_partners.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    assigned_agent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    tracking_reference: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="pending_assignment",
        index=True,
        nullable=False,
    )
    pickup_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    delivery_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    estimated_delivery_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    delivery_otp_hash: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    recipient_signature_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    is_cold_chain: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    temperature_on_handover_celsius: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(4, 1),
        nullable=True,
    )
    delivery_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # Relationships
    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="delivery",
    )
    partner: Mapped[Optional["DeliveryPartner"]] = relationship(
        "DeliveryPartner",
        back_populates="deliveries",
    )
    assigned_agent: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[assigned_agent_id],
        back_populates="assigned_deliveries",
    )
    status_history: Mapped[List["DeliveryStatusHistory"]] = relationship(
        "DeliveryStatusHistory",
        back_populates="delivery",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_deliveries_status_created", "status", "created_at"),
    )


class DeliveryStatusHistory(Base, UUIDMixin):
    """Checkpoint history for order shipment and cold chain monitoring."""
    __tablename__ = "delivery_status_history"

    delivery_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("deliveries.id", ondelete="CASCADE"),
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
    location_notes: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    recorded_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    delivery: Mapped["Delivery"] = relationship(
        "Delivery",
        back_populates="status_history",
    )
    recorded_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[recorded_by_id],
    )

