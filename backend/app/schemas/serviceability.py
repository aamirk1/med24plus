import re
import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


INDIAN_PINCODE_REGEX = re.compile(r"^[1-9][0-9]{5}$")


class ServiceablePincodeCreate(BaseModel):
    pincode: str = Field(..., description="6-digit Indian PIN code")
    area_name: Optional[str] = Field(None, max_length=100, description="Area / Locality name")
    city: str = Field("Mumbai", max_length=100)
    state: str = Field("Maharashtra", max_length=100)
    is_active: bool = Field(True, description="Whether this PIN code is currently serviceable")
    estimated_delivery_hours: int = Field(4, ge=1, le=72, description="Estimated turnaround hours")
    min_order_value: Decimal = Field(Decimal("0.00"), ge=0, description="Minimum order value for this area")

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: str) -> str:
        clean = v.strip()
        if not INDIAN_PINCODE_REGEX.match(clean):
            raise ValueError("Invalid Indian PIN code format. Must be 6 digits (e.g. 400001).")
        return clean


class ServiceablePincodeUpdate(BaseModel):
    area_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_active: Optional[bool] = None
    estimated_delivery_hours: Optional[int] = Field(None, ge=1, le=72)
    min_order_value: Optional[Decimal] = Field(None, ge=0)


class ServiceablePincodeResponse(BaseModel):
    id: uuid.UUID
    pincode: str
    area_name: Optional[str] = None
    city: str
    state: str
    is_active: bool
    estimated_delivery_hours: int
    min_order_value: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ServiceabilityCheckRequest(BaseModel):
    pincode: str = Field(..., description="6-digit Indian PIN code to test")

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: str) -> str:
        clean = v.strip()
        if not INDIAN_PINCODE_REGEX.match(clean):
            raise ValueError("Invalid Indian PIN code format.")
        return clean


class ServiceabilityCheckResponse(BaseModel):
    pincode: str
    is_serviceable: bool
    city: Optional[str] = None
    state: Optional[str] = None
    area_name: Optional[str] = None
    estimated_delivery_hours: Optional[int] = None
    message: str


class CheckoutSettingsResponse(BaseModel):
    id: uuid.UUID
    standard_delivery_fee: Decimal
    free_delivery_threshold: Decimal
    express_cold_chain_fee: Decimal
    minimum_cart_value: Decimal
    max_quantity_per_product: int
    is_serviceability_enforced: bool
    updated_at: datetime
    serviceable_pincodes_count: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class CheckoutSettingsUpdate(BaseModel):
    standard_delivery_fee: Optional[Decimal] = Field(None, ge=0)
    free_delivery_threshold: Optional[Decimal] = Field(None, ge=0)
    express_cold_chain_fee: Optional[Decimal] = Field(None, ge=0)
    minimum_cart_value: Optional[Decimal] = Field(None, ge=0)
    max_quantity_per_product: Optional[int] = Field(None, ge=1, le=100)
    is_serviceability_enforced: Optional[bool] = None
