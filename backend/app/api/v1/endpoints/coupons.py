import json
import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.schemas.common import APIResponse

router = APIRouter()
admin_router = APIRouter()

COUPONS_FILE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "static")
COUPONS_FILE = os.path.join(COUPONS_FILE_DIR, "coupons.json")


class CouponSchema(BaseModel):
    id: str = Field(default_factory=lambda: f"cp-{uuid.uuid4().hex[:8]}")
    code: str = Field(..., min_length=2, max_length=50, description="Uppercase coupon code e.g. MED24NEW")
    discountType: str = Field("PERCENT", description="PERCENT or FLAT")
    discount_type: Optional[str] = None
    value: float = Field(..., ge=0, description="Percentage (e.g. 20) or flat discount in INR (e.g. 100)")
    minOrderValue: float = Field(0.0, ge=0, description="Minimum cart order value in INR")
    min_order_value: Optional[float] = None
    maxDiscountAmount: Optional[float] = Field(None, description="Max cap for percentage discounts in INR")
    max_discount_amount: Optional[float] = None
    validUntil: str = Field("31 Dec 2026", description="Validity date or label")
    valid_until: Optional[str] = None
    usageCount: int = Field(0, description="Number of times redeemed")
    usage_count: Optional[int] = None
    status: str = Field("ACTIVE", description="ACTIVE or EXPIRED")
    description: Optional[str] = Field(None, description="Human friendly promo description")
    is_active: bool = Field(True)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    def model_post_init(self, __context: Any) -> None:
        self.code = self.code.strip().toUpperCase() if hasattr(self.code, "toUpperCase") else self.code.strip().upper()
        norm_type = (self.discount_type or self.discountType or "PERCENT").upper()
        self.discountType = norm_type
        self.discount_type = norm_type

        min_val = self.min_order_value if self.min_order_value is not None else self.minOrderValue
        self.minOrderValue = min_val
        self.min_order_value = min_val

        max_cap = self.max_discount_amount if self.max_discount_amount is not None else self.maxDiscountAmount
        self.maxDiscountAmount = max_cap
        self.max_discount_amount = max_cap

        val_until = self.valid_until or self.validUntil or "31 Dec 2026"
        self.validUntil = val_until
        self.valid_until = val_until

        u_count = self.usage_count if self.usage_count is not None else self.usageCount
        self.usageCount = u_count
        self.usage_count = u_count

        self.is_active = self.status.upper() == "ACTIVE"


class CouponCreate(BaseModel):
    code: str
    discountType: Optional[str] = None
    discount_type: Optional[str] = None
    value: float
    minOrderValue: Optional[float] = None
    min_order_value: Optional[float] = None
    maxDiscountAmount: Optional[float] = None
    max_discount_amount: Optional[float] = None
    validUntil: Optional[str] = None
    valid_until: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "ACTIVE"


class CouponValidateRequest(BaseModel):
    code: str
    cart_total: float = Field(..., ge=0)


class CouponValidateResult(BaseModel):
    is_valid: bool
    code: str
    discount_type: str
    discountType: str
    value: float
    discount_amount: float
    min_order_value: float
    description: str
    message: str


DEFAULT_COUPONS = [
    {
        "id": "cp-med24new",
        "code": "MED24NEW",
        "discountType": "PERCENT",
        "discount_type": "PERCENT",
        "value": 20.0,
        "minOrderValue": 199.0,
        "min_order_value": 199.0,
        "maxDiscountAmount": 150.0,
        "max_discount_amount": 150.0,
        "validUntil": "31 Dec 2026",
        "valid_until": "31 Dec 2026",
        "usageCount": 142,
        "usage_count": 142,
        "status": "ACTIVE",
        "description": "20% OFF (up to ₹150) on orders above ₹199",
        "is_active": True,
        "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": "cp-health50",
        "code": "HEALTH50",
        "discountType": "FLAT",
        "discount_type": "FLAT",
        "value": 50.0,
        "minOrderValue": 250.0,
        "min_order_value": 250.0,
        "maxDiscountAmount": 50.0,
        "max_discount_amount": 50.0,
        "validUntil": "31 Dec 2026",
        "valid_until": "31 Dec 2026",
        "usageCount": 89,
        "usage_count": 89,
        "status": "ACTIVE",
        "description": "Flat ₹50 savings on wellness and medicines",
        "is_active": True,
        "created_at": "2026-01-05T00:00:00",
    },
    {
        "id": "cp-save10",
        "code": "SAVE10",
        "discountType": "PERCENT",
        "discount_type": "PERCENT",
        "value": 10.0,
        "minOrderValue": 299.0,
        "min_order_value": 299.0,
        "maxDiscountAmount": 100.0,
        "max_discount_amount": 100.0,
        "validUntil": "31 Dec 2026",
        "valid_until": "31 Dec 2026",
        "usageCount": 312,
        "usage_count": 312,
        "status": "ACTIVE",
        "description": "10% OFF (up to ₹100) on orders above ₹299",
        "is_active": True,
        "created_at": "2026-01-10T00:00:00",
    },
    {
        "id": "cp-flat100",
        "code": "FLAT100",
        "discountType": "FLAT",
        "discount_type": "FLAT",
        "value": 100.0,
        "minOrderValue": 499.0,
        "min_order_value": 499.0,
        "maxDiscountAmount": 100.0,
        "max_discount_amount": 100.0,
        "validUntil": "31 Dec 2026",
        "valid_until": "31 Dec 2026",
        "usageCount": 210,
        "usage_count": 210,
        "status": "ACTIVE",
        "description": "Flat ₹100 instant discount on orders above ₹499",
        "is_active": True,
        "created_at": "2026-01-15T00:00:00",
    },
    {
        "id": "cp-freeship",
        "code": "FREESHIP",
        "discountType": "FLAT",
        "discount_type": "FLAT",
        "value": 40.0,
        "minOrderValue": 150.0,
        "min_order_value": 150.0,
        "maxDiscountAmount": 40.0,
        "max_discount_amount": 40.0,
        "validUntil": "31 Dec 2026",
        "valid_until": "31 Dec 2026",
        "usageCount": 420,
        "usage_count": 420,
        "status": "ACTIVE",
        "description": "Free standard home delivery voucher",
        "is_active": True,
        "created_at": "2026-01-20T00:00:00",
    },
]


def _load_coupons() -> List[CouponSchema]:
    if os.path.exists(COUPONS_FILE):
        try:
            with open(COUPONS_FILE, "r") as f:
                raw = json.load(f)
                return [CouponSchema(**item) for item in raw]
        except Exception:
            pass
    return [CouponSchema(**item) for item in DEFAULT_COUPONS]


def _save_coupons(coupons: List[CouponSchema]) -> None:
    try:
        os.makedirs(COUPONS_FILE_DIR, exist_ok=True)
        with open(COUPONS_FILE, "w") as f:
            json.dump([c.model_dump() for c in coupons], f, indent=2)
    except Exception as e:
        print(f"Error saving coupons: {e}")


# ==============================================================================
# Public / Customer App Endpoints
# ==============================================================================

@router.get("", response_model=APIResponse[List[CouponSchema]])
async def list_active_coupons():
    """List active promotional marketing coupons for customer mobile & web apps."""
    coupons = _load_coupons()
    active_coupons = [c for c in coupons if c.is_active and c.status == "ACTIVE"]
    return APIResponse(
        success=True,
        message="Active marketing coupons retrieved successfully.",
        data=active_coupons,
    )


@router.post("/validate", response_model=APIResponse[CouponValidateResult])
async def validate_coupon(payload: CouponValidateRequest):
    """
    Validate promotional coupon code against live cart value based on admin settings.
    Calculates dynamic discount amount (percentage or flat) and ensures business rules.
    """
    code_norm = payload.code.strip().upper()
    coupons = _load_coupons()

    matching = next((c for c in coupons if c.code.upper() == code_norm), None)

    if not matching:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Coupon code "{payload.code}" is invalid or does not exist.',
        )

    if not matching.is_active or matching.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Coupon code "{matching.code}" has expired.',
        )

    min_order = matching.minOrderValue or matching.min_order_value or 0.0
    if payload.cart_total < min_order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Coupon "{matching.code}" requires a minimum order of ₹{min_order:.0f}.',
        )

    disc_type = (matching.discountType or matching.discount_type or "PERCENT").upper()
    val = matching.value
    max_cap = matching.maxDiscountAmount or matching.max_discount_amount

    calculated_discount = 0.0
    if disc_type == "PERCENT":
        calculated_discount = (payload.cart_total * (val / 100.0))
        if max_cap and max_cap > 0 and calculated_discount > max_cap:
            calculated_discount = max_cap
    else:  # FLAT
        calculated_discount = val

    if calculated_discount > payload.cart_total:
        calculated_discount = payload.cart_total

    desc = matching.description or (
        f"{val:.0f}% OFF" if disc_type == "PERCENT" else f"Flat ₹{val:.0f} OFF"
    )

    result = CouponValidateResult(
        is_valid=True,
        code=matching.code,
        discount_type=disc_type,
        discountType=disc_type,
        value=val,
        discount_amount=round(calculated_discount, 2),
        min_order_value=min_order,
        description=desc,
        message=f'Coupon "{matching.code}" applied! You saved ₹{calculated_discount:.0f}.',
    )

    return APIResponse(
        success=True,
        message=result.message,
        data=result,
    )


# ==============================================================================
# Admin Marketing Management Endpoints
# ==============================================================================

@admin_router.get("", response_model=APIResponse[List[CouponSchema]])
async def list_admin_coupons():
    """Retrieve all promotional coupons for administrative management."""
    coupons = _load_coupons()
    return APIResponse(
        success=True,
        message="Coupons retrieved successfully.",
        data=coupons,
    )


@admin_router.post("", response_model=APIResponse[CouponSchema], status_code=status.HTTP_201_CREATED)
async def create_coupon(data: CouponCreate):
    """Create a new promotional marketing coupon with discount type, value, and limits."""
    code_norm = data.code.strip().upper()
    coupons = _load_coupons()

    existing = next((c for c in coupons if c.code.upper() == code_norm), None)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'A coupon with code "{code_norm}" already exists.',
        )

    disc_type = (data.discount_type or data.discountType or "PERCENT").upper()
    min_order = data.min_order_value if data.min_order_value is not None else (data.minOrderValue or 0.0)
    max_cap = data.max_discount_amount if data.max_discount_amount is not None else data.maxDiscountAmount
    val_until = data.valid_until or data.validUntil or "31 Dec 2026"
    status_str = (data.status or "ACTIVE").upper()

    default_desc = f"{data.value:.0f}% OFF" if disc_type == "PERCENT" else f"Flat ₹{data.value:.0f} OFF"
    if min_order > 0:
        default_desc += f" on orders above ₹{min_order:.0f}"

    new_coupon = CouponSchema(
        code=code_norm,
        discountType=disc_type,
        discount_type=disc_type,
        value=data.value,
        minOrderValue=min_order,
        min_order_value=min_order,
        maxDiscountAmount=max_cap,
        max_discount_amount=max_cap,
        validUntil=val_until,
        valid_until=val_until,
        usageCount=0,
        usage_count=0,
        status=status_str,
        description=data.description or default_desc,
        is_active=status_str == "ACTIVE",
    )

    coupons.insert(0, new_coupon)
    _save_coupons(coupons)

    return APIResponse(
        success=True,
        message=f'Coupon "{code_norm}" created successfully.',
        data=new_coupon,
    )


@admin_router.patch("/{coupon_id}", response_model=APIResponse[CouponSchema])
async def update_coupon(coupon_id: str, payload: Dict[str, Any]):
    """Update or toggle coupon status (ACTIVE / EXPIRED) and terms."""
    coupons = _load_coupons()
    matching_idx = next((i for i, c in enumerate(coupons) if c.id == coupon_id or c.code.upper() == coupon_id.upper()), None)

    if matching_idx is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found.")

    curr = coupons[matching_idx]
    updated_dict = curr.model_dump()

    for k, v in payload.items():
        if v is not None:
            updated_dict[k] = v

    if "status" in payload:
        new_status = payload["status"].upper()
        updated_dict["status"] = new_status
        updated_dict["is_active"] = new_status == "ACTIVE"

    updated_coupon = CouponSchema(**updated_dict)
    coupons[matching_idx] = updated_coupon
    _save_coupons(coupons)

    return APIResponse(
        success=True,
        message=f'Coupon "{updated_coupon.code}" updated successfully.',
        data=updated_coupon,
    )


@admin_router.delete("/{coupon_id}", response_model=APIResponse[bool])
async def delete_coupon(coupon_id: str):
    """Delete a promotional coupon from the system."""
    coupons = _load_coupons()
    initial_len = len(coupons)
    coupons = [c for c in coupons if c.id != coupon_id and c.code.upper() != coupon_id.upper()]

    if len(coupons) == initial_len:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found.")

    _save_coupons(coupons)
    return APIResponse(
        success=True,
        message="Coupon deleted successfully.",
        data=True,
    )
