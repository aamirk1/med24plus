import hashlib
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.repositories.otp_repository import OTPRepository

logger = logging.getLogger("med24plus.otp")


class OTPService:
    """Service for OTP generation, hashing, rate limiting, and verification."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = OTPRepository(db)

    @staticmethod
    def _generate_code(length: int = 6) -> str:
        """Generate a cryptographically secure numeric OTP."""
        digits = "0123456789"
        return "".join(secrets.choice(digits) for _ in range(length))

    @staticmethod
    def _hash_otp(target: str, otp: str, purpose: str) -> str:
        """Hash OTP with target and purpose salt before persistence."""
        salt = f"{target.strip()}:{purpose.strip()}"
        return hashlib.sha256(f"{salt}:{otp.strip()}".encode("utf-8")).hexdigest()

    async def generate_otp(
        self,
        target: str,
        purpose: str,
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Generate and persist a hashed OTP.
        Returns: (success, error_message, dev_otp_code)
        dev_otp_code is provided ONLY in development environment for testing.
        """
        # 1. Check cooldown (prevent spamming within 60 seconds)
        latest = await self.repo.get_latest_active(target, purpose)
        now = datetime.now(timezone.utc)
        if latest and (now - latest.created_at).total_seconds() < settings.OTP_COOLDOWN_SECONDS:
            remaining = int(settings.OTP_COOLDOWN_SECONDS - (now - latest.created_at).total_seconds())
            return False, f"Please wait {remaining} seconds before requesting a new OTP.", None

        # 2. Generate secure 6-digit code
        otp_code = self._generate_code(6)
        otp_hash = self._hash_otp(target, otp_code, purpose)
        expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

        # 3. Persist record
        await self.repo.create_otp(
            target=target,
            otp_hash=otp_hash,
            purpose=purpose,
            expires_at=expires_at,
            max_attempts=settings.OTP_MAX_ATTEMPTS,
        )

        # 4. Local dev / testing dispatch (simulated provider)
        if settings.ENVIRONMENT == "development":
            logger.info(f"[DEV ONLY OTP DISPATCH] Target: {target} | Purpose: {purpose} | Code: {otp_code}")
            return True, None, otp_code

        # In production, dispatch via provider (future integration)
        logger.info(f"Dispatched OTP to target: {target[:4]}*** (provider dispatch simulated)")
        return True, None, None

    async def verify_otp(
        self,
        target: str,
        otp_code: str,
        purpose: str,
    ) -> Tuple[bool, str]:
        """
        Verify a submitted OTP.
        Returns: (is_valid, message)
        """
        record = await self.repo.get_latest_active(target, purpose)
        if not record:
            return False, "OTP has expired or is invalid. Please request a new code."

        # Check maximum attempts
        if record.attempts >= record.max_attempts:
            await self.repo.mark_as_used(record.id)
            return False, "Maximum verification attempts exceeded. Please request a new OTP."

        expected_hash = self._hash_otp(target, otp_code, purpose)
        # Constant-time comparison
        is_match = secrets.compare_digest(record.otp_hash, expected_hash)

        if not is_match:
            new_attempts = await self.repo.increment_attempts(record.id)
            remaining = record.max_attempts - new_attempts
            if remaining > 0:
                return False, f"Invalid OTP. {remaining} attempt(s) remaining."
            else:
                await self.repo.mark_as_used(record.id)
                return False, "Maximum verification attempts exceeded. Please request a new OTP."

        # Mark OTP as used
        await self.repo.mark_as_used(record.id)
        return True, "OTP verified successfully."

