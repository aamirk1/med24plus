import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.prescription import PrescriptionReviewLog
    from app.models.user import User


class StaffProfile(Base, UUIDMixin, TimestampMixin):
    """Operational staff profiles for internal warehouse and support teams."""
    __tablename__ = "staff_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    employee_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    department: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    designation: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    employment_status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        nullable=False,
    )
    date_of_joining: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    emergency_contact: Mapped[Optional[str]] = mapped_column(
        String(15),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="staff_profile",
    )


class PharmacistProfile(Base, UUIDMixin, TimestampMixin):
    """Statutory registered pharmacist profile under Drugs & Cosmetics Rules, 1945."""
    __tablename__ = "pharmacist_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    registration_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    state_pharmacy_council: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )
    registration_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    registration_valid_upto: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    verified_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    verification_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    drug_license_number: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    digital_signature_hash: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    employment_status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="pharmacist_profile",
        foreign_keys=[user_id],
    )
    verified_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[verified_by_id],
    )
    qualifications: Mapped[List["PharmacistQualification"]] = relationship(
        "PharmacistQualification",
        back_populates="pharmacist_profile",
        cascade="all, delete-orphan",
    )
    review_logs: Mapped[List["PrescriptionReviewLog"]] = relationship(
        "PrescriptionReviewLog",
        back_populates="pharmacist_profile",
        foreign_keys="PrescriptionReviewLog.pharmacist_profile_id",
    )

    __table_args__ = (
        Index("ix_pharmacist_verification", "is_verified", "employment_status"),
    )


class PharmacistQualification(Base, UUIDMixin, TimestampMixin):
    """Academic pharmaceutical degrees and verification document metadata."""
    __tablename__ = "pharmacist_qualifications"

    pharmacist_profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("pharmacist_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    degree: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    institution: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    university: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    year_of_passing: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    document_object_key: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    # Relationships
    pharmacist_profile: Mapped["PharmacistProfile"] = relationship(
        "PharmacistProfile",
        back_populates="qualifications",
    )

