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
    CategoryCreate,
    CategoryResponse,
    CategoryStatusUpdate,
    CategoryUpdate,
)
from app.schemas.common import APIResponse, PaginatedData, PaginationMeta
from app.services.catalog_service import CatalogService

router = APIRouter()


# ==============================================================================
# Public Endpoints
# ==============================================================================

@router.get("", response_model=APIResponse[PaginatedData[CategoryResponse]])
async def list_categories(
    search: Optional[str] = Query(None, description="Search category name or description"),
    parent_id: Optional[uuid.UUID] = Query(None, description="Filter by parent category"),
    only_root: bool = Query(False, description="List top-level root categories only"),
    is_active: Optional[bool] = Query(True, description="Filter active status (defaults to active-only for public)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve public product categories with pagination and search."""
    service = CatalogService(db)
    items, total = await service.list_categories(
        is_active=is_active,
        parent_id=parent_id,
        search=search,
        only_root=only_root,
        page=page,
        page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return APIResponse(
        success=True,
        message="Categories retrieved successfully.",
        data=PaginatedData(
            items=[CategoryResponse.model_validate(c) for c in items],
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=total_pages,
            ),
        ),
    )


@router.get("/{category_id}", response_model=APIResponse[CategoryResponse])
async def get_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve single category by UUID."""
    service = CatalogService(db)
    category = await service.get_category(category_id)
    return APIResponse(
        success=True,
        message="Category retrieved successfully.",
        data=CategoryResponse.model_validate(category),
    )


# ==============================================================================
# Admin Endpoints
# ==============================================================================

admin_router = APIRouter()


@admin_router.post(
    "",
    response_model=APIResponse[CategoryResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(PermissionEnum.CATEGORIES_CREATE.value))],
)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.CATEGORIES_CREATE.value)),
):
    """Create a new product category."""
    service = CatalogService(db)
    cat = await service.create_category(data)
    await db.commit()
    return APIResponse(
        success=True,
        message="Category created successfully.",
        data=CategoryResponse(
            id=cat.id,
            name=cat.name,
            slug=cat.slug,
            description=cat.description,
            image_url=cat.image_url,
            parent_id=cat.parent_id,
            sort_order=cat.sort_order,
            is_active=cat.is_active,
            created_at=cat.created_at,
            updated_at=cat.updated_at,
            subcategories=[],
        ),
    )


@admin_router.put(
    "/{category_id}",
    response_model=APIResponse[CategoryResponse],
    dependencies=[Depends(require_permission(PermissionEnum.CATEGORIES_UPDATE.value))],
)
async def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.CATEGORIES_UPDATE.value)),
):
    """Update existing product category details."""
    service = CatalogService(db)
    cat = await service.update_category(category_id, data)
    await db.commit()
    return APIResponse(
        success=True,
        message="Category updated successfully.",
        data=CategoryResponse.model_validate(cat),
    )


@admin_router.patch(
    "/{category_id}/status",
    response_model=APIResponse[CategoryResponse],
    dependencies=[Depends(require_permission(PermissionEnum.CATEGORIES_UPDATE.value))],
)
async def update_category_status(
    category_id: uuid.UUID,
    data: CategoryStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.CATEGORIES_UPDATE.value)),
):
    """Update category active/inactive status."""
    service = CatalogService(db)
    cat = await service.set_category_status(category_id, data.is_active)
    await db.commit()
    return APIResponse(
        success=True,
        message=f"Category status set to {'active' if data.is_active else 'inactive'}.",
        data=CategoryResponse.model_validate(cat),
    )


@admin_router.delete(
    "/{category_id}",
    response_model=APIResponse[dict],
    dependencies=[Depends(require_permission(PermissionEnum.CATEGORIES_DELETE.value))],
)
async def delete_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.CATEGORIES_DELETE.value)),
):
    """Soft delete a category (fails if active products reference it)."""
    service = CatalogService(db)
    await service.delete_category(category_id)
    await db.commit()
    return APIResponse(
        success=True,
        message="Category deleted successfully.",
        data={"category_id": str(category_id)},
    )
