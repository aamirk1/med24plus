import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User


class Notification(Base, UUIDMixin, TimestampMixin):
    """Transactional alerts, prescription status updates, and dispatch alerts."""
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    notification_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )
    reference_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    reference_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        nullable=True,
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        index=True,
        nullable=False,
    )
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="notifications",
    )

    __table_args__ = (
        Index("ix_notifications_user_unread", "user_id", "is_read"),
    )


class NotificationPreference(Base, UUIDMixin, TimestampMixin):
    """User communication channel preferences across SMS, WhatsApp, and Email."""
    __tablename__ = "notification_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    email_order_updates: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    sms_order_updates: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    whatsapp_order_updates: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    promotional_updates: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="notification_preference",
    )

