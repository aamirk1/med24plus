from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_active_delivery_partner, require_role
from app.core.permissions import RoleEnum
from app.middleware.rate_limit import RateLimiter
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenData, UserResponse
from app.schemas.common import APIResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post(
    "/login",
    response_model=APIResponse[TokenData],
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def delivery_partner_login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Delivery fleet personnel authentication."""
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
                "message": error or "Invalid delivery partner credentials.",
                "error": {"code": "INVALID_DELIVERY_CREDENTIALS"},
            },
        )

    role_slugs = await auth_service.user_repo.get_user_role_slugs(user)
    if RoleEnum.DELIVERY_PARTNER.value not in role_slugs and RoleEnum.SUPER_ADMIN.value not in role_slugs:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "message": "Access denied. Delivery partner role required.",
                "error": {"code": "NOT_DELIVERY_PARTNER"},
            },
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
    )

    return APIResponse(
        success=True,
        message="Delivery personnel authenticated successfully.",
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
async def delivery_get_me(
    current_user: User = Depends(require_active_delivery_partner),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve delivery personnel profile and dispatch credentials."""
    auth_service = AuthService(db)
    role_slugs = await auth_service.user_repo.get_user_role_slugs(current_user)

    return APIResponse(
        success=True,
        message="Delivery personnel profile retrieved.",
        data=UserResponse(
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
        ),
    )

