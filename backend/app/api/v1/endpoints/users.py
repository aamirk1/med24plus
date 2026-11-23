import uuid
import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_authenticated_user, require_permission
from app.core.permissions import PermissionEnum
from app.models.address import UserAddress
from app.models.order import Order
from app.models.user import User, UserProfile
from app.schemas.auth import UserProfileSchema, UserResponse
from app.schemas.common import APIResponse, PaginatedData, PaginationMeta

router = APIRouter()
admin_router = APIRouter()


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, max_length=150)
    gender: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = Field(None, max_length=10)
    emergency_contact: Optional[str] = Field(None, max_length=15)


class AddressCreateRequest(BaseModel):
    recipient_name: str = Field(..., max_length=150)
    phone: str = Field(..., max_length=15)
    address_line1: str = Field(..., max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    landmark: Optional[str] = Field(None, max_length=150)
    city: str = Field(..., max_length=100)
    state: str = Field(..., max_length=100)
    pincode: str = Field(..., min_length=6, max_length=6)
    address_type: str = Field("home", max_length=20)
    is_default: bool = False


class AddressResponse(BaseModel):
    id: uuid.UUID
    recipient_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    landmark: Optional[str] = None
    city: str
    state: str
    pincode: str
    address_type: str
    is_default: bool

    class Config:
        from_attributes = True


@router.get(
    "/me/profile",
    response_model=APIResponse[UserProfileSchema],
)
async def get_user_profile(
    current_user: User = Depends(require_authenticated_user),
):
    """Retrieve customer's medical and demographic profile."""
    profile = current_user.profile or UserProfile(user_id=current_user.id)
    return APIResponse(
        success=True,
        message="User profile retrieved.",
        data=UserProfileSchema(
            gender=profile.gender,
            date_of_birth=profile.date_of_birth,
            blood_group=profile.blood_group,
            emergency_contact=profile.emergency_contact,
            avatar_url=profile.avatar_url,
        ),
    )


@router.put(
    "/me/profile",
    response_model=APIResponse[UserProfileSchema],
)
async def update_user_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Update customer demographic and medical profile."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()

    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    if payload.gender is not None:
        profile.gender = payload.gender
    if payload.blood_group is not None:
        profile.blood_group = payload.blood_group
    if payload.emergency_contact is not None:
        profile.emergency_contact = payload.emergency_contact
    if payload.date_of_birth:
        from datetime import datetime
        try:
            profile.date_of_birth = datetime.strptime(payload.date_of_birth, "%Y-%m-%d").date()
        except ValueError:
            pass

    await db.commit()
    await db.refresh(profile)

    return APIResponse(
        success=True,
        message="Profile updated successfully.",
        data=UserProfileSchema(
            gender=profile.gender,
            date_of_birth=profile.date_of_birth,
            blood_group=profile.blood_group,
            emergency_contact=profile.emergency_contact,
            avatar_url=profile.avatar_url,
        ),
    )


@router.get(
    "/me/addresses",
    response_model=APIResponse[List[AddressResponse]],
)
async def get_my_addresses(
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve authenticated user's saved addresses."""
    stmt = (
        select(UserAddress)
        .where(UserAddress.user_id == current_user.id, UserAddress.is_deleted == False)  # noqa: E712
        .order_by(UserAddress.is_default.desc(), UserAddress.created_at.desc())
    )
    result = await db.execute(stmt)
    addresses = result.scalars().all()

    return APIResponse(
        success=True,
        message="Addresses retrieved successfully.",
        data=[AddressResponse.model_validate(a) for a in addresses],
    )


@router.post(
    "/me/addresses",
    response_model=APIResponse[AddressResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_my_address(
    payload: AddressCreateRequest,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new delivery address for the authenticated user."""
    # If default is requested, unset existing defaults
    if payload.is_default:
        from sqlalchemy import update
        await db.execute(
            update(UserAddress)
            .where(UserAddress.user_id == current_user.id)
            .values(is_default=False)
        )

    new_address = UserAddress(
        user_id=current_user.id,
        recipient_name=payload.recipient_name,
        phone=payload.phone,
        address_line1=payload.address_line1,
        address_line2=payload.address_line2,
        landmark=payload.landmark,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        address_type=payload.address_type,
        is_default=payload.is_default,
    )
    db.add(new_address)
    await db.commit()
    await db.refresh(new_address)

    return APIResponse(
        success=True,
        message="Address created successfully.",
        data=AddressResponse.model_validate(new_address),
    )


@router.delete(
    "/me/addresses/{address_id}",
    response_model=APIResponse[dict],
)
async def delete_my_address(
    address_id: uuid.UUID,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete user's address ensuring strict ownership isolation."""
    stmt = select(UserAddress).where(UserAddress.id == address_id, UserAddress.user_id == current_user.id)
    result = await db.execute(stmt)
    addr = result.scalars().first()

    if not addr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": "Address not found or does not belong to you.",
                "error": {"code": "ADDRESS_NOT_FOUND"},
            },
        )

    addr.is_deleted = True
    await db.commit()

    return APIResponse(
        success=True,
        message="Address removed successfully.",
        data={"deleted": True},
    )


# ==============================================================================
# Admin Customer Management Endpoints
# ==============================================================================

class AdminCustomerListItem(BaseModel):
    id: str
    name: str
    phone: str
    email: str
    registeredDate: str
    totalOrders: int
    totalSpentINR: float
    city: str
    pincode: str
    status: str


class AdminCustomerDetail(BaseModel):
    id: str
    name: str
    phone: str
    email: str
    registeredDate: str
    status: str
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    totalOrders: int
    totalSpentINR: float
    addresses: List[dict]


@admin_router.get(
    "/customers",
    response_model=APIResponse[PaginatedData[AdminCustomerListItem]],
    dependencies=[Depends(require_permission(PermissionEnum.USERS_READ.value))],
)
async def list_admin_customers(
    search: Optional[str] = Query(None, description="Search by name, phone, or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.USERS_READ.value)),
):
    """List registered pharmacy customers with real order summaries and address metadata."""
    base_where = [User.is_deleted == False]  # noqa: E712
    if search:
        pattern = f"%{search.strip()}%"
        base_where.append(
            or_(
                User.full_name.ilike(pattern),
                User.phone.ilike(pattern),
                User.email.ilike(pattern),
            )
        )

    # Count query
    count_stmt = select(func.count(User.id)).where(*base_where)
    total_count = (await db.execute(count_stmt)).scalar() or 0

    # User list
    offset = (page - 1) * page_size
    stmt = (
        select(User)
        .where(*base_where)
        .options(selectinload(User.addresses), selectinload(User.profile))
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    users = result.scalars().all()

    # Pre-aggregate order stats for these users
    user_ids = [u.id for u in users]
    order_stats: dict = {}
    if user_ids:
        stats_stmt = (
            select(
                Order.customer_id,
                func.count(Order.id).label("cnt"),
                func.coalesce(func.sum(Order.total_amount), 0).label("spent"),
            )
            .where(Order.customer_id.in_(user_ids))
            .group_by(Order.customer_id)
        )
        stats_res = await db.execute(stats_stmt)
        for row in stats_res:
            order_stats[row[0]] = (row[1], float(row[2]))

    items: List[AdminCustomerListItem] = []
    for u in users:
        stats = order_stats.get(u.id, (0, 0.0))
        default_addr = next((a for a in u.addresses if a.is_default and not a.is_deleted), None)
        if not default_addr and u.addresses:
            active_addrs = [a for a in u.addresses if not a.is_deleted]
            if active_addrs:
                default_addr = active_addrs[0]

        items.append(
            AdminCustomerListItem(
                id=str(u.id),
                name=u.full_name or "Customer",
                phone=u.phone,
                email=u.email or "",
                registeredDate=u.created_at.strftime("%d %b %Y") if u.created_at else "Recent",
                totalOrders=stats[0],
                totalSpentINR=round(stats[1], 2),
                city=default_addr.city if default_addr else "N/A",
                pincode=default_addr.pincode if default_addr else "N/A",
                status="ACTIVE" if u.is_active else "BLOCKED",
            )
        )

    total_pages = math.ceil(total_count / page_size) if total_count > 0 else 1
    return APIResponse(
        success=True,
        message="Customers retrieved successfully.",
        data=PaginatedData(
            items=items,
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total_count,
                total_pages=total_pages,
            ),
        ),
    )


@admin_router.get(
    "/customers/{customer_id}",
    response_model=APIResponse[AdminCustomerDetail],
    dependencies=[Depends(require_permission(PermissionEnum.USERS_READ.value))],
)
async def get_admin_customer_detail(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.USERS_READ.value)),
):
    """Retrieve full profile, delivery addresses, and ordering history for a patient."""
    stmt = (
        select(User)
        .where(User.id == customer_id, User.is_deleted == False)  # noqa: E712
        .options(selectinload(User.addresses), selectinload(User.profile))
    )
    result = await db.execute(stmt)
    u = result.scalars().first()
    if not u:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Customer not found.", "error": {"code": "NOT_FOUND"}},
        )

    # Order stats
    stats_stmt = (
        select(
            func.count(Order.id),
            func.coalesce(func.sum(Order.total_amount), 0),
        ).where(Order.customer_id == customer_id)
    )
    stats_res = await db.execute(stats_stmt)
    row = stats_res.first()
    order_count = row[0] if row else 0
    spent_total = float(row[1]) if row else 0.0

    addr_list = [
        {
            "id": str(a.id),
            "recipient_name": a.recipient_name,
            "phone": a.phone,
            "address_line1": a.address_line1,
            "address_line2": a.address_line2,
            "landmark": a.landmark,
            "city": a.city,
            "state": a.state,
            "pincode": a.pincode,
            "address_type": a.address_type,
            "is_default": a.is_default,
        }
        for a in u.addresses
        if not a.is_deleted
    ]

    profile = u.profile
    return APIResponse(
        success=True,
        message="Customer detail retrieved.",
        data=AdminCustomerDetail(
            id=str(u.id),
            name=u.full_name or "Customer",
            phone=u.phone,
            email=u.email or "",
            registeredDate=u.created_at.strftime("%d %b %Y") if u.created_at else "Recent",
            status="ACTIVE" if u.is_active else "BLOCKED",
            gender=profile.gender if profile else None,
            date_of_birth=profile.date_of_birth.strftime("%Y-%m-%d") if profile and profile.date_of_birth else None,
            blood_group=profile.blood_group if profile else None,
            emergency_contact=profile.emergency_contact if profile else None,
            totalOrders=order_count,
            totalSpentINR=round(spent_total, 2),
            addresses=addr_list,
        ),
    )


@admin_router.get(
    "/staff",
    response_model=APIResponse[List[dict]],
    dependencies=[Depends(require_permission(PermissionEnum.USERS_READ.value))],
)
async def list_admin_staff(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.USERS_READ.value)),
):
    """List internal pharmacy staff, licensed pharmacists, and administrators."""
    from app.models.role import Role, UserRole

    stmt = (
        select(User)
        .where(User.is_deleted == False)  # noqa: E712
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(Role.slug.in_(["super_admin", "admin", "pharmacist", "staff", "inventory_manager"]))
        .options(
            selectinload(User.user_roles).selectinload(UserRole.role),
            selectinload(User.pharmacist_profile),
        )
        .distinct()
    )
    result = await db.execute(stmt)
    users = result.scalars().all()

    staff_list = []
    for u in users:
        role_name = "Staff"
        if u.user_roles:
            role_slugs = [ur.role.slug for ur in u.user_roles if ur.role]
            if "super_admin" in role_slugs:
                role_name = "Super Admin"
            elif "admin" in role_slugs:
                role_name = "Admin"
            elif "pharmacist" in role_slugs:
                role_name = "Pharmacist"
            elif "inventory_manager" in role_slugs:
                role_name = "Inventory Manager"

        license_no = u.pharmacist_profile.registration_number if u.pharmacist_profile else None
        staff_list.append(
            {
                "id": str(u.id),
                "name": u.full_name or "Staff Member",
                "role": role_name,
                "licenseNo": license_no,
                "phone": u.phone,
                "email": u.email or "",
                "joinedDate": u.created_at.strftime("%d %b %Y") if u.created_at else "Recent",
                "status": "ACTIVE" if u.is_active else "INACTIVE",
            }
        )

    return APIResponse(
        success=True,
        message="Staff list retrieved successfully.",
        data=staff_list,
    )



