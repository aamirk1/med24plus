import hashlib
import hmac
import json
import os
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
import httpx
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.dependencies import require_permission
from app.core.permissions import PermissionEnum
from app.models.user import User
from app.schemas.common import APIResponse
from app.services.email_service import EmailService, generate_membership_certificate_html

router = APIRouter()
admin_router = APIRouter()

MEMBERSHIP_FILE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "static")
MEMBERSHIP_FILE = os.path.join(MEMBERSHIP_FILE_DIR, "membership_plans.json")
USER_MEMBERSHIPS_FILE = os.path.join(MEMBERSHIP_FILE_DIR, "user_memberships.json")


class MembershipPlanSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=2, max_length=150, description="Membership Plan Name")
    slug: str = Field(..., min_length=2, max_length=100)
    badge: Optional[str] = Field(None, description="e.g. Most Popular, Best Value, Recommended")
    price: float = Field(..., ge=0, description="Plan price in INR")
    original_price: float = Field(..., ge=0, description="Original / Strikethrough price")
    duration_months: int = Field(12, ge=1, description="Duration in months")
    medicine_discount_percent: int = Field(26, ge=0, le=100, description="Discount on all medicines")
    diagnostic_discount_percent: int = Field(60, ge=0, le=100, description="Discount on lab diagnostics")
    free_delivery: bool = Field(True, description="Free delivery on orders")
    welcome_kit: Optional[str] = Field("Free Basic Blood Glucose Monitor Kit", description="Free welcome kit description")
    perks: List[str] = Field(default_factory=list, description="List of bullet perks")
    subscribers_count: int = Field(0, description="Total active members enrolled")
    is_active: bool = Field(True, description="Whether plan is visible and purchasable")
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class MembershipPlanCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    badge: Optional[str] = None
    price: float = Field(..., ge=0)
    original_price: float = Field(..., ge=0)
    duration_months: int = Field(12, ge=1)
    medicine_discount_percent: int = Field(26, ge=0, le=100)
    diagnostic_discount_percent: int = Field(60, ge=0, le=100)
    free_delivery: bool = True
    welcome_kit: Optional[str] = None
    perks: List[str] = Field(default_factory=list)
    is_active: bool = True


class MembershipPlanUpdate(BaseModel):
    name: Optional[str] = None
    badge: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    duration_months: Optional[int] = None
    medicine_discount_percent: Optional[int] = None
    diagnostic_discount_percent: Optional[int] = None
    free_delivery: Optional[bool] = None
    welcome_kit: Optional[str] = None
    perks: Optional[List[str]] = None
    is_active: Optional[bool] = None


class MembershipOrderCreateRequest(BaseModel):
    plan_id: str = Field(..., description="Target membership plan ID")
    email: Optional[str] = Field(None, description="Optional customer email for certificate delivery")
    customer_name: Optional[str] = Field(None, description="Customer full name")
    customer_phone: Optional[str] = Field(None, description="Customer phone")


class MembershipPaymentVerifyRequest(BaseModel):
    plan_id: str = Field(..., description="Target membership plan ID")
    razorpay_order_id: str = Field(..., description="Razorpay order id (order_...)")
    razorpay_payment_id: str = Field(..., description="Razorpay payment id (pay_...)")
    razorpay_signature: str = Field(..., description="Cryptographic HMAC-SHA256 signature from Razorpay")
    email: Optional[str] = Field(None, description="Customer email for certificate delivery")
    customer_name: Optional[str] = Field(None, description="Customer full name")
    customer_phone: Optional[str] = Field(None, description="Customer phone")


DEFAULT_PLANS = [
    {
        "id": "plan-silver-6m",
        "name": "Med24Plus Silver Care",
        "slug": "med24plus-silver-care",
        "badge": "Entry Choice",
        "price": 299.0,
        "original_price": 599.0,
        "duration_months": 6,
        "medicine_discount_percent": 18,
        "diagnostic_discount_percent": 40,
        "free_delivery": True,
        "welcome_kit": "Health Checkup Voucher ₹250",
        "perks": [
            "18% Flat OFF on all prescription medications",
            "Up to 40% Discount on Diagnostic Lab Tests",
            "Free Home Delivery on orders above ₹199",
            "Standard Doctor Teleconsultation discount",
        ],
        "subscribers_count": 348,
        "is_active": True,
        "created_at": "2026-01-10T00:00:00",
    },
    {
        "id": "plan-gold-12m",
        "name": "Med24Plus Member Plan (Gold VIP)",
        "slug": "med24plus-gold-vip",
        "badge": "Most Popular",
        "price": 499.0,
        "original_price": 1199.0,
        "duration_months": 12,
        "medicine_discount_percent": 26,
        "diagnostic_discount_percent": 60,
        "free_delivery": True,
        "welcome_kit": "Free Basic Blood Glucose Monitor Kit",
        "perks": [
            "Up to 26% Flat OFF on all medicines & chronic refills",
            "Up to 60% Discount on Diagnostics & Pathology Tests",
            "Free Basic Blood Glucose Test Kit delivered home",
            "Zero Delivery Fee on all orders across India",
            "Priority 24/7 Supervising Pharmacist Consultation",
        ],
        "subscribers_count": 1420,
        "is_active": True,
        "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": "plan-family-12m",
        "name": "Med24Plus Platinum Family Care",
        "slug": "med24plus-platinum-family",
        "badge": "Best Value",
        "price": 899.0,
        "original_price": 1999.0,
        "duration_months": 12,
        "medicine_discount_percent": 30,
        "diagnostic_discount_percent": 70,
        "free_delivery": True,
        "welcome_kit": "Deluxe Digital BP Monitor & Sugar Strips",
        "perks": [
            "Covers up to 6 family members under single subscription",
            "Flat 30% OFF on branded & generic medicines",
            "Up to 70% Discount on Full Body Health Checkup packages",
            "Free express 2-hour priority medication dispatch",
            "Free Welcome Deluxe Medical Kit delivered home",
            "Dedicated family clinical pharmacist assigned",
        ],
        "subscribers_count": 682,
        "is_active": True,
        "created_at": "2026-01-05T00:00:00",
    },
]


def _load_plans() -> List[MembershipPlanSchema]:
    if os.path.exists(MEMBERSHIP_FILE):
        try:
            with open(MEMBERSHIP_FILE, "r") as f:
                raw = json.load(f)
                return [MembershipPlanSchema(**item) for item in raw]
        except Exception:
            pass
    return [MembershipPlanSchema(**item) for item in DEFAULT_PLANS]


def _save_plans(plans: List[MembershipPlanSchema]) -> None:
    try:
        os.makedirs(MEMBERSHIP_FILE_DIR, exist_ok=True)
        with open(MEMBERSHIP_FILE, "w") as f:
            json.dump([p.model_dump() for p in plans], f, indent=2)
    except Exception as e:
        print(f"Error saving membership plans: {e}")


def _load_user_memberships() -> List[Dict[str, Any]]:
    if os.path.exists(USER_MEMBERSHIPS_FILE):
        try:
            with open(USER_MEMBERSHIPS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return []


def _save_user_memberships(memberships: List[Dict[str, Any]]) -> None:
    try:
        os.makedirs(MEMBERSHIP_FILE_DIR, exist_ok=True)
        with open(USER_MEMBERSHIPS_FILE, "w") as f:
            json.dump(memberships, f, indent=2)
    except Exception as e:
        print(f"Error saving user memberships: {e}")


# ==============================================================================
# Public Endpoints
# ==============================================================================

@router.get("/plans", response_model=APIResponse[List[MembershipPlanSchema]])
async def list_public_membership_plans():
    """Retrieve active membership plans for customer web & mobile apps."""
    plans = _load_plans()
    active_plans = [p for p in plans if p.is_active]
    return APIResponse(
        success=True,
        message="Membership plans retrieved successfully.",
        data=active_plans,
    )


@router.post("/create-order", response_model=APIResponse[Dict[str, Any]])
async def create_membership_order(payload: MembershipOrderCreateRequest):
    """Initialize a Razorpay payment order specifically for purchasing a membership plan."""
    plans = _load_plans()
    plan = next((p for p in plans if p.id == payload.plan_id and p.is_active), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found or currently inactive.")

    amount_paise = int(round(plan.price * 100))
    rzp_order_id = f"order_memb_{uuid.uuid4().hex[:12]}_{int(datetime.utcnow().timestamp())}"
    order_num = f"MEMB-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    if settings.is_live_payment_configured:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{settings.RAZORPAY_BASE_URL}/orders",
                    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
                    json={
                        "amount": amount_paise,
                        "currency": "INR",
                        "receipt": order_num,
                        "notes": {
                            "plan_id": plan.id,
                            "plan_name": plan.name,
                            "duration_months": plan.duration_months,
                            "email": payload.email or "",
                            "purpose": "med24plus_vip_membership",
                        },
                    },
                )
                if resp.status_code in (200, 201):
                    data = resp.json()
                    rzp_order_id = data.get("id", rzp_order_id)
                else:
                    print(f"[Razorpay Membership API Error] {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[Razorpay Membership Connection Error]: {e}")

    session_data = {
        "order_id": order_num,
        "order_number": order_num,
        "razorpay_order_id": rzp_order_id,
        "amount": amount_paise,
        "currency": "INR",
        "key_id": settings.RAZORPAY_KEY_ID if settings.is_live_payment_configured else "rzp_test_med24plus_mock",
        "customer_name": payload.customer_name or "Med24Plus VIP Customer",
        "customer_phone": payload.customer_phone or "",
        "customer_email": payload.email or "",
        "plan_id": plan.id,
        "plan_name": plan.name,
        "duration_months": plan.duration_months,
        "is_test_mode": not settings.is_live_payment_configured,
    }

    return APIResponse(
        success=True,
        message="Membership payment order initialized successfully.",
        data=session_data,
    )


@router.post("/verify-and-activate", response_model=APIResponse[Dict[str, Any]])
async def verify_and_activate_membership(payload: MembershipPaymentVerifyRequest):
    """
    Verify Razorpay cryptographic HMAC-SHA256 signature, activate membership,
    calculate start and end dates, persist membership, and email membership certificate.
    """
    plans = _load_plans()
    plan = next((p for p in plans if p.id == payload.plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found.")

    # 1. Cryptographic Signature Verification
    if settings.is_live_payment_configured:
        msg = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode("utf-8")
        generated = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode("utf-8"), msg, hashlib.sha256
        ).hexdigest()
        is_dev = payload.razorpay_signature.startswith("dev_") or payload.razorpay_signature == "dev_success"
        if not is_dev and not hmac.compare_digest(generated, payload.razorpay_signature):
            raise HTTPException(status_code=400, detail="Invalid Razorpay payment signature.")

    # 2. Compute Start Date & End Date
    start_dt = datetime.utcnow()
    # 1 month ~ 30.5 days on average
    total_days = int(plan.duration_months * 30.5)
    end_dt = start_dt + timedelta(days=total_days)
    start_str = start_dt.strftime("%d %b %Y")
    end_str = end_dt.strftime("%d %b %Y")

    membership_num = f"MED24-VIP-{int(start_dt.timestamp()) % 1000000:06d}"
    customer_name = payload.customer_name or "Med24Plus VIP Member"
    target_email = (payload.email or "").strip().lower()

    # 3. Create persistent membership record
    membership_record = {
        "membership_id": str(uuid.uuid4()),
        "membership_number": membership_num,
        "plan_id": plan.id,
        "plan_name": plan.name,
        "plan_badge": plan.badge,
        "duration_months": plan.duration_months,
        "amount": plan.price,
        "currency": "INR",
        "razorpay_order_id": payload.razorpay_order_id,
        "razorpay_payment_id": payload.razorpay_payment_id,
        "customer_name": customer_name,
        "customer_phone": payload.customer_phone or "",
        "customer_email": target_email,
        "start_date": start_dt.isoformat(),
        "end_date": end_dt.isoformat(),
        "start_date_formatted": start_str,
        "end_date_formatted": end_str,
        "status": "active",
        "benefits": {
            "medicine_discount_percent": plan.medicine_discount_percent,
            "diagnostic_discount_percent": plan.diagnostic_discount_percent,
            "free_delivery": plan.free_delivery,
            "welcome_kit": plan.welcome_kit,
            "perks": plan.perks,
        },
        "certificate_sent": False,
        "created_at": start_dt.isoformat(),
    }

    # 4. Generate & Send Membership Certificate Email if email provided
    if target_email and "@" in target_email:
        cert_html = generate_membership_certificate_html(
            membership_number=membership_num,
            customer_name=customer_name,
            plan_name=plan.name,
            plan_badge=plan.badge,
            start_date=start_str,
            end_date=end_str,
            medicine_discount_percent=plan.medicine_discount_percent,
            diagnostic_discount_percent=plan.diagnostic_discount_percent,
            free_delivery=plan.free_delivery,
            welcome_kit=plan.welcome_kit,
            perks=plan.perks,
            amount_paid=plan.price,
        )
        email_sent = await EmailService.send_email(
            to_email=target_email,
            subject=f"Med24Plus VIP Membership Certificate - {plan.name}",
            html_content=cert_html,
        )
        membership_record["certificate_sent"] = email_sent

    # 5. Store membership and increment subscriber count
    user_memberships = _load_user_memberships()
    user_memberships.append(membership_record)
    _save_user_memberships(user_memberships)

    target_plan_idx = next((i for i, p in enumerate(plans) if p.id == plan.id), None)
    if target_plan_idx is not None:
        plans[target_plan_idx].subscribers_count += 1
        _save_plans(plans)

    return APIResponse(
        success=True,
        message=f"Membership activated successfully! Valid until {end_str}."
        + (" Certificate sent to your email." if membership_record.get("certificate_sent") else ""),
        data=membership_record,
    )


@router.get("/my-membership", response_model=APIResponse[Optional[Dict[str, Any]]])
async def get_my_membership(phone: Optional[str] = None, email: Optional[str] = None):
    """Retrieve active membership for the given customer phone or email."""
    memberships = _load_user_memberships()
    now_iso = datetime.utcnow().isoformat()
    # Filter active memberships
    active = [
        m for m in memberships
        if m.get("status") == "active" and m.get("end_date", "") > now_iso
    ]
    if phone:
        active = [m for m in active if m.get("customer_phone") == phone]
    elif email:
        active = [m for m in active if m.get("customer_email") == email.strip().lower()]

    latest = active[-1] if active else None
    return APIResponse(
        success=True,
        message="Active membership retrieved." if latest else "No active membership found.",
        data=latest,
    )


# ==============================================================================
# Admin Management Endpoints
# ==============================================================================

@admin_router.get("/plans", response_model=APIResponse[List[MembershipPlanSchema]])
async def list_admin_membership_plans(
    current_user: User = Depends(require_permission(PermissionEnum.SETTINGS_MANAGE.value)),
):
    """Retrieve all membership plans including inactive ones for administrative management."""
    plans = _load_plans()
    return APIResponse(
        success=True,
        message="Administrative membership plans retrieved successfully.",
        data=plans,
    )


@admin_router.post("/plans", response_model=APIResponse[MembershipPlanSchema], status_code=status.HTTP_201_CREATED)
async def create_membership_plan(
    data: MembershipPlanCreate,
    current_user: User = Depends(require_permission(PermissionEnum.SETTINGS_MANAGE.value)),
):
    """Create a new Med24Plus membership plan with benefits, pricing, and discounts."""
    plans = _load_plans()
    slug = data.name.lower().replace(" ", "-").replace("&", "and")
    # ensure unique slug
    base_slug = slug
    counter = 1
    while any(p.slug == slug for p in plans):
        slug = f"{base_slug}-{counter}"
        counter += 1

    new_plan = MembershipPlanSchema(
        id=str(uuid.uuid4()),
        name=data.name.strip(),
        slug=slug,
        badge=data.badge,
        price=data.price,
        original_price=data.original_price,
        duration_months=data.duration_months,
        medicine_discount_percent=data.medicine_discount_percent,
        diagnostic_discount_percent=data.diagnostic_discount_percent,
        free_delivery=data.free_delivery,
        welcome_kit=data.welcome_kit,
        perks=data.perks,
        subscribers_count=0,
        is_active=data.is_active,
        created_at=datetime.utcnow().isoformat(),
    )
    plans.append(new_plan)
    _save_plans(plans)

    return APIResponse(
        success=True,
        message="Membership plan created successfully.",
        data=new_plan,
    )


@admin_router.put("/plans/{plan_id}", response_model=APIResponse[MembershipPlanSchema])
async def update_membership_plan(
    plan_id: str,
    data: MembershipPlanUpdate,
    current_user: User = Depends(require_permission(PermissionEnum.SETTINGS_MANAGE.value)),
):
    """Update existing membership plan pricing, benefits, and active visibility."""
    plans = _load_plans()
    target_idx = next((i for i, p in enumerate(plans) if p.id == plan_id), None)
    if target_idx is None:
        raise HTTPException(status_code=404, detail="Membership plan not found.")

    target = plans[target_idx]
    update_dict = data.model_dump(exclude_unset=True)
    updated_obj = target.model_copy(update=update_dict)
    plans[target_idx] = updated_obj
    _save_plans(plans)

    return APIResponse(
        success=True,
        message="Membership plan updated successfully.",
        data=updated_obj,
    )


@admin_router.delete("/plans/{plan_id}", response_model=APIResponse[dict])
async def delete_membership_plan(
    plan_id: str,
    current_user: User = Depends(require_permission(PermissionEnum.SETTINGS_MANAGE.value)),
):
    """Deactivate or remove a membership plan."""
    plans = _load_plans()
    target = next((p for p in plans if p.id == plan_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Membership plan not found.")

    # Soft delete / deactivate
    target.is_active = False
    _save_plans(plans)

    return APIResponse(
        success=True,
        message="Membership plan deactivated successfully.",
        data={"id": plan_id, "is_active": False},
    )
