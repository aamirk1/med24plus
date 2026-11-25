import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.address import UserAddress
    from app.models.delivery import Delivery
    from app.models.device_token import UserDeviceToken
    from app.models.notification import Notification, NotificationPreference
    from app.models.order import Order
    from app.models.prescription import Prescription
    from app.models.role import UserRole
    from app.models.staff import PharmacistProfile, StaffProfile


class User(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Primary user account for customers, pharmacists, staff, and admins."""
    __tablename__ = "users"

    phone: Mapped[str] = mapped_column(
        String(15),
        unique=True,
        index=True,
        nullable=False,
    )
    email: Mapped[Optional[str]] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=True,
    )
    hashed_password: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    full_name: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    is_phone_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        nullable=False,
        index=True,
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    profile: Mapped[Optional["UserProfile"]] = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    addresses: Mapped[List["UserAddress"]] = relationship(
        "UserAddress",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    user_roles: Mapped[List["UserRole"]] = relationship(
        "UserRole",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="UserRole.user_id",
    )
    sessions: Mapped[List["UserSession"]] = relationship(
        "UserSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    staff_profile: Mapped[Optional["StaffProfile"]] = relationship(
        "StaffProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    pharmacist_profile: Mapped[Optional["PharmacistProfile"]] = relationship(
        "PharmacistProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="PharmacistProfile.user_id",
    )
    orders: Mapped[List["Order"]] = relationship(
        "Order",
        back_populates="customer",
        foreign_keys="Order.customer_id",
    )
    prescriptions: Mapped[List["Prescription"]] = relationship(
        "Prescription",
        back_populates="customer",
        foreign_keys="Prescription.customer_id",
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    notification_preference: Mapped[Optional["NotificationPreference"]] = relationship(
        "NotificationPreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    assigned_deliveries: Mapped[List["Delivery"]] = relationship(
        "Delivery",
        back_populates="assigned_agent",
        foreign_keys="Delivery.assigned_agent_id",
    )
    device_tokens: Mapped[List["UserDeviceToken"]] = relationship(
        "UserDeviceToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_users_status_active", "status", "is_active"),
    )


class UserProfile(Base, UUIDMixin, TimestampMixin):
    """Customer extended medical and personal profile information."""
    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    gender: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )
    date_of_birth: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    blood_group: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True,
    )
    emergency_contact: Mapped[Optional[str]] = mapped_column(
        String(15),
        nullable=True,
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="profile",
    )


class UserSession(Base, UUIDMixin, TimestampMixin):
    """Active user session tracking and revocable token records."""
    __tablename__ = "user_sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    session_token_hash: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    device_info: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
    )
    is_revoked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    family_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        index=True,
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="sessions",
    )

