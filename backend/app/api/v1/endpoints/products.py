import math
import uuid
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.core.permissions import PermissionEnum
from app.models.user import User
from app.schemas.catalog import (
    ProductCreate,
    ProductDetailResponse,
    ProductImageResponse,
    ProductListItemResponse,
    ProductStatusUpdate,
    ProductSubstitutesResponse,
    ProductUpdate,
)
from app.schemas.common import APIResponse, PaginatedData, PaginationMeta
from app.services.catalog_service import CatalogService

router = APIRouter()


# ==============================================================================
# Public Catalog Endpoints
# ==============================================================================

@router.get("", response_model=APIResponse[PaginatedData[ProductListItemResponse]])
async def list_products(
    search: Optional[str] = Query(None, description="Search product name, generic composition, SKU"),
    category_id: Optional[uuid.UUID] = Query(None, description="Filter by category UUID"),
    brand_id: Optional[uuid.UUID] = Query(None, description="Filter by brand UUID"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum selling price (INR)"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum selling price (INR)"),
    prescription_required: Optional[bool] = Query(None, description="Filter by prescription requirement"),
    dosage_form: Optional[str] = Query(None, description="Filter by dosage form (Tablet, Syrup, etc.)"),
    is_active: Optional[bool] = Query(True, description="Filter active status (defaults to true for public)"),
    sort_by: str = Query("newest", description="newest, name, price_asc, price_desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Search and filter public medicine catalog with real-time sellable inventory derivation.
    Stock availability is calculated dynamically from unexpired, undamaged, active batches.
    """
    service = CatalogService(db)
    items, total = await service.list_products(
        search=search,
        category_id=category_id,
        brand_id=brand_id,
        min_price=min_price,
        max_price=max_price,
        prescription_required=prescription_required,
        dosage_form=dosage_form,
        is_active=is_active,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return APIResponse(
        success=True,
        message="Products retrieved successfully.",
        data=PaginatedData(
            items=items,
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=total_pages,
            ),
        ),
    )


@router.get("/slug/{slug}", response_model=APIResponse[ProductDetailResponse])
async def get_product_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve detailed product profile by unique SEO slug with real-time stock availability."""
    service = CatalogService(db)
    product = await service.get_product_by_slug(slug)
    return APIResponse(
        success=True,
        message="Product details retrieved successfully.",
        data=product,
    )


@router.get("/slug/{slug}/substitutes", response_model=APIResponse[ProductSubstitutesResponse])
async def get_product_substitutes_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve brand substitutes by product slug sharing the same therapeutic salt/molecule."""
    service = CatalogService(db)
    substitutes = await service.get_product_substitutes(slug)
    return APIResponse(
        success=True,
        message="Product brand substitutes retrieved successfully.",
        data=substitutes,
    )


@router.get("/{product_id}", response_model=APIResponse[ProductDetailResponse])
async def get_product_by_id(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve detailed product profile by UUID with real-time stock availability."""
    service = CatalogService(db)
    product = await service.get_product_detail(product_id)
    return APIResponse(
        success=True,
        message="Product details retrieved successfully.",
        data=product,
    )


@router.get("/{product_id}/substitutes", response_model=APIResponse[ProductSubstitutesResponse])
async def get_product_substitutes_by_id(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve brand substitutes by UUID sharing the same therapeutic salt/molecule."""
    service = CatalogService(db)
    substitutes = await service.get_product_substitutes(str(product_id))
    return APIResponse(
        success=True,
        message="Product brand substitutes retrieved successfully.",
        data=substitutes,
    )


# ==============================================================================
# Admin Product Management Endpoints
# ==============================================================================

admin_router = APIRouter()


@admin_router.post(
    "",
    response_model=APIResponse[ProductDetailResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(PermissionEnum.PRODUCTS_CREATE.value))],
)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.PRODUCTS_CREATE.value)),
):
    """Add a new medication or healthcare formulation to the master catalog."""
    service = CatalogService(db)
    product = await service.create_product(data)
    await db.commit()
    # Fetch full detail response
    detail = await service.get_product_detail(product.id)
    return APIResponse(
        success=True,
        message="Product created successfully.",
        data=detail,
    )


@admin_router.put(
    "/{product_id}",
    response_model=APIResponse[ProductDetailResponse],
    dependencies=[Depends(require_permission(PermissionEnum.PRODUCTS_UPDATE.value))],
)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.PRODUCTS_UPDATE.value)),
):
    """Update catalog metadata, pricing, formulation, or regulatory parameters."""
    service = CatalogService(db)
    product = await service.update_product(product_id, data)
    await db.commit()
    detail = await service.get_product_detail(product.id)
    return APIResponse(
        success=True,
        message="Product updated successfully.",
        data=detail,
    )


@admin_router.patch(
    "/{product_id}/status",
    response_model=APIResponse[ProductDetailResponse],
    dependencies=[Depends(require_permission(PermissionEnum.PRODUCTS_MANAGE_STATUS.value))],
)
async def update_product_status(
    product_id: uuid.UUID,
    data: ProductStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.PRODUCTS_MANAGE_STATUS.value)),
):
    """Toggle product active/inactive catalog listing."""
    service = CatalogService(db)
    product = await service.set_product_status(product_id, data.is_active)
    await db.commit()
    detail = await service.get_product_detail(product.id)
    return APIResponse(
        success=True,
        message=f"Product status set to {'active' if data.is_active else 'inactive'}.",
        data=detail,
    )


@admin_router.delete(
    "/{product_id}",
    response_model=APIResponse[dict],
    dependencies=[Depends(require_permission(PermissionEnum.PRODUCTS_DELETE.value))],
)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.PRODUCTS_DELETE.value)),
):
    """Soft delete product (prevented if product is linked to statutory order invoices)."""
    service = CatalogService(db)
    await service.delete_product(product_id)
    await db.commit()
    return APIResponse(
        success=True,
        message="Product deleted successfully.",
        data={"product_id": str(product_id)},
    )


# ==============================================================================
# Product Image Endpoints
# ==============================================================================

@admin_router.post(
    "/{product_id}/images",
    response_model=APIResponse[ProductImageResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(PermissionEnum.PRODUCTS_UPDATE.value))],
)
async def upload_product_image(
    product_id: uuid.UUID,
    file: UploadFile = File(...),
    alt_text: Optional[str] = Form(None),
    is_primary: bool = Form(False),
    sort_order: int = Form(0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.PRODUCTS_UPDATE.value)),
):
    """Upload packaging or blister photo to product gallery."""
    service = CatalogService(db)
    img = await service.upload_product_image(
        product_id=product_id,
        file=file,
        alt_text=alt_text,
        is_primary=is_primary,
        sort_order=sort_order,
    )
    await db.commit()
    return APIResponse(
        success=True,
        message="Product image uploaded successfully.",
        data=ProductImageResponse.model_validate(img),
    )


@admin_router.patch(
    "/{product_id}/images/{image_id}/primary",
    response_model=APIResponse[ProductImageResponse],
    dependencies=[Depends(require_permission(PermissionEnum.PRODUCTS_UPDATE.value))],
)
async def set_primary_product_image(
    product_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.PRODUCTS_UPDATE.value)),
):
    """Designate an image as the primary cover photo."""
    service = CatalogService(db)
    img = await service.set_primary_product_image(product_id, image_id)
    await db.commit()
    return APIResponse(
        success=True,
        message="Primary image designated successfully.",
        data=ProductImageResponse.model_validate(img),
    )


@admin_router.delete(
    "/{product_id}/images/{image_id}",
    response_model=APIResponse[dict],
    dependencies=[Depends(require_permission(PermissionEnum.PRODUCTS_UPDATE.value))],
)
async def delete_product_image(
    product_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(PermissionEnum.PRODUCTS_UPDATE.value)),
):
    """Delete image from storage and remove record from product gallery."""
    service = CatalogService(db)
    await service.delete_product_image(product_id, image_id)
    await db.commit()
    return APIResponse(
        success=True,
        message="Product image removed successfully.",
        data={"image_id": str(image_id)},
    )

