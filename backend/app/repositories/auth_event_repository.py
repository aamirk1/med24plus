import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.authentication_event import AuthenticationEvent


class AuthEventRepository:
    """Async database operations for authentication audit events and failed login tracking."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_event(
        self,
        identifier: str,
        event_type: str,
        user_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[str] = None,
    ) -> AuthenticationEvent:
        """Persist an audit log entry for an authentication event."""
        event = AuthenticationEvent(
            identifier=identifier,
            event_type=event_type,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details,
        )
        self.db.add(event)
        await self.db.flush()
        return event

    async def count_recent_failed_attempts(self, identifier: str, minutes: int = 15) -> int:
        """Count failed login attempts for an identifier within the lockout window."""
        window_start = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        stmt = (
            select(func.count(AuthenticationEvent.id))
            .where(
                AuthenticationEvent.identifier == identifier,
                AuthenticationEvent.event_type == "login_failed",
                AuthenticationEvent.created_at >= window_start,
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

