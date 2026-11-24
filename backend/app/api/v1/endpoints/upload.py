from typing import Optional
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_authenticated_user
from app.models.user import User
from app.schemas.common import APIResponse
from app.services.storage_service import storage_service
from app.utils.sync_images_to_firebase import sync_all_images_to_firebase

admin_router = APIRouter()


@admin_router.post(
    "/image",
    response_model=APIResponse[dict],
    status_code=status.HTTP_201_CREATED,
)
async def upload_image(
    file: UploadFile = File(..., description="Image file (JPEG, PNG, WebP up to 10MB)"),
    folder: str = Query("catalog", description="Storage destination folder: catalog, categories, brands, products, banners"),
    subfolder: Optional[str] = Query(None, description="Optional entity ID or slug subfolder (e.g. category ID, brand slug)"),
    current_user: User = Depends(require_authenticated_user),
):
    """
    Unified image upload endpoint for catalog items, categories, brands, and banners.
    Stores files directly in Firebase Cloud Storage at proper paths and returns the accessible URL.
    """
    url = await storage_service.save_generic_image(file=file, folder=folder, subfolder=subfolder)
    return APIResponse(
        success=True,
        message="Image uploaded successfully to Firebase Storage.",
        data={
            "url": url,
            "filename": file.filename,
            "content_type": file.content_type,
            "folder": folder,
            "subfolder": subfolder,
        },
    )


@admin_router.post(
    "/sync-to-firebase",
    response_model=APIResponse[dict],
    status_code=status.HTTP_200_OK,
)
async def sync_images_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
):
    """
    Synchronize all existing non-Firebase catalog images, category icons, and brand logos
    to Firebase Storage at proper paths, and update PostgreSQL database records with public URLs.
    """
    res = await sync_all_images_to_firebase(db)
    return APIResponse(
        success=res.get("success", True),
        message=res.get("message", "Sync complete."),
        data=res,
    )

