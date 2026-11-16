import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class OTPVerification(Base, UUIDMixin, TimestampMixin):
    """Cryptographically secure OTP verification records."""
    __tablename__ = "otp_verifications"

    target: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )
    otp_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    purpose: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )
    attempts: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    max_attempts: Mapped[int] = mapped_column(
        Integer,
        default=5,
        nullable=False,
    )
    is_used: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
    )

    __table_args__ = (
        Index("ix_otp_target_purpose", "target", "purpose"),
    )

