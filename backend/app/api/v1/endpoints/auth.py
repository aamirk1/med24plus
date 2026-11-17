from typing import Any, Dict, Optional
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_authenticated_user
from app.middleware.rate_limit import RateLimiter
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    FirebasePhoneAuthResponse,
    FirebaseVerifyOtpRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    SendOtpRequest,
    TokenData,
    UserResponse,
    VerifyOtpRequest,
)
from app.schemas.common import APIResponse
from app.services.auth_service import AuthService
from app.services.firebase_service import FirebaseService
from app.services.otp_service import OTPService

router = APIRouter()


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """Set secure HttpOnly cookies for web clients."""
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )


def _clear_auth_cookies(response: Response):
    """Clear cookies on logout."""
    response.delete_cookie(key=settings.AUTH_COOKIE_NAME, path="/")
    response.delete_cookie(key=settings.REFRESH_COOKIE_NAME, path="/api/v1/auth")


@router.post(
    "/register",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=10, seconds=60))],
)
async def register(
    payload: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Register a new customer account."""
    auth_service = AuthService(db)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    success, user, error = await auth_service.register_customer(
        full_name=payload.full_name,
        phone=payload.phone,
        password=payload.password,
        confirm_password=payload.confirm_password,
        email=payload.email,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    if not success or not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": error or "Registration failed",
                "error": {"code": "REGISTRATION_FAILED"},
            },
        )

    role_slugs = await auth_service.user_repo.get_user_role_slugs(user)
    user_data = UserResponse(
        id=user.id,
        full_name=user.full_name,
        phone=user.phone,
        email=user.email,
        is_active=user.is_active,
        is_phone_verified=user.is_phone_verified,
        is_email_verified=user.is_email_verified,
        status=user.status,
        roles=role_slugs,
        permissions=[],
    )

    return APIResponse(
        success=True,
        message="Account registered successfully. Please verify your mobile number.",
        data=user_data,
    )


@router.post(
    "/login",
    response_model=APIResponse[TokenData],
    dependencies=[Depends(RateLimiter(times=10, seconds=60))],
)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate with mobile number or email and password."""
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
                "message": error or "Invalid credentials",
                "error": {"code": "INVALID_CREDENTIALS"},
            },
        )

    # Set cookies for web browsers
    _set_auth_cookies(response, token_data["access_token"], token_data["refresh_token"])

    role_slugs = await auth_service.user_repo.get_user_role_slugs(user)
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
        message="Login successful",
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
async def get_me(
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve current authenticated user profile, roles, and verification status."""
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
        profile=current_user.profile,
        pharmacist_profile=current_user.pharmacist_profile,
        staff_profile=current_user.staff_profile,
    )

    return APIResponse(
        success=True,
        message="Profile retrieved successfully",
        data=user_response,
    )


@router.post(
    "/refresh",
    response_model=APIResponse[Dict[str, Any]],
    dependencies=[Depends(RateLimiter(times=20, seconds=60))],
)
async def refresh_token(
    request: Request,
    response: Response,
    payload: Optional[RefreshTokenRequest] = None,
    med24_refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    """Rotate refresh token and issue new token pair with reuse detection."""
    token: Optional[str] = None
    if payload and payload.refresh_token:
        token = payload.refresh_token
    elif med24_refresh_token:
        token = med24_refresh_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": "Refresh token is required.",
                "error": {"code": "REFRESH_TOKEN_REQUIRED"},
            },
        )

    auth_service = AuthService(db)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    success, new_tokens, err = await auth_service.refresh_tokens(
        refresh_token=token,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    if not success or not new_tokens:
        _clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": err or "Failed to refresh token",
                "error": {"code": "REFRESH_FAILED"},
            },
        )

    _set_auth_cookies(response, new_tokens["access_token"], new_tokens["refresh_token"])

    return APIResponse(
        success=True,
        message="Token refreshed successfully",
        data=new_tokens,
    )


@router.post(
    "/logout",
    response_model=APIResponse[Dict[str, bool]],
)
async def logout(
    response: Response,
    current_user: Optional[User] = Depends(get_current_user),
    payload: Optional[RefreshTokenRequest] = None,
    med24_refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    """Revoke session and invalidate tokens."""
    token = payload.refresh_token if payload else med24_refresh_token
    auth_service = AuthService(db)
    await auth_service.logout(token, user_id=current_user.id if current_user else None)
    _clear_auth_cookies(response)

    return APIResponse(
        success=True,
        message="Logged out successfully",
        data={"logged_out": True},
    )


@router.post(
    "/logout-all",
    response_model=APIResponse[Dict[str, int]],
)
async def logout_all(
    response: Response,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke all active sessions belonging to the user across all devices."""
    auth_service = AuthService(db)
    count = await auth_service.logout_all(current_user.id)
    _clear_auth_cookies(response)

    return APIResponse(
        success=True,
        message=f"Successfully logged out from {count} active device session(s).",
        data={"revoked_sessions": count},
    )


@router.post(
    "/otp/send",
    response_model=APIResponse[Dict[str, Any]],
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def send_otp(
    payload: SendOtpRequest,
    db: AsyncSession = Depends(get_db),
):
    """Dispatch a 6-digit OTP verification code."""
    otp_service = OTPService(db)
    success, error, dev_code = await otp_service.generate_otp(
        target=payload.target.strip(),
        purpose=payload.purpose,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "success": False,
                "message": error or "Could not dispatch OTP.",
                "error": {"code": "OTP_DISPATCH_LIMIT"},
            },
        )

    await db.commit()

    response_data: Dict[str, Any] = {"dispatched": True}
    if dev_code and settings.ENVIRONMENT == "development":
        response_data["dev_otp"] = dev_code

    return APIResponse(
        success=True,
        message="Verification OTP dispatched successfully.",
        data=response_data,
    )


@router.post(
    "/otp/verify",
    response_model=APIResponse[Dict[str, bool]],
    dependencies=[Depends(RateLimiter(times=10, seconds=60))],
)
async def verify_otp(
    payload: VerifyOtpRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify a received OTP code."""
    otp_service = OTPService(db)
    is_valid, message = await otp_service.verify_otp(
        target=payload.target.strip(),
        otp_code=payload.otp_code.strip(),
        purpose=payload.purpose,
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": message,
                "error": {"code": "INVALID_OTP"},
            },
        )

    # If verifying phone or email, update user verification flag
    auth_service = AuthService(db)
    if payload.purpose == "phone_verification":
        user = await auth_service.user_repo.get_by_phone(payload.target.strip())
        if user:
            user.is_phone_verified = True
    elif payload.purpose == "email_verification":
        user = await auth_service.user_repo.get_by_email(payload.target.strip().lower())
        if user:
            user.is_email_verified = True

    await db.commit()

    return APIResponse(
        success=True,
        message=message,
        data={"verified": True},
    )


@router.post(
    "/firebase/verify-otp",
    response_model=APIResponse[FirebasePhoneAuthResponse],
    dependencies=[Depends(RateLimiter(times=10, seconds=60))],
)
async def verify_firebase_phone_otp(
    payload: FirebaseVerifyOtpRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify Firebase Phone Auth OTP ID Token.
    Provides secure phone-verified authentication, signup/login, and password reset
    without requiring third-party SMS providers.
    """
    firebase_service = FirebaseService()
    success, decoded_token, err = await firebase_service.verify_phone_id_token(payload.firebase_id_token)

    if not success or not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": err or "Invalid Firebase OTP verification token.",
                "error": {"code": "FIREBASE_TOKEN_INVALID"},
            },
        )

    verified_phone = decoded_token.get("phone_number")
    if not verified_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": "Token does not contain a verified mobile number.",
                "error": {"code": "PHONE_NUMBER_NOT_VERIFIED"},
            },
        )

    auth_service = AuthService(db)
    from app.services.auth_service import normalize_phone
    from app.core.permissions import RoleEnum, get_permissions_for_roles

    try:
        norm_phone = normalize_phone(verified_phone)
    except ValueError:
        norm_phone = verified_phone.strip()

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    # 1. Login or Auto-Register Flow
    if payload.purpose == "login":
        user = await auth_service.user_repo.get_by_phone(norm_phone)
        if not user:
            # Auto-provision new customer account verified via Firebase OTP
            dummy_pass = f"Pass_{uuid.uuid4().hex[:12]}!"
            hashed_pass = auth_service.password_service.hash_password(dummy_pass)
            user = await auth_service.user_repo.create_user(
                phone=norm_phone,
                email=None,
                hashed_password=hashed_pass,
                full_name="Pharmacy Customer",
                is_phone_verified=True,
                is_email_verified=False,
            )
            customer_role = await auth_service.role_repo.get_by_slug(RoleEnum.CUSTOMER.value)
            if customer_role:
                await auth_service.user_repo.assign_role(user.id, customer_role.id)
        else:
            user.is_phone_verified = True

        role_slugs = await auth_service.user_repo.get_user_role_slugs(user)
        permissions = list(get_permissions_for_roles(role_slugs))

        token_data = await auth_service.token_service.issue_token_pair(
            user_id=user.id,
            roles=role_slugs,
            permissions=permissions,
            ip_address=client_ip,
            user_agent=user_agent,
            device_info="Firebase Phone Auth",
        )
        _set_auth_cookies(response, token_data["access_token"], token_data["refresh_token"])

        user_resp = UserResponse(
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

        tokens_resp = TokenData(
            access_token=token_data["access_token"],
            refresh_token=token_data["refresh_token"],
            token_type=token_data["token_type"],
            expires_in=token_data["expires_in"],
            user=user_resp,
        )

        await db.commit()
        return APIResponse(
            success=True,
            message="Authenticated successfully via Firebase Phone OTP.",
            data=FirebasePhoneAuthResponse(
                verified=True,
                phone=norm_phone,
                tokens=tokens_resp,
                user=user_resp,
                message="Login successful",
            ),
        )

    # 2. Phone Verification Flow
    elif payload.purpose == "phone_verification":
        user = await auth_service.user_repo.get_by_phone(norm_phone)
        if user:
            user.is_phone_verified = True
            await db.commit()

        return APIResponse(
            success=True,
            message="Phone number successfully verified via Firebase.",
            data=FirebasePhoneAuthResponse(
                verified=True,
                phone=norm_phone,
                message="Mobile number verified.",
            ),
        )

    # 3. Password Reset Flow
    elif payload.purpose == "password_reset":
        if not payload.new_password or not payload.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "New password and confirmation are required."},
            )
        if payload.new_password != payload.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Passwords do not match."},
            )
        is_strong, reason = auth_service.password_service.validate_strength(payload.new_password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": reason},
            )

        user = await auth_service.user_repo.get_by_phone(norm_phone)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Account with this mobile number does not exist."},
            )

        user.hashed_password = auth_service.password_service.hash_password(payload.new_password)
        await auth_service.session_repo.revoke_all_for_user(user.id)
        await db.commit()

        return APIResponse(
            success=True,
            message="Password reset successfully via Firebase verified credentials.",
            data=FirebasePhoneAuthResponse(
                verified=True,
                phone=norm_phone,
                message="Password reset completed. Please log in.",
            ),
        )



@router.post(
    "/forgot-password",
    response_model=APIResponse[Dict[str, Any]],
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Initiate password reset by dispatching a verification OTP."""
    otp_service = OTPService(db)
    success, error, dev_code = await otp_service.generate_otp(
        target=payload.identifier.strip(),
        purpose="password_reset",
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "success": False,
                "message": error or "Could not dispatch password reset OTP.",
                "error": {"code": "OTP_DISPATCH_LIMIT"},
            },
        )

    await db.commit()

    data: Dict[str, Any] = {"dispatched": True}
    if dev_code and settings.ENVIRONMENT == "development":
        data["dev_otp"] = dev_code

    return APIResponse(
        success=True,
        message="If an account matches that identifier, a verification code has been dispatched.",
        data=data,
    )


@router.post(
    "/reset-password",
    response_model=APIResponse[Dict[str, bool]],
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Complete password reset using verified OTP code."""
    auth_service = AuthService(db)
    success, msg = await auth_service.reset_password_with_otp(
        identifier=payload.identifier,
        otp_code=payload.otp_code,
        new_password=payload.new_password,
        confirm_password=payload.confirm_password,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": msg,
                "error": {"code": "RESET_PASSWORD_FAILED"},
            },
        )

    return APIResponse(
        success=True,
        message=msg,
        data={"reset": True},
    )


@router.post(
    "/change-password",
    response_model=APIResponse[Dict[str, bool]],
)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Update password for authenticated user."""
    auth_service = AuthService(db)
    success, msg = await auth_service.change_password(
        user_id=current_user.id,
        current_password=payload.current_password,
        new_password=payload.new_password,
        confirm_password=payload.confirm_password,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": msg,
                "error": {"code": "CHANGE_PASSWORD_FAILED"},
            },
        )

    return APIResponse(
        success=True,
        message=msg,
        data={"updated": True},
    )

