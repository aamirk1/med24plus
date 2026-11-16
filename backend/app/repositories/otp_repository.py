import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.otp import OTPVerification


class OTPRepository:
    """Async database operations for OTP generation, attempts, and verification."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_otp(
        self,
        target: str,
        otp_hash: str,
        purpose: str,
        expires_at: datetime,
        max_attempts: int = 5,
    ) -> OTPVerification:
        """Store a new hashed OTP verification record."""
        # Invalidate previous unused OTPs for the same target and purpose
        await self.invalidate_previous_otps(target, purpose)

        otp_record = OTPVerification(
            target=target,
            otp_hash=otp_hash,
            purpose=purpose,
            expires_at=expires_at,
            max_attempts=max_attempts,
            attempts=0,
            is_used=False,
        )
        self.db.add(otp_record)
        await self.db.flush()
        return otp_record

    async def get_latest_active(self, target: str, purpose: str) -> Optional[OTPVerification]:
        """Fetch latest active, unexpired, and unused OTP record."""
        now = datetime.now(timezone.utc)
        stmt = (
            select(OTPVerification)
            .where(
                OTPVerification.target == target,
                OTPVerification.purpose == purpose,
                OTPVerification.is_used == False,  # noqa: E712
                OTPVerification.expires_at > now,
            )
            .order_by(OTPVerification.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def increment_attempts(self, otp_id: uuid.UUID) -> int:
        """Increment failed attempts count and return new count."""
        stmt = (
            update(OTPVerification)
            .where(OTPVerification.id == otp_id)
            .values(attempts=OTPVerification.attempts + 1)
            .returning(OTPVerification.attempts)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def mark_as_used(self, otp_id: uuid.UUID) -> None:
        """Mark OTP as successfully used."""
        stmt = (
            update(OTPVerification)
            .where(OTPVerification.id == otp_id)
            .values(is_used=True)
        )
        await self.db.execute(stmt)

    async def invalidate_previous_otps(self, target: str, purpose: str) -> None:
        """Invalidate all prior OTPs for this target and purpose."""
        stmt = (
            update(OTPVerification)
            .where(
                OTPVerification.target == target,
                OTPVerification.purpose == purpose,
                OTPVerification.is_used == False,  # noqa: E712
            )
            .values(is_used=True)
        )
        await self.db.execute(stmt)

