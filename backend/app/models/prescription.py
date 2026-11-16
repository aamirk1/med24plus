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
    storage_object_key: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    original_filename: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    file_mime_type: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    file_size_bytes: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
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
    rejected_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    rejected_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    under_review_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    under_review_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    clarification_requested_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    clarification_requested_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    clarification_remarks: Mapped[Optional[str]] = mapped_column(
        Text,
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
    customer_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    valid_until: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    is_valid: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    invalidity_reason: Mapped[Optional[str]] = mapped_column(
        Text,
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
    rejected_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[rejected_by_id],
    )
    under_review_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[under_review_by_id],
    )
    clarification_requested_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[clarification_requested_by_id],
    )
    files: Mapped[List["PrescriptionFile"]] = relationship(
        "PrescriptionFile",
        back_populates="prescription",
        cascade="all, delete-orphan",
        order_by="PrescriptionFile.uploaded_at",
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
        order_by="PrescriptionReviewLog.created_at",
    )
    orders: Mapped[List["Order"]] = relationship(
        "Order",
        back_populates="prescription",
    )

    @property
    def prescription_number(self) -> str:
        return self.prescription_reference

    @property
    def status(self) -> str:
        return self.prescription_status

    @property
    def uploaded_at(self) -> datetime:
        return self.created_at

    __table_args__ = (
        Index("ix_prescriptions_customer_status", "customer_id", "prescription_status"),
        Index("ix_prescriptions_status_created", "prescription_status", "created_at"),
    )


class PrescriptionFile(Base, UUIDMixin, TimestampMixin):
    """Secure encrypted file attachments belonging to a prescription under Rule 65."""
    __tablename__ = "prescription_files"

    prescription_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("prescriptions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    storage_key: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    file_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    storage_provider: Mapped[str] = mapped_column(
        String(50),
        default="local",
        nullable=False,
    )
    checksum: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
    )
    file_category: Mapped[str] = mapped_column(
        String(50),
        default="initial",
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    uploaded_by_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    prescription: Mapped["Prescription"] = relationship(
        "Prescription",
        back_populates="files",
    )
    uploaded_by: Mapped["User"] = relationship(
        "User",
        foreign_keys=[uploaded_by_id],
    )

    __table_args__ = (
        Index("ix_prescription_files_rx_active", "prescription_id", "is_active"),
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
    verification_status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False,
    )
    pharmacist_remarks: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
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

    @property
    def decision(self) -> str:
        return self.action

    @property
    def remarks(self) -> Optional[str]:
        return self.notes
