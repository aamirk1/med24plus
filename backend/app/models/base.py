import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, func, JSON
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import Uuid

# Cross-dialect JSON column: uses native JSONB on PostgreSQL, standard JSON elsewhere
JSONB_COMPAT = JSON().with_variant(postgresql.JSONB, "postgresql")


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy 2.0 ORM models in Med24Plus."""
    pass


class UUIDMixin:
    """Reusable mixin providing standard UUIDv4 primary key."""
    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )


class TimestampMixin:
    """Reusable mixin providing UTC created_at and updated_at timestamps."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    """Reusable mixin providing soft deletion tracking."""
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )


class AuditMixin:
    """Reusable mixin providing created_by and updated_by user tracking."""
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        nullable=True,
    )
    updated_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        nullable=True,
    )
