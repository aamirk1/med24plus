import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_token
from app.models.user import UserSession
from app.repositories.session_repository import SessionRepository


class TokenService:
    """Service for access token issuance, refresh token rotation, and reuse detection."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.session_repo = SessionRepository(db)

    async def issue_token_pair(
        self,
        user_id: uuid.UUID,
        roles: List[str],
        permissions: List[str],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        device_info: Optional[str] = None,
        family_id: Optional[uuid.UUID] = None,
    ) -> Dict[str, Any]:
        """
        Issue a new short-lived access token and a rotatable refresh token backed by a DB session.
        """
        session_id = uuid.uuid4()
        token_family = family_id or uuid.uuid4()
        refresh_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        # 1. Create JWT Tokens
        access_token = create_access_token(
            subject=str(user_id),
            roles=roles,
            permissions=permissions,
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        refresh_token = create_refresh_token(
            subject=str(user_id),
            session_id=str(session_id),
            family_id=str(token_family),
            expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )

        # 2. Hash refresh token for secure database storage
        token_hash = hash_token(refresh_token)

        # 3. Persist session
        await self.session_repo.create_session(
            user_id=user_id,
            session_token_hash=token_hash,
            expires_at=refresh_expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=device_info,
            family_id=token_family,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    async def rotate_refresh_token(
        self,
        raw_refresh_token: str,
        user_roles: List[str],
        user_permissions: List[str],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Rotate a refresh token, validating its session and enforcing token reuse detection.
        Returns: (success, token_data_dict, error_message)
        """
        try:
            payload = decode_token(raw_refresh_token)
        except jwt.ExpiredSignatureError:
            return False, None, "Refresh token has expired. Please sign in again."
        except jwt.InvalidTokenError:
            return False, None, "Invalid refresh token."

        if payload.get("type") != "refresh":
            return False, None, "Invalid token type."

        user_id_str = payload.get("sub")
        family_id_str = payload.get("family_id")
        if not user_id_str or not family_id_str:
            return False, None, "Malformed refresh token claims."

        user_id = uuid.UUID(user_id_str)
        family_id = uuid.UUID(family_id_str)
        token_hash = hash_token(raw_refresh_token)

        # Lookup session in database
        session = await self.session_repo.get_by_token_hash(token_hash)

        if not session:
            # Token not recognized in database - potential forged token
            return False, None, "Session not found or invalid."

        # Token Reuse Detection: If session was ALREADY revoked, an attacker or replay attack has occurred!
        if session.is_revoked:
            # Invalidate all sessions in this token family immediately!
            await self.session_repo.revoke_family(family_id)
            return False, None, "Refresh token reuse detected. All sessions have been revoked for your security."

        now = datetime.now(timezone.utc)
        if session.expires_at < now:
            await self.session_repo.revoke_session(session.id)
            return False, None, "Refresh token session has expired. Please sign in again."

        # Valid rotation: Revoke current session
        await self.session_repo.revoke_session(session.id)

        # Issue new token pair preserving the same family_id
        new_tokens = await self.issue_token_pair(
            user_id=user_id,
            roles=user_roles,
            permissions=user_permissions,
            ip_address=ip_address,
            user_agent=user_agent,
            family_id=family_id,
        )
        return True, new_tokens, None

    async def revoke_refresh_token(self, raw_refresh_token: str) -> bool:
        """Revoke a refresh token on logout."""
        try:
            token_hash = hash_token(raw_refresh_token)
            session = await self.session_repo.get_by_token_hash(token_hash)
            if session:
                await self.session_repo.revoke_session(session.id)
                return True
        except Exception:
            pass
        return False

