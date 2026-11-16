import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field


class UserProfileSchema(BaseModel):
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class PharmacistProfileSchema(BaseModel):
    registration_number: str
    state_pharmacy_council: str
    registration_valid_upto: date
    is_verified: bool
    verified_at: Optional[datetime] = None
    drug_license_number: Optional[str] = None

    class Config:
        from_attributes = True


class StaffProfileSchema(BaseModel):
    employee_id: str
    department: str
    designation: str
    employment_status: str

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: Optional[str] = None
    phone: str
    email: Optional[str] = None
    is_active: bool
    is_phone_verified: bool
    is_email_verified: bool
    status: str
    roles: List[str] = []
    permissions: List[str] = []
    profile: Optional[UserProfileSchema] = None
    pharmacist_profile: Optional[PharmacistProfileSchema] = None
    staff_profile: Optional[StaffProfileSchema] = None

    class Config:
        from_attributes = True


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, description="Customer full legal name")
    phone: str = Field(..., description="Indian 10-digit mobile number (+91 optional)")
    password: str = Field(..., min_length=8, description="Strong account password")
    confirm_password: str = Field(..., min_length=8, description="Password confirmation")
    email: Optional[EmailStr] = Field(None, description="Optional customer email address")


class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Registered 10-digit mobile number or email address")
    password: str = Field(..., min_length=1, description="Account password")


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="Valid JWT refresh token")


class TokenData(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 900
    user: UserResponse


class SendOtpRequest(BaseModel):
    target: str = Field(..., description="Target mobile number (+91XXXXXXXXXX) or email")
    purpose: str = Field(
        ...,
        pattern="^(phone_verification|email_verification|password_reset|login)$",
        description="Verification purpose",
    )


class VerifyOtpRequest(BaseModel):
    target: str = Field(..., description="Target mobile number (+91XXXXXXXXXX) or email")
    otp_code: str = Field(..., min_length=4, max_length=8, description="Numeric OTP code")
    purpose: str = Field(
        ...,
        pattern="^(phone_verification|email_verification|password_reset|login)$",
        description="Verification purpose",
    )


class ForgotPasswordRequest(BaseModel):
    identifier: str = Field(..., description="Registered mobile number or email address")


class ResetPasswordRequest(BaseModel):
    identifier: str = Field(..., description="Registered mobile number or email address")
    otp_code: str = Field(..., min_length=4, max_length=8, description="OTP code received")
    new_password: str = Field(..., min_length=8, description="New strong password")
    confirm_password: str = Field(..., min_length=8, description="Confirm new password")


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Existing account password")
    new_password: str = Field(..., min_length=8, description="New strong password")
    confirm_password: str = Field(..., min_length=8, description="Confirm new password")

