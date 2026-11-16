import uuid
from typing import Any, Callable, List, Optional
import jwt
from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import RoleEnum, get_permissions_for_roles
from app.core.security import decode_token
from app.models.user import User
from app.repositories.user_repository import UserRepository


async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    med24_access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extract, decode, and validate the JWT access token from Authorization header or HttpOnly cookie.
    """
    token: Optional[str] = None

    # 1. Bearer Header takes priority
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]

    # 2. Fall back to secure cookie
    if not token and med24_access_token:
        token = med24_access_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Authentication required. Please provide a valid Bearer token or sign in.",
                "error": {"code": "UNAUTHENTICATED"},
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Decode & Verify Token
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Access token has expired. Please refresh your session.",
                "error": {"code": "TOKEN_EXPIRED"},
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Invalid token signature or format.",
                "error": {"code": "INVALID_TOKEN"},
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Invalid token type presented for authentication.",
                "error": {"code": "INVALID_TOKEN_TYPE"},
            },
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Malformed token subject.",
                "error": {"code": "INVALID_TOKEN_CLAIMS"},
            },
        )

    # 4. Fetch User from DB
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(uuid.UUID(user_id_str))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "User account no longer exists.",
                "error": {"code": "USER_NOT_FOUND"},
            },
        )

    if not user.is_active or user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "message": "This account is inactive or has been suspended.",
                "error": {"code": "ACCOUNT_SUSPENDED"},
            },
        )

    # Dynamically bind role slugs and computed permissions onto user object for convenience
    role_slugs = await user_repo.get_user_role_slugs(user)
    user._cached_roles = role_slugs  # type: ignore[attr-defined]
    user._cached_permissions = list(get_permissions_for_roles(role_slugs))  # type: ignore[attr-defined]

    return user


async def require_authenticated_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure user is successfully authenticated."""
    return current_user


def require_role(*allowed_roles: str) -> Callable:
    """Dependency factory checking that current user possesses at least one of the allowed roles."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_roles: List[str] = getattr(current_user, "_cached_roles", [])
        # Super admin always has bypass access
        if RoleEnum.SUPER_ADMIN.value in user_roles:
            return current_user

        if not any(role in user_roles for role in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "message": "You do not have the required role to access this resource.",
                    "error": {
                        "code": "FORBIDDEN_ROLE",
                        "required_roles": list(allowed_roles),
                    },
                },
            )
        return current_user

    return role_checker


def require_permission(*required_permissions: str) -> Callable:
    """Dependency factory checking that current user possesses all required granular permissions."""
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        user_roles: List[str] = getattr(current_user, "_cached_roles", [])
        if RoleEnum.SUPER_ADMIN.value in user_roles:
            return current_user

        user_perms: List[str] = getattr(current_user, "_cached_permissions", [])
        missing = [p for p in required_permissions if p not in user_perms]

        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "message": "You lack the permissions required to perform this action.",
                    "error": {
                        "code": "FORBIDDEN_PERMISSION",
                        "missing_permissions": missing,
                    },
                },
            )
        return current_user

    return permission_checker


async def require_verified_pharmacist(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensure the user is a pharmacist who has been verified by an administrator under Rule 65
    of the Drugs and Cosmetics Rules, 1945.
    """
    user_roles: List[str] = getattr(current_user, "_cached_roles", [])
    if RoleEnum.SUPER_ADMIN.value in user_roles or RoleEnum.ADMIN.value in user_roles:
        return current_user

    if RoleEnum.PHARMACIST.value not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "message": "Restricted to licensed pharmacists.",
                "error": {"code": "NOT_A_PHARMACIST"},
            },
        )

    profile = current_user.pharmacist_profile
    if not profile or not profile.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "message": "Pharmacist account is pending statutory council verification under Rule 65.",
                "error": {
                    "code": "PHARMACIST_NOT_VERIFIED",
                    "registration_number": profile.registration_number if profile else None,
                },
            },
        )

    return current_user


async def require_active_delivery_partner(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure user is an active delivery personnel."""
    user_roles: List[str] = getattr(current_user, "_cached_roles", [])
    if RoleEnum.SUPER_ADMIN.value in user_roles or RoleEnum.ADMIN.value in user_roles:
        return current_user

    if RoleEnum.DELIVERY_PARTNER.value not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "message": "Restricted to authorized delivery personnel.",
                "error": {"code": "NOT_DELIVERY_PARTNER"},
            },
        )
    return current_user

