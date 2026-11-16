import re
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


INDIAN_PINCODE_REGEX = re.compile(r"^[1-9][0-9]{5}$")
INDIAN_PHONE_REGEX = re.compile(r"^(\+91[\-\s]?)?[6-9]\d{9}$")


class AddressBase(BaseModel):
    recipient_name: str = Field(..., min_length=2, max_length=100, description="Full name of recipient")
    phone: str = Field(..., description="Indian 10-digit mobile number")
    address_line1: str = Field(..., min_length=3, max_length=255, description="House/Flat/Block, Building/Apartment")
    address_line2: Optional[str] = Field(None, max_length=255, description="Street name, locality or area")
    landmark: Optional[str] = Field(None, max_length=150, description="Prominent landmark nearby")
    city: str = Field(..., min_length=2, max_length=100, description="City / District")
    state: str = Field(..., min_length=2, max_length=100, description="Indian State / UT")
    pincode: str = Field(..., description="6-digit Indian PIN code")
    address_type: str = Field("home", max_length=20, description="Type: home, work, other")
    is_default: bool = Field(False, description="Set as primary default delivery address")

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: str) -> str:
        clean = v.strip()
        if not INDIAN_PINCODE_REGEX.match(clean):
            raise ValueError("Invalid Indian PIN code format. Must be a valid 6-digit postal code (e.g. 560001).")
        return clean

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean = v.strip().replace(" ", "").replace("-", "")
        if not INDIAN_PHONE_REGEX.match(clean):
            raise ValueError("Invalid Indian mobile number. Must be a 10-digit number starting with 6-9.")
        return clean

    @field_validator("address_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in {"home", "work", "other"}:
            raise ValueError("Address type must be 'home', 'work', or 'other'.")
        return clean


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    recipient_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    address_line1: Optional[str] = Field(None, min_length=3, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    landmark: Optional[str] = Field(None, max_length=150)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    pincode: Optional[str] = None
    address_type: Optional[str] = None
    is_default: Optional[bool] = None

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip()
            if not INDIAN_PINCODE_REGEX.match(clean):
                raise ValueError("Invalid Indian PIN code format. Must be a valid 6-digit postal code.")
            return clean
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip().replace(" ", "").replace("-", "")
            if not INDIAN_PHONE_REGEX.match(clean):
                raise ValueError("Invalid Indian mobile number. Must be a 10-digit number starting with 6-9.")
            return clean
        return v

    @field_validator("address_type")
    @classmethod
    def validate_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip().lower()
            if clean not in {"home", "work", "other"}:
                raise ValueError("Address type must be 'home', 'work', or 'other'.")
            return clean
        return v


class AddressResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    recipient_name: str
    recipient_phone: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    landmark: Optional[str] = None
    city: str
    state: str
    pincode: str
    country: str = "India"
    address_type: str
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
