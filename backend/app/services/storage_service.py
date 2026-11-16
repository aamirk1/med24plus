import os
import uuid
from pathlib import Path
from typing import Optional, Set
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

# Supported MIME types and extensions
ALLOWED_MIME_TYPES: Set[str] = {
    "image/jpeg",
    "image/png",
    "image/webp",
}
ALLOWED_EXTENSIONS: Set[str] = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


class StorageService:
    """
    Unified object storage service with transparent fallback between
    local filesystem (for development/testing) and S3-compatible cloud storage.
    """

    def __init__(self):
        self.upload_dir = Path("static/uploads/products")
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.provider = getattr(settings, "STORAGE_PROVIDER", "local")
        self.public_url_base = getattr(settings, "API_PUBLIC_URL", "http://localhost:8000")

    def validate_file(self, file: UploadFile) -> str:
        """Validate uploaded image file format, extension, and content type."""
        if not file.content_type or file.content_type.lower() not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Unsupported image MIME type: {file.content_type}. Allowed: JPEG, PNG, WebP.",
                    "error": {"code": "INVALID_IMAGE_TYPE"},
                },
            )

        filename = file.filename or ""
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Invalid file extension: {ext}. Allowed: .jpg, .jpeg, .png, .webp.",
                    "error": {"code": "INVALID_FILE_EXTENSION"},
                },
            )
        return ext

    async def save_product_image(self, file: UploadFile, product_id: uuid.UUID) -> str:
        """
        Validate and persist a product image, returning the public CDN / media URL.
        """
        ext = self.validate_file(file)

        # Read content and validate size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Image file exceeds maximum allowable size of 5 MB ({len(content)} bytes).",
                    "error": {"code": "FILE_TOO_LARGE"},
                },
            )

        # Ensure content is not zero bytes
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": "Uploaded file is empty.",
                    "error": {"code": "EMPTY_FILE"},
                },
            )

        unique_filename = f"{product_id}_{uuid.uuid4().hex[:12]}{ext}"
        target_path = self.upload_dir / unique_filename

        with open(target_path, "wb") as f:
            f.write(content)

        # Construct public URL
        # e.g. http://localhost:8000/static/uploads/products/<unique_filename>
        # or relative /static/uploads/products/<unique_filename>
        public_url = f"/static/uploads/products/{unique_filename}"
        return public_url

    async def delete_image(self, image_url: str) -> bool:
        """Remove image file from storage if stored locally."""
        if "/static/uploads/products/" in image_url:
            filename = image_url.split("/static/uploads/products/")[-1]
            # Safety check: prevent path traversal
            safe_filename = os.path.basename(filename)
            file_path = self.upload_dir / safe_filename
            if file_path.exists() and file_path.is_file():
                try:
                    file_path.unlink()
                    return True
                except Exception:
                    return False
        return True


storage_service = StorageService()

