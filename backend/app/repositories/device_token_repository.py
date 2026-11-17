import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.device_token import UserDeviceToken


class DeviceTokenRepository:
    """Async database operations for managing user FCM device tokens."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_device_token(
        self,
        user_id: uuid.UUID,
        fcm_token: str,
        device_type: Optional[str] = "android",
    ) -> UserDeviceToken:
        """Register or update an active FCM device token for a user."""
        clean_token = fcm_token.strip()
        stmt = select(UserDeviceToken).where(UserDeviceToken.fcm_token == clean_token)
        result = await self.db.execute(stmt)
        record = result.scalars().first()

        now = datetime.now(timezone.utc)

        if record:
            record.user_id = user_id
            record.device_type = device_type or record.device_type
            record.is_active = True
            record.last_used_at = now
            record.updated_at = now
            return record

        new_record = UserDeviceToken(
            user_id=user_id,
            fcm_token=clean_token,
            device_type=device_type or "android",
            is_active=True,
            last_used_at=now,
        )
        self.db.add(new_record)
        return new_record

    async def deactivate_token(self, fcm_token: str) -> bool:
        """Deactivate a specific device token upon logout or invalid token report."""
        stmt = (
            update(UserDeviceToken)
            .where(UserDeviceToken.fcm_token == fcm_token.strip())
            .values(is_active=False, updated_at=datetime.now(timezone.utc))
        )
        res = await self.db.execute(stmt)
        return res.rowcount > 0

    async def deactivate_all_for_user(self, user_id: uuid.UUID) -> int:
        """Deactivate all registered device tokens for a user (e.g. global logout)."""
        stmt = (
            update(UserDeviceToken)
            .where(UserDeviceToken.user_id == user_id, UserDeviceToken.is_active == True)
            .values(is_active=False, updated_at=datetime.now(timezone.utc))
        )
        res = await self.db.execute(stmt)
        return res.rowcount

    async def get_active_tokens_for_user(self, user_id: uuid.UUID) -> List[str]:
        """Fetch all currently active FCM tokens belonging to a user."""
        stmt = (
            select(UserDeviceToken.fcm_token)
            .where(
                UserDeviceToken.user_id == user_id,
                UserDeviceToken.is_active == True,
            )
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_active_tokens_for_users(self, user_ids: List[uuid.UUID]) -> List[str]:
        """Fetch all active FCM tokens for a group of users."""
        if not user_ids:
            return []
        stmt = (
            select(UserDeviceToken.fcm_token)
            .where(
                UserDeviceToken.user_id.in_(user_ids),
                UserDeviceToken.is_active == True,
            )
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
