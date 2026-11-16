import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.product import Product
    from app.models.staff import PharmacistProfile
    from app.models.user import User


class Prescription(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Prescription metadata and private encrypted storage records under Rule 65."""
    __tablename__ = "prescriptions"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    prescription_reference: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    storage_object_key: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    file_mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    file_size_bytes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    doctor_name: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
    )
    doctor_registration_no: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    doctor_clinic_or_hospital: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
    )
    patient_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    patient_age: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )
    patient_gender: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )
    prescription_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    prescription_status: Mapped[str] = mapped_column(
        String(30),
        default="pending_review",
        index=True,
        nullable=False,
    )
    reviewed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    pharmacist_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    valid_until: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    # Relationships
    customer: Mapped["User"] = relationship(
        "User",
        back_populates="prescriptions",
        foreign_keys=[customer_id],
    )
    reviewed_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[reviewed_by_id],
    )
    items: Mapped[List["PrescriptionItem"]] = relationship(
        "PrescriptionItem",
        back_populates="prescription",
        cascade="all, delete-orphan",
    )
    review_logs: Mapped[List["PrescriptionReviewLog"]] = relationship(
        "PrescriptionReviewLog",
        back_populates="prescription",
        cascade="all, delete-orphan",
    )
    orders: Mapped[List["Order"]] = relationship(
        "Order",
        back_populates="prescription",
    )

    __table_args__ = (
        Index("ix_prescriptions_customer_status", "customer_id", "prescription_status"),
    )


class PrescriptionItem(Base, UUIDMixin, TimestampMixin):
    """Specific line item extracted or verified from a registered prescription."""
    __tablename__ = "prescription_items"

    prescription_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("prescriptions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    medicine_name_prescribed: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
    )
    dosage: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    frequency: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    duration_days: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )
    quantity_prescribed: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    quantity_approved: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Relationships
    prescription: Mapped["Prescription"] = relationship(
        "Prescription",
        back_populates="items",
    )
    product: Mapped[Optional["Product"]] = relationship(
        "Product",
    )


class PrescriptionReviewLog(Base, UUIDMixin):
    """Statutory audit trail of registered pharmacist prescription review actions."""
    __tablename__ = "prescription_review_logs"

    prescription_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("prescriptions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    pharmacist_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    pharmacist_profile_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("pharmacist_profiles.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    previous_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    new_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
        nullable=False,
    )

    # Relationships
    prescription: Mapped["Prescription"] = relationship(
        "Prescription",
        back_populates="review_logs",
    )
    pharmacist: Mapped["User"] = relationship(
        "User",
        foreign_keys=[pharmacist_id],
    )
    pharmacist_profile: Mapped[Optional["PharmacistProfile"]] = relationship(
        "PharmacistProfile",
        back_populates="review_logs",
        foreign_keys=[pharmacist_profile_id],
    )

