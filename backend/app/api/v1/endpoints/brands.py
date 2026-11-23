import math
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.core.permissions import PermissionEnum
from app.models.user import User
from app.schemas.catalog import (
    BrandCreate,
    BrandResponse,
    BrandStatusUpdate,
    BrandUpdate,
)
from app.schemas.common import APIResponse, PaginatedData, PaginationMeta
from app.services.catalog_service import CatalogService

router = APIRouter()


# ==============================================================================
# Public Endpoints
# ==============================================================================

@router.get("", response_model=APIResponse[PaginatedData[BrandResponse]])
async def list_brands(
    search: Optional[str] = Query(None, description="Search brand name or manufacturer"),
    is_active: Optional[bool] = Query(True, description="Filter active status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve public pharmaceutical and healthcare brands."""
    service = CatalogService(db)
    items, total = await service.list_brands(
        is_active=is_active,
        search=search,
        page=page,
        page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return APIResponse(
        success=True,
        message="Brands retrieved successfully.",
        data=PaginatedData(
            items=[BrandResponse.model_validate(b) for b in items],
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=total_pages,
            ),
        ),
    )


@router.get("/{brand_id}", response_model=APIResponse[BrandResponse])
async def get_brand(
    brand_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve brand details by UUID."""
    service = CatalogService(db)
    brand = await service.get_brand(brand_id)
    return APIResponse(
        success=True,
        message="Brand retrieved successfully.",
        data=BrandResponse.model_validate(brand),
    )


# ==============================================================================
# Admin Endpoints
# ==============================================================================

admin_router = APIRouter()


@admin_router.post(
    "",
    response_model=APIResponse[BrandResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(PermissionEnum.BRANDS_CREATE.value))],
)
async def create_brand(
    data: BrandCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.BRANDS_CREATE.value)),
):
    """Create a new pharmaceutical brand."""
    service = CatalogService(db)
    brand = await service.create_brand(data)
    await db.commit()
    fresh_brand = await service.brand_repo.get_by_id(brand.id)
    return APIResponse(
        success=True,
        message="Brand created successfully.",
        data=BrandResponse.model_validate(fresh_brand or brand),
    )


@admin_router.put(
    "/{brand_id}",
    response_model=APIResponse[BrandResponse],
    dependencies=[Depends(require_permission(PermissionEnum.BRANDS_UPDATE.value))],
)
async def update_brand(
    brand_id: uuid.UUID,
    data: BrandUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.BRANDS_UPDATE.value)),
):
    """Update existing brand details."""
    service = CatalogService(db)
    brand = await service.update_brand(brand_id, data)
    await db.commit()
    fresh_brand = await service.brand_repo.get_by_id(brand.id)
    return APIResponse(
        success=True,
        message="Brand updated successfully.",
        data=BrandResponse.model_validate(fresh_brand or brand),
    )


@admin_router.patch(
    "/{brand_id}/status",
    response_model=APIResponse[BrandResponse],
    dependencies=[Depends(require_permission(PermissionEnum.BRANDS_UPDATE.value))],
)
async def update_brand_status(
    brand_id: uuid.UUID,
    data: BrandStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.BRANDS_UPDATE.value)),
):
    """Update brand active/inactive status."""
    service = CatalogService(db)
    brand = await service.set_brand_status(brand_id, data.is_active)
    await db.commit()
    fresh_brand = await service.brand_repo.get_by_id(brand.id)
    return APIResponse(
        success=True,
        message=f"Brand status set to {'active' if data.is_active else 'inactive'}.",
        data=BrandResponse.model_validate(fresh_brand or brand),
    )


@admin_router.delete(
    "/{brand_id}",
    response_model=APIResponse[dict],
    dependencies=[Depends(require_permission(PermissionEnum.BRANDS_DELETE.value))],
)
async def delete_brand(
    brand_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.BRANDS_DELETE.value)),
):
    """Soft delete a brand (fails if products reference it)."""
    service = CatalogService(db)
    await service.delete_brand(brand_id)
    await db.commit()
    return APIResponse(
        success=True,
        message="Brand deleted successfully.",
        data={"brand_id": str(brand_id)},
    )

