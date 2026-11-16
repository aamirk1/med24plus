from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.permissions import RoleEnum
from app.middleware.rate_limit import RateLimiter
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenData, UserResponse
from app.schemas.common import APIResponse
from app.services.auth_service import AuthService

router = APIRouter()

ALLOWED_ADMIN_ROLES = [
    RoleEnum.SUPER_ADMIN.value,
    RoleEnum.ADMIN.value,
    RoleEnum.STAFF.value,
]


@router.post(
    "/login",
    response_model=APIResponse[TokenData],
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def admin_login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Authorized personnel access endpoint.
    Restricted to super_admin, admin, and staff roles. Rejects customer accounts.
    """
    auth_service = AuthService(db)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    success, user, token_data, error = await auth_service.authenticate_user(
        identifier=payload.identifier,
        password=payload.password,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    if not success or not user or not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": error or "Invalid administrative credentials.",
                "error": {"code": "INVALID_ADMIN_CREDENTIALS"},
            },
        )

    role_slugs = await auth_service.user_repo.get_user_role_slugs(user)
    if not any(r in ALLOWED_ADMIN_ROLES for r in role_slugs):
        # Reject unauthorized roles attempting to access administrative portal
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "message": "Access denied. Administrative role required.",
                "error": {"code": "INSUFFICIENT_ADMIN_PRIVILEGES"},
            },
        )

    # Set secure HttpOnly cookies for web admin console
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token_data["access_token"],
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    user_response = UserResponse(
        id=user.id,
        full_name=user.full_name,
        phone=user.phone,
        email=user.email,
        is_active=user.is_active,
        is_phone_verified=user.is_phone_verified,
        is_email_verified=user.is_email_verified,
        status=user.status,
        roles=role_slugs,
        staff_profile=user.staff_profile,
    )

    return APIResponse(
        success=True,
        message="Administrative login successful.",
        data=TokenData(
            access_token=token_data["access_token"],
            refresh_token=token_data["refresh_token"],
            token_type=token_data["token_type"],
            expires_in=token_data["expires_in"],
            user=user_response,
        ),
    )


@router.get(
    "/me",
    response_model=APIResponse[UserResponse],
)
async def admin_get_me(
    current_user: User = Depends(require_role(*ALLOWED_ADMIN_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve administrative user profile and active management permissions."""
    auth_service = AuthService(db)
    role_slugs = await auth_service.user_repo.get_user_role_slugs(current_user)

    user_response = UserResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        phone=current_user.phone,
        email=current_user.email,
        is_active=current_user.is_active,
        is_phone_verified=current_user.is_phone_verified,
        is_email_verified=current_user.is_email_verified,
        status=current_user.status,
        roles=role_slugs,
        permissions=getattr(current_user, "_cached_permissions", []),
        staff_profile=current_user.staff_profile,
    )

    return APIResponse(
        success=True,
        message="Administrative session valid.",
        data=user_response,
    )


@router.post(
    "/logout",
    response_model=APIResponse[Dict[str, bool]],
)
async def admin_logout(
    response: Response,
    current_user: User = Depends(require_role(*ALLOWED_ADMIN_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    """Terminate admin session and clear credentials."""
    auth_service = AuthService(db)
    await auth_service.logout(None, user_id=current_user.id)
    response.delete_cookie(key=settings.AUTH_COOKIE_NAME, path="/")
    response.delete_cookie(key=settings.REFRESH_COOKIE_NAME, path="/api/v1/auth")

    return APIResponse(
        success=True,
        message="Logged out from administration panel successfully.",
        data={"logged_out": True},
    )

