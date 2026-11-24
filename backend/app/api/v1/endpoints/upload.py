from typing import Optional
from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from app.core.dependencies import require_authenticated_user
from app.models.user import User
from app.schemas.common import APIResponse
from app.services.storage_service import storage_service

admin_router = APIRouter()


@admin_router.post(
    "/image",
    response_model=APIResponse[dict],
    status_code=status.HTTP_201_CREATED,
)
async def upload_image(
    file: UploadFile = File(..., description="Image file (JPEG, PNG, WebP up to 5MB)"),
    folder: str = Query("catalog", description="Storage destination folder: catalog, categories, brands, products"),
    current_user: User = Depends(require_authenticated_user),
):
    """
    Unified image upload endpoint for catalog items, categories, brands, and banners.
    Stores files in Firebase Cloud Storage or local static storage and returns the accessible URL.
    """
    url = await storage_service.save_generic_image(file=file, folder=folder)
    return APIResponse(
        success=True,
        message="Image uploaded successfully.",
        data={
            "url": url,
            "filename": file.filename,
            "content_type": file.content_type,
            "folder": folder,
        },
    )
