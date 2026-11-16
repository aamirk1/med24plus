import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.models.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User


class UserAddress(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Customer delivery addresses for medication order fulfillment."""
    __tablename__ = "user_addresses"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    address_type: Mapped[str] = mapped_column(
        String(20),
        default="home",
        nullable=False,
    )
    recipient_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    recipient_phone: Mapped[str] = mapped_column(
        String(15),
        nullable=False,
    )
    address_line1: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    address_line2: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    landmark: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
    )
    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    state: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    pincode: Mapped[str] = mapped_column(
        String(10),
        index=True,
        nullable=False,
    )
    is_default: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="addresses",
    )

    __table_args__ = (
        Index("ix_user_addresses_user_default", "user_id", "is_default"),
    )

