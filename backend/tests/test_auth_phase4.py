import random
import uuid
from datetime import timedelta
import pytest
from httpx import AsyncClient

from app.core.config import settings
from sqlalchemy import select
from tests.conftest import TestAsyncSessionLocal
from app.models.user import User
from app.core.permissions import PermissionEnum, RoleEnum
from app.core.security import create_access_token, decode_token, get_password_hash, verify_password


def generate_valid_indian_mobile() -> str:
    """Generate a random valid 10-digit Indian mobile number."""
    return f"+919{random.randint(100000000, 999999999)}"


@pytest.mark.asyncio
async def test_argon2id_password_hashing():
    """Verify password hashing meets Argon2id requirements."""
    password = "SuperSecurePassword@2026"
    hashed = get_password_hash(password)

    # Must start with argon2id algorithm identifier
    assert hashed.startswith("$argon2id$")
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False
    assert verify_password("", hashed) is False


@pytest.mark.asyncio
async def test_jwt_access_token_generation_and_expiry():
    """Verify JWT access token encoding, decoding, and expiration rejection."""
    user_id = str(uuid.uuid4())
    roles = [RoleEnum.CUSTOMER.value]
    permissions = [PermissionEnum.PROFILE_READ.value]

    # Valid token
    token = create_access_token(user_id, roles, permissions)
    payload = decode_token(token)
    assert payload["sub"] == user_id
    assert payload["type"] == "access"
    assert RoleEnum.CUSTOMER.value in payload["roles"]

    # Expired token
    expired_token = create_access_token(
        user_id,
        roles,
        permissions,
        expires_delta=timedelta(seconds=-10),
    )
    with pytest.raises(Exception):
        decode_token(expired_token)


@pytest.mark.asyncio
async def test_customer_registration_and_duplicate_rejection(client: AsyncClient):
    """Test customer registration and rejection of duplicate phone."""
    unique_phone = generate_valid_indian_mobile()
    unique_email = f"user_{random.randint(100000, 999999)}@example.com"

    # 1. Successful registration
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test Customer",
            "phone": unique_phone,
            "password": "ValidPassword@123",
            "confirm_password": "ValidPassword@123",
            "email": unique_email,
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["phone"] == unique_phone
    assert body["data"]["is_phone_verified"] is False
    assert "customer" in body["data"]["roles"]

    # 2. Reject duplicate phone
    dup_response = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Duplicate User",
            "phone": unique_phone,
            "password": "ValidPassword@123",
            "confirm_password": "ValidPassword@123",
            "email": f"other_{random.randint(100000, 999999)}@example.com",
        },
    )
    assert dup_response.status_code == 400
    assert "already exists" in dup_response.json()["message"]


@pytest.mark.asyncio
async def test_weak_password_registration_rejection(client: AsyncClient):
    """Verify weak password policies are enforced during registration."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Weak Pass User",
            "phone": generate_valid_indian_mobile(),
            "password": "weak",
            "confirm_password": "weak",
        },
    )
    assert response.status_code in [400, 422]


@pytest.mark.asyncio
async def test_customer_login_success_and_invalid_rejection(client: AsyncClient):
    """Test login with phone/email and password, and rejection on invalid credentials."""
    # Seeded dev customer: +919876543210 / Password@123
    # 1. Success login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={
            "identifier": "+919876543210",
            "password": "Password@123",
        },
    )
    assert login_res.status_code == 200
    login_body = login_res.json()
    assert login_body["success"] is True
    assert "access_token" in login_body["data"]
    assert "refresh_token" in login_body["data"]
    assert login_body["data"]["user"]["phone"] == "+919876543210"

    # Check cookies were set
    assert settings.AUTH_COOKIE_NAME in login_res.cookies

    # 2. Invalid password rejection
    bad_login = await client.post(
        "/api/v1/auth/login",
        json={
            "identifier": "+919876543210",
            "password": "IncorrectPassword@999",
        },
    )
    assert bad_login.status_code == 401
    assert bad_login.json()["success"] is False


@pytest.mark.asyncio
async def test_me_endpoint_requires_auth(client: AsyncClient):
    """Verify /auth/me requires valid Bearer token."""
    # 1. No auth -> 401 (clear cookies in client headers if any)
    no_auth_res = await client.get("/api/v1/auth/me", headers={"Cookie": ""})
    assert no_auth_res.status_code == 401

    # 2. Login to get token
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"identifier": "+919876543210", "password": "Password@123"},
    )
    access_token = login_res.json()["data"]["access_token"]

    # 3. Request with Bearer header
    me_res = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_res.status_code == 200
    assert me_res.json()["data"]["phone"] == "+919876543210"


@pytest.mark.asyncio
async def test_refresh_token_rotation_and_reuse_detection(client: AsyncClient):
    """Verify refresh token rotation and immediate reuse detection."""
    # 1. Login to obtain refresh token
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"identifier": "+919876543210", "password": "Password@123"},
    )
    tokens = login_res.json()["data"]
    orig_refresh = tokens["refresh_token"]

    # 2. Rotate refresh token -> success
    refresh_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": orig_refresh},
    )
    assert refresh_res.status_code == 200
    new_tokens = refresh_res.json()["data"]
    new_refresh = new_tokens["refresh_token"]
    assert new_refresh != orig_refresh

    # 3. Replay / Reuse attack: Present the old orig_refresh token again!
    reuse_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": orig_refresh},
    )
    assert reuse_res.status_code == 401
    assert "reuse detected" in reuse_res.json()["message"].lower()

    # 4. Because reuse was detected, the entire session family must be revoked!
    post_breach_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": new_refresh},
    )
    assert post_breach_res.status_code == 401


@pytest.mark.asyncio
async def test_otp_generation_verification_and_expiry(client: AsyncClient):
    """Test OTP flow: dispatch, dev code retrieval, attempt tracking, and verification."""
    target_phone = generate_valid_indian_mobile()

    # 1. Send OTP
    send_res = await client.post(
        "/api/v1/auth/otp/send",
        json={"target": target_phone, "purpose": "phone_verification"},
    )
    assert send_res.status_code == 200
    body = send_res.json()
    assert body["success"] is True
    otp_code = body["data"]["dev_otp"]
    assert len(otp_code) == 6

    # 2. Test invalid OTP code
    bad_verify = await client.post(
        "/api/v1/auth/otp/verify",
        json={"target": target_phone, "otp_code": "000000", "purpose": "phone_verification"},
    )
    assert bad_verify.status_code == 400
    assert "attempt" in bad_verify.json()["message"].lower()

    # 3. Test valid OTP code
    good_verify = await client.post(
        "/api/v1/auth/otp/verify",
        json={"target": target_phone, "otp_code": otp_code, "purpose": "phone_verification"},
    )
    assert good_verify.status_code == 200
    assert good_verify.json()["data"]["verified"] is True

    # 4. OTP should now be marked as used and cannot be reused
    reuse_otp = await client.post(
        "/api/v1/auth/otp/verify",
        json={"target": target_phone, "otp_code": otp_code, "purpose": "phone_verification"},
    )
    assert reuse_otp.status_code == 400


@pytest.mark.asyncio
async def test_password_reset_flow(client: AsyncClient):
    """Test forgot password and reset password using OTP."""
    target_phone = "+919876543210"

    # 1. Forgot password request
    forgot_res = await client.post(
        "/api/v1/auth/forgot-password",
        json={"identifier": target_phone},
    )
    assert forgot_res.status_code == 200
    otp_code = forgot_res.json()["data"]["dev_otp"]

    # 2. Reset password with OTP
    new_pass = "NewResetPassword@2026"
    reset_res = await client.post(
        "/api/v1/auth/reset-password",
        json={
            "identifier": target_phone,
            "otp_code": otp_code,
            "new_password": new_pass,
            "confirm_password": new_pass,
        },
    )
    assert reset_res.status_code == 200

    try:
        # 3. Verify new password allows login
        login_new = await client.post(
            "/api/v1/auth/login",
            json={"identifier": target_phone, "password": new_pass},
        )
        assert login_new.status_code == 200
    finally:
        # Reset back to standard for subsequent tests
        async with TestAsyncSessionLocal() as session:
            stmt = select(User).where(User.phone == target_phone)
            res = await session.execute(stmt)
            u = res.scalar_one_or_none()
            if u:
                u.hashed_password = get_password_hash("Password@123")
                await session.commit()


@pytest.mark.asyncio
async def test_admin_authentication_and_route_protection(client: AsyncClient):
    """Verify admin login rejects customer, allows admin, and protects admin routes."""
    # 1. Customer trying admin login -> 403 Forbidden
    cust_res = await client.post(
        "/api/v1/admin/auth/login",
        json={"identifier": "+919876543210", "password": "Password@123"},
    )
    assert cust_res.status_code == 403
    assert cust_res.json()["error"]["code"] == "INSUFFICIENT_ADMIN_PRIVILEGES"

    # 2. Admin user login -> 200 OK
    admin_res = await client.post(
        "/api/v1/admin/auth/login",
        json={"identifier": "+919800000002", "password": "Password@123"},
    )
    assert admin_res.status_code == 200
    admin_token = admin_res.json()["data"]["access_token"]

    # 3. Access admin me endpoint
    admin_me = await client.get(
        "/api/v1/admin/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_me.status_code == 200
    assert "admin" in admin_me.json()["data"]["roles"]


@pytest.mark.asyncio
async def test_pharmacist_statutory_verification_gating(client: AsyncClient):
    """
    Verify pharmacist authentication and Rule 65 gating:
    Unverified pharmacist is BLOCKED from /pharmacist/auth/workspace with 403.
    Verified pharmacist is GRANTED access.
    """
    # 1. Unverified Pharmacist login (+919800000004)
    unverif_res = await client.post(
        "/api/v1/pharmacist/auth/login",
        json={"identifier": "+919800000004", "password": "Password@123"},
    )
    assert unverif_res.status_code == 200
    unverif_token = unverif_res.json()["data"]["access_token"]

    # Check status endpoint
    status_res = await client.get(
        "/api/v1/pharmacist/auth/status",
        headers={"Authorization": f"Bearer {unverif_token}"},
    )
    assert status_res.status_code == 200
    assert status_res.json()["data"]["is_verified"] is False
    assert status_res.json()["data"]["can_dispense"] is False

    # Try restricted workspace -> Must be 403 FORBIDDEN!
    workspace_blocked = await client.get(
        "/api/v1/pharmacist/auth/workspace",
        headers={"Authorization": f"Bearer {unverif_token}"},
    )
    assert workspace_blocked.status_code == 403
    assert workspace_blocked.json()["error"]["code"] == "PHARMACIST_NOT_VERIFIED"

    # 2. Verified Pharmacist login (+919800000003)
    verif_res = await client.post(
        "/api/v1/pharmacist/auth/login",
        json={"identifier": "+919800000003", "password": "Password@123"},
    )
    assert verif_res.status_code == 200
    verif_token = verif_res.json()["data"]["access_token"]

    # Try restricted workspace -> 200 OK!
    workspace_allowed = await client.get(
        "/api/v1/pharmacist/auth/workspace",
        headers={"Authorization": f"Bearer {verif_token}"},
    )
    assert workspace_allowed.status_code == 200
    assert workspace_allowed.json()["data"]["verification_status"] == "VERIFIED_STATUTORY"


@pytest.mark.asyncio
async def test_delivery_partner_authentication(client: AsyncClient):
    """Verify delivery partner authentication and profile retrieval."""
    login_res = await client.post(
        "/api/v1/delivery/auth/login",
        json={"identifier": "+919800000006", "password": "Password@123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]

    me_res = await client.get(
        "/api/v1/delivery/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    assert "delivery_partner" in me_res.json()["data"]["roles"]


@pytest.mark.asyncio
async def test_security_headers_present(client: AsyncClient):
    """Verify security headers are applied to HTTP responses."""
    res = await client.get("/api/v1/health")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert "Strict-Transport-Security" in res.headers
