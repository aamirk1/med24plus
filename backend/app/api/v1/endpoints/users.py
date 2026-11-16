import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_authenticated_user
from app.models.address import UserAddress
from app.models.user import User, UserProfile
from app.schemas.auth import UserProfileSchema, UserResponse
from app.schemas.common import APIResponse

router = APIRouter()


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

