import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.permissions import RoleEnum, get_permissions_for_roles
from app.models.user import User
from app.repositories.auth_event_repository import AuthEventRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository
from app.services.otp_service import OTPService
from app.services.password_service import PasswordService
from app.services.token_service import TokenService


def normalize_phone(phone: str) -> str:
    """Normalize Indian phone numbers to E.164 format (+91XXXXXXXXXX)."""
    cleaned = re.sub(r"[\s\-\(\)]", "", phone.strip())
    if cleaned.startswith("+91"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("0") and len(cleaned) == 11:
        cleaned = cleaned[1:]
    if not re.match(r"^[6-9]\d{9}$", cleaned):
        raise ValueError("Invalid Indian mobile number. Must be a valid 10-digit number.")
    return f"+91{cleaned}"


def normalize_email(email: Optional[str]) -> Optional[str]:
    """Normalize email address to lowercase and trimmed."""
    if not email:
        return None
    cleaned = email.strip().lower()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", cleaned):
        raise ValueError("Invalid email address format.")
    return cleaned


class AuthService:
    """Core domain service managing user authentication, sessions, and credentials."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.role_repo = RoleRepository(db)
        self.session_repo = SessionRepository(db)
        self.auth_event_repo = AuthEventRepository(db)
        self.token_service = TokenService(db)
        self.otp_service = OTPService(db)
        self.password_service = PasswordService()

    async def register_customer(
        self,
        full_name: str,
        phone: str,
        password: str,
        confirm_password: str,
        email: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[bool, Optional[User], Optional[str]]:
        """Register a new customer account."""
        # 1. Password confirmation check
        if password != confirm_password:
            return False, None, "Passwords do not match."

        # 2. Password strength check
        is_strong, reason = self.password_service.validate_strength(password)
        if not is_strong:
            return False, None, reason

        # 3. Input normalization
        try:
            norm_phone = normalize_phone(phone)
        except ValueError as e:
            return False, None, str(e)

        norm_email = None
        if email and email.strip():
            try:
                norm_email = normalize_email(email)
            except ValueError as e:
                return False, None, str(e)

        # 4. Duplicate checks
        existing_phone = await self.user_repo.get_by_phone(norm_phone)
        if existing_phone:
            return False, None, "An account with this phone number already exists."

        if norm_email:
            existing_email = await self.user_repo.get_by_email(norm_email)
            if existing_email:
                return False, None, "An account with this email address already exists."

        # 5. Hash password with Argon2id
        hashed_password = self.password_service.hash_password(password)

        # 6. Create User and default profile
        user = await self.user_repo.create_user(
            phone=norm_phone,
            email=norm_email,
            hashed_password=hashed_password,
            full_name=full_name.strip(),
            is_phone_verified=False,
            is_email_verified=False,
        )

        # 7. Assign customer role
        customer_role = await self.role_repo.get_by_slug(RoleEnum.CUSTOMER.value)
        if not customer_role:
            customer_role = await self.role_repo.create_role_if_not_exists(
                name="Customer",
                slug=RoleEnum.CUSTOMER.value,
                description="Standard retail online pharmacy patient and customer",
            )
        await self.user_repo.assign_role(user.id, customer_role.id)

        # 8. Log authentication event
        await self.auth_event_repo.log_event(
            identifier=norm_phone,
            event_type="registration",
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            details="Customer registration completed",
        )

        await self.db.commit()
        # Reload user with roles
        created_user = await self.user_repo.get_by_id(user.id)
        return True, created_user, None

    async def authenticate_user(
        self,
        identifier: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        device_info: Optional[str] = None,
    ) -> Tuple[bool, Optional[User], Optional[Dict[str, Any]], Optional[str]]:
        """
        Authenticate a user using phone or email and password.
        Returns: (success, user, token_dict, error_message)
        """
        raw_identifier = identifier.strip()

        # 1. Rate limiting / Lockout check for failed attempts
        failed_count = await self.auth_event_repo.count_recent_failed_attempts(
            identifier=raw_identifier,
            minutes=settings.ACCOUNT_LOCKOUT_MINUTES,
        )
        if failed_count >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
            await self.auth_event_repo.log_event(
                identifier=raw_identifier,
                event_type="lockout",
                ip_address=ip_address,
                user_agent=user_agent,
                details=f"Locked out after {failed_count} failed attempts",
            )
            return False, None, None, f"Too many failed login attempts. Account temporarily locked for {settings.ACCOUNT_LOCKOUT_MINUTES} minutes."

        # 2. Lookup user by phone or email
        user: Optional[User] = None
        try:
            norm_phone = normalize_phone(raw_identifier)
            user = await self.user_repo.get_by_phone(norm_phone)
        except ValueError:
            pass

        if not user and "@" in raw_identifier:
            try:
                norm_email = normalize_email(raw_identifier)
                user = await self.user_repo.get_by_email(norm_email)
            except ValueError:
                pass

        # 3. Safe password check (timing-attack resistant)
        if not user or not user.hashed_password:
            # Hash dummy password to simulate constant work
            self.password_service.verify("dummy_password", "$argon2id$v=19$m=19456,t=2,p=1$placeholder$placeholder")
            await self.auth_event_repo.log_event(
                identifier=raw_identifier,
                event_type="login_failed",
                ip_address=ip_address,
                user_agent=user_agent,
                details="User not found or password absent",
            )
            await self.db.commit()
            return False, None, None, "Invalid mobile number/email or password."

        # Check account status
        if not user.is_active or user.status == "suspended":
            return False, None, None, "Your account is inactive or suspended. Please contact support."

        # Verify password
        is_valid = self.password_service.verify(password, user.hashed_password)
        if not is_valid:
            await self.auth_event_repo.log_event(
                identifier=raw_identifier,
                event_type="login_failed",
                user_id=user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                details="Password mismatch",
            )
            await self.db.commit()
            return False, None, None, "Invalid mobile number/email or password."

        # 4. Extract roles and permissions
        role_slugs = await self.user_repo.get_user_role_slugs(user)
        permissions = list(get_permissions_for_roles(role_slugs))

        # 5. Issue Token Pair
        token_data = await self.token_service.issue_token_pair(
            user_id=user.id,
            roles=role_slugs,
            permissions=permissions,
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=device_info,
        )

        # 6. Update last_login_at & log success
        user.last_login_at = datetime.now(timezone.utc)
        await self.auth_event_repo.log_event(
            identifier=raw_identifier,
            event_type="login_success",
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            details="User logged in successfully",
        )

        await self.db.commit()
        return True, user, token_data, None

    async def refresh_tokens(
        self,
        refresh_token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """Rotate refresh token and issue new token pair."""
        # Decode user id to load current roles and permissions
        try:
            from app.core.security import decode_token
            payload = decode_token(refresh_token)
            user_id = uuid.UUID(payload.get("sub"))
            user = await self.user_repo.get_by_id(user_id)
            if not user or not user.is_active or user.status == "suspended":
                return False, None, "User account is suspended or invalid."

            role_slugs = await self.user_repo.get_user_role_slugs(user)
            permissions = list(get_permissions_for_roles(role_slugs))

            success, token_data, err = await self.token_service.rotate_refresh_token(
                raw_refresh_token=refresh_token,
                user_roles=role_slugs,
                user_permissions=permissions,
                ip_address=ip_address,
                user_agent=user_agent,
            )

            if success:
                await self.auth_event_repo.log_event(
                    identifier=user.phone,
                    event_type="token_refresh",
                    user_id=user.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    details="Token rotated successfully",
                )
            else:
                await self.auth_event_repo.log_event(
                    identifier=user.phone,
                    event_type="token_refresh_failed",
                    user_id=user.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    details=err,
                )

            await self.db.commit()
            return success, token_data, err
        except Exception as e:
            return False, None, f"Failed to refresh token: {str(e)}"

    async def logout(self, refresh_token: Optional[str], user_id: Optional[uuid.UUID] = None) -> bool:
        """Revoke current session."""
        if refresh_token:
            await self.token_service.revoke_refresh_token(refresh_token)
        if user_id:
            await self.auth_event_repo.log_event(
                identifier=str(user_id),
                event_type="logout",
                user_id=user_id,
                details="User logged out",
            )
        await self.db.commit()
        return True

    async def logout_all(self, user_id: uuid.UUID) -> int:
        """Revoke all active sessions for the user across all devices."""
        count = await self.session_repo.revoke_all_for_user(user_id)
        await self.auth_event_repo.log_event(
            identifier=str(user_id),
            event_type="logout_all",
            user_id=user_id,
            details=f"All {count} sessions revoked",
        )
        await self.db.commit()
        return count

    async def reset_password_with_otp(
        self,
        identifier: str,
        otp_code: str,
        new_password: str,
        confirm_password: str,
    ) -> Tuple[bool, str]:
        """Verify password reset OTP and set new password."""
        if new_password != confirm_password:
            return False, "Passwords do not match."

        is_strong, reason = self.password_service.validate_strength(new_password)
        if not is_strong:
            return False, reason

        # Find user
        raw = identifier.strip()
        user = None
        try:
            norm_phone = normalize_phone(raw)
            user = await self.user_repo.get_by_phone(norm_phone)
            target = norm_phone
        except ValueError:
            target = raw.lower()
            user = await self.user_repo.get_by_email(target)

        if not user:
            return False, "Account not found."

        # Verify OTP
        is_valid, msg = await self.otp_service.verify_otp(
            target=target,
            otp_code=otp_code,
            purpose="password_reset",
        )
        if not is_valid:
            return False, msg

        # Hash new password
        user.hashed_password = self.password_service.hash_password(new_password)

        # Invalidate all existing sessions on password reset
        await self.session_repo.revoke_all_for_user(user.id)

        # Log event
        await self.auth_event_repo.log_event(
            identifier=target,
            event_type="password_reset",
            user_id=user.id,
            details="Password reset via OTP completed",
        )
        await self.db.commit()
        return True, "Password reset successfully. Please sign in with your new password."

    async def change_password(
        self,
        user_id: uuid.UUID,
        current_password: str,
        new_password: str,
        confirm_password: str,
    ) -> Tuple[bool, str]:
        """Change authenticated user's password."""
        if new_password != confirm_password:
            return False, "New passwords do not match."

        is_strong, reason = self.password_service.validate_strength(new_password)
        if not is_strong:
            return False, reason

        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.hashed_password:
            return False, "User not found."

        if not self.password_service.verify(current_password, user.hashed_password):
            return False, "Current password is incorrect."

        user.hashed_password = self.password_service.hash_password(new_password)
        # Revoke other sessions
        await self.session_repo.revoke_all_for_user(user.id)

        await self.auth_event_repo.log_event(
            identifier=user.phone,
            event_type="password_change",
            user_id=user.id,
            details="Password changed successfully",
        )
        await self.db.commit()
        return True, "Password changed successfully."

