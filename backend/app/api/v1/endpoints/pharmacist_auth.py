from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role, require_verified_pharmacist
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
async def pharmacist_login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Registered Pharmacist authentication under Drugs & Cosmetics Rules, 1945.
    Verifies pharmacist role and returns statutory license profile.
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
                "message": error or "Invalid credentials.",
                "error": {"code": "INVALID_PHARMACIST_CREDENTIALS"},
            },
        )

    role_slugs = await auth_service.user_repo.get_user_role_slugs(user)
    if RoleEnum.PHARMACIST.value not in role_slugs and RoleEnum.SUPER_ADMIN.value not in role_slugs:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "message": "Access restricted to licensed pharmacists.",
                "error": {"code": "NOT_A_PHARMACIST"},
            },
        )

    # Set cookies for web console
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
        pharmacist_profile=user.pharmacist_profile,
    )

    return APIResponse(
        success=True,
        message="Pharmacist authentication successful.",
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
async def pharmacist_get_me(
    current_user: User = Depends(require_role(RoleEnum.PHARMACIST.value, RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value)),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve pharmacist professional profile and council registration details."""
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
        pharmacist_profile=current_user.pharmacist_profile,
    )

    return APIResponse(
        success=True,
        message="Pharmacist profile retrieved successfully.",
        data=user_response,
    )


@router.get(
    "/status",
    response_model=APIResponse[Dict[str, Any]],
)
async def pharmacist_check_status(
    current_user: User = Depends(require_role(RoleEnum.PHARMACIST.value, RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value)),
):
    """
    Check pharmacist statutory verification status under Rule 65.
    Unverified pharmacists cannot participate in prescription review or dispensing.
    """
    profile = current_user.pharmacist_profile
    is_verified = bool(profile and profile.is_verified)

    return APIResponse(
        success=True,
        message="Pharmacist verification status retrieved.",
        data={
            "is_verified": is_verified,
            "can_dispense": is_verified and current_user.is_active and current_user.status == "active",
            "registration_number": profile.registration_number if profile else None,
            "state_pharmacy_council": profile.state_pharmacy_council if profile else None,
            "registration_valid_upto": profile.registration_valid_upto if profile else None,
            "status": current_user.status,
        },
    )


@router.get(
    "/workspace",
    response_model=APIResponse[Dict[str, str]],
)
async def pharmacist_verified_workspace(
    current_user: User = Depends(require_verified_pharmacist),
):
    """
    Restricted pharmacist workspace endpoint.
    Protected strictly by require_verified_pharmacist: unverified pharmacists are denied with 403.
    """
    return APIResponse(
        success=True,
        message="Welcome to the verified pharmacist operational workspace.",
        data={
            "pharmacist_name": current_user.full_name or "Registered Pharmacist",
            "verification_status": "VERIFIED_STATUTORY",
        },
    )

