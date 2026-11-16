import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import UserSession


class SessionRepository:
    """Async database operations for user sessions and token rotation."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_session(
        self,
        user_id: uuid.UUID,
        session_token_hash: str,
        expires_at: datetime,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        device_info: Optional[str] = None,
        family_id: Optional[uuid.UUID] = None,
    ) -> UserSession:
        """Record a new active user session / refresh token record."""
        session = UserSession(
            user_id=user_id,
            session_token_hash=session_token_hash,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=device_info,
            family_id=family_id or uuid.uuid4(),
            is_revoked=False,
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def get_by_token_hash(self, token_hash: str) -> Optional[UserSession]:
        """Fetch session by its cryptographic token hash."""
        stmt = (
            select(UserSession)
            .options(selectinload(UserSession.user))
            .where(UserSession.session_token_hash == token_hash)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_id(self, session_id: uuid.UUID) -> Optional[UserSession]:
        """Fetch session by ID."""
        stmt = (
            select(UserSession)
            .options(selectinload(UserSession.user))
            .where(UserSession.id == session_id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def revoke_session(self, session_id: uuid.UUID) -> None:
        """Mark a specific session as revoked."""
        stmt = (
            update(UserSession)
            .where(UserSession.id == session_id)
            .values(is_revoked=True)
        )
        await self.db.execute(stmt)

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> int:
        """Revoke all active sessions for a user (logout all devices)."""
        stmt = (
            update(UserSession)
            .where(UserSession.user_id == user_id, UserSession.is_revoked == False)  # noqa: E712
            .values(is_revoked=True)
        )
        result = await self.db.execute(stmt)
        return result.rowcount

    async def revoke_family(self, family_id: uuid.UUID) -> int:
        """Revoke all sessions in a token family (triggered on token reuse detection)."""
        if not family_id:
            return 0
        stmt = (
            update(UserSession)
            .where(UserSession.family_id == family_id, UserSession.is_revoked == False)  # noqa: E712
            .values(is_revoked=True)
        )
        result = await self.db.execute(stmt)
        return result.rowcount

    async def get_active_sessions_for_user(self, user_id: uuid.UUID) -> List[UserSession]:
        """List unexpired, unrevoked sessions for a user."""
        now = datetime.now(timezone.utc)
        stmt = (
            select(UserSession)
            .where(
                UserSession.user_id == user_id,
                UserSession.is_revoked == False,  # noqa: E712
                UserSession.expires_at > now,
            )
            .order_by(UserSession.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

