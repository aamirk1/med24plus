import json
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.dependencies import require_permission
from app.core.permissions import PermissionEnum
from app.models.user import User
from app.schemas.common import APIResponse

router = APIRouter()
admin_router = APIRouter()

# Persistent Store Settings File Path
SETTINGS_FILE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "static")
SETTINGS_FILE = os.path.join(SETTINGS_FILE_DIR, "store_settings.json")

class StoreSettingsSchema(BaseModel):
    business_legal_name: str = Field("Med24Plus Retail Healthcare Pvt Ltd", description="Official legal entity name")
    trade_name: str = Field("Med24Plus Central Pharmacy", description="Retail trade / store name")
    drug_license_form_20: str = Field("DL-MH-MUM-2026-PHAR-008472", description="Form 20 Retail Drug License")
    drug_license_form_21: str = Field("DL-MH-MUM-2026-PHAR-008473", description="Form 21 Retail Drug License")
    gstin: str = Field("27AABCM9482Q1Z8", description="GST Identification Number")
    fssai_license: str = Field("11224334000192", description="FSSAI Dietary License")
    supervising_pharmacist: str = Field("Ramesh Sharma, B.Pharm", description="Supervising Pharmacist on duty")
    supervising_pharmacist_reg_no: str = Field("PCI-REG-94821/2020", description="PCI Registration Number")
    registered_address: str = Field("Plot 15, Bandra Kurla Complex (BKC), Bandra East, Mumbai, Maharashtra - 400051", description="Physical pharmacy address")
    store_phone: str = Field("+91 22 8069 0161", description="Store phone number")
    support_email: str = Field("care@med24plus.in", description="Store contact email")
    operating_hours: str = Field("24 Hours / 7 Days (Continuous Critical Care)", description="Operating hours")
    emergency_helpline: str = Field("+91 22 2345 6789", description="Emergency pharmacist line")
    serviceable_pincodes: List[str] = Field(default_factory=lambda: ["400001", "400050", "400051", "400058", "400076", "400092", "400104"])

def _load_settings() -> StoreSettingsSchema:
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r") as f:
                data = json.load(f)
                return StoreSettingsSchema(**data)
        except Exception:
            pass
    return StoreSettingsSchema()

def _save_settings(settings: StoreSettingsSchema) -> None:
    try:
        os.makedirs(SETTINGS_FILE_DIR, exist_ok=True)
        with open(SETTINGS_FILE, "w") as f:
            json.dump(settings.model_dump(), f, indent=2)
    except Exception as e:
        print(f"Error saving store settings: {e}")

# In-memory cached settings
_cached_settings = _load_settings()


@router.get("/store", response_model=APIResponse[StoreSettingsSchema])
async def get_public_store_settings():
    """Retrieve public statutory pharmacy store details, drug licenses, and contact info."""
    global _cached_settings
    _cached_settings = _load_settings()
    return APIResponse(
        success=True,
        message="Store settings retrieved successfully.",
        data=_cached_settings,
    )


@admin_router.get("/store", response_model=APIResponse[StoreSettingsSchema])
async def get_admin_store_settings(
    current_user: User = Depends(require_permission(PermissionEnum.SETTINGS_MANAGE.value)),
):
    """Retrieve complete pharmacy store settings for administrative management."""
    global _cached_settings
    _cached_settings = _load_settings()
    return APIResponse(
        success=True,
        message="Store administrative settings retrieved successfully.",
        data=_cached_settings,
    )


@admin_router.put("/store", response_model=APIResponse[StoreSettingsSchema])
async def update_admin_store_settings(
    data: StoreSettingsSchema,
    current_user: User = Depends(require_permission(PermissionEnum.SETTINGS_MANAGE.value)),
):
    """Update pharmacy legal entities, Form 20B/21B drug licenses, phone, and address."""
    global _cached_settings
    _cached_settings = data
    _save_settings(data)
    return APIResponse(
        success=True,
        message="Store details and statutory drug licensing updated successfully.",
        data=_cached_settings,
    )
