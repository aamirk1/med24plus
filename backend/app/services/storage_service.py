import logging
import os
import uuid
from pathlib import Path
from typing import Optional, Set
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.services.firebase_service import FirebaseService

logger = logging.getLogger("med24plus.storage")

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


# ==============================================================================
# Amazon S3 Storage Implementation (Commented out in favor of Firebase Cloud Storage)
# ==============================================================================
# class S3StorageProvider:
#     """
#     Legacy Amazon S3 / Cloudflare R2 / MinIO storage provider.
#     Commented out while Firebase Cloud Storage is active.
#     """
#     def __init__(self):
#         import boto3
#         self.client = boto3.client(
#             "s3",
#             endpoint_url=settings.STORAGE_ENDPOINT,
#             aws_access_key_id=settings.STORAGE_ACCESS_KEY,
#             aws_secret_access_key=settings.STORAGE_SECRET_KEY,
#         )
#         self.bucket = settings.STORAGE_BUCKET
#
#     def upload(self, key: str, data: bytes, content_type: str) -> str:
#         self.client.put_object(Bucket=self.bucket, Key=key, Body=data, ContentType=content_type)
#         return f"{settings.STORAGE_ENDPOINT}/{self.bucket}/{key}"
# ==============================================================================


class StorageService:
    """
    Unified object storage service for catalog medicine images.
    Uploads directly to Firebase Cloud Storage with local cache fallback.
    """

    def __init__(self):
        self.upload_dir = Path("static/uploads/products")
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.provider = getattr(settings, "STORAGE_PROVIDER", "firebase")
        self.public_url_base = getattr(settings, "API_PUBLIC_URL", "http://localhost:3024")
        self.firebase_service = FirebaseService()

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
        Validate and persist a product/medicine image into Firebase Cloud Storage.
        Returns the public Firebase Cloud Storage URL.
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
        blob_path = f"products/{product_id}/{unique_filename}"
        mime_type = file.content_type or "image/jpeg"

        # Also cache locally for dev/offline serving
        local_target_path = self.upload_dir / unique_filename
        with open(local_target_path, "wb") as f:
            f.write(content)

        # 1. Primary: Upload to Firebase Storage
        if self.provider == "firebase" or not self.firebase_service.is_simulation_mode:
            success, url, err = await self.firebase_service.upload_file(
                destination_blob_name=blob_path,
                content=content,
                content_type=mime_type,
                is_public=True,
            )
            if success and url:
                logger.info(f"[STORAGE] Stored product image in Firebase Storage: {blob_path}")
                return url
            else:
                logger.warning(f"[STORAGE] Firebase Storage upload error ({err}), falling back to local static URL.")

        # 2. Local Fallback URL
        return f"/static/uploads/products/{unique_filename}"

    async def save_generic_image(self, file: UploadFile, folder: str = "catalog") -> str:
        """
        Validate and persist an image into Firebase Cloud Storage or local static storage.
        Returns the public URL (Firebase or local static URL).
        """
        ext = self.validate_file(file)

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

        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": "Uploaded file is empty.",
                    "error": {"code": "EMPTY_FILE"},
                },
            )

        clean_folder = "".join(c for c in folder if c.isalnum() or c in ("-", "_")) or "catalog"
        unique_filename = f"{uuid.uuid4().hex[:16]}{ext}"
        blob_path = f"{clean_folder}/{unique_filename}"
        mime_type = file.content_type or "image/jpeg"

        # Also cache locally for dev/offline serving
        target_dir = Path("static") / "uploads" / clean_folder
        target_dir.mkdir(parents=True, exist_ok=True)
        local_target_path = target_dir / unique_filename
        with open(local_target_path, "wb") as f:
            f.write(content)

        # 1. Primary: Upload to Firebase Storage
        if self.provider == "firebase" or not self.firebase_service.is_simulation_mode:
            success, url, err = await self.firebase_service.upload_file(
                destination_blob_name=blob_path,
                content=content,
                content_type=mime_type,
                is_public=True,
            )
            if success and url:
                logger.info(f"[STORAGE] Stored {clean_folder} image in Firebase Storage: {blob_path}")
                return url
            else:
                logger.warning(f"[STORAGE] Firebase Storage upload error ({err}), falling back to local static URL.")

        # 2. Local Fallback URL
        return f"/static/uploads/{clean_folder}/{unique_filename}"

    async def delete_image(self, image_url: str) -> bool:
        """Remove image file from Firebase Storage or local filesystem."""
        if "firebasestorage.googleapis.com" in image_url:
            try:
                import urllib.parse
                # Extract and unquote blob path from Firebase URL
                encoded_path = image_url.split("/o/")[1].split("?")[0]
                blob_name = urllib.parse.unquote(encoded_path)
                await self.firebase_service.delete_file(blob_name)
                return True
            except Exception as e:
                logger.error(f"[STORAGE] Failed to delete Firebase Storage image: {e}")
                return False

        if "/static/uploads/products/" in image_url:
            filename = image_url.split("/static/uploads/products/")[-1]
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
