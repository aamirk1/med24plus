import uuid
from typing import Optional
from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from app.models.base import Base, TimestampMixin, UUIDMixin


class AuthenticationEvent(Base, UUIDMixin, TimestampMixin):
    """Audit log of authentication attempts, logins, lockouts, and session events."""
    __tablename__ = "authentication_events"

    identifier: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    details: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    __table_args__ = (
        Index("ix_auth_events_identifier_type", "identifier", "event_type"),
    )

