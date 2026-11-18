import hashlib
import hmac
import logging
import os
import time
import uuid
from pathlib import Path
from typing import Optional, Set, Tuple
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.services.firebase_service import FirebaseService

logger = logging.getLogger("med24plus.prescription_storage")

# Supported MIME types and extensions for Rule 65 clinical prescriptions
ALLOWED_PRESCRIPTION_MIME_TYPES: Set[str] = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
}

ALLOWED_PRESCRIPTION_EXTENSIONS: Set[str] = {
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
}

MAX_PRESCRIPTION_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_FILES_PER_PRESCRIPTION = 5
DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 300  # 5 minutes


# ==============================================================================
# Amazon S3 Private Storage Implementation (Commented out in favor of Firebase Cloud Storage)
# ==============================================================================
# class S3PrescriptionProvider:
#     """
#     Private Amazon S3 bucket provider for clinical prescriptions under Rule 65.
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
#     def upload_private(self, key: str, data: bytes, content_type: str):
#         self.client.put_object(
#             Bucket=self.bucket,
#             Key=key,
#             Body=data,
#             ContentType=content_type,
#             ServerSideEncryption="AES256"
#         )
# ==============================================================================


class PrescriptionStorageService:
    """
    Secure private storage service for clinical prescriptions under Rule 65.
    Prescriptions are strictly isolated, stored in private Firebase Cloud Storage,
    and accessible via authenticated access, short-lived HMAC signed tokens,
    or Firebase Storage signed URLs.
    """

    def __init__(self):
        self.upload_dir = Path("private_storage/prescriptions")
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.provider = getattr(settings, "STORAGE_PROVIDER", "firebase")
        self.signing_secret = (getattr(settings, "JWT_SECRET_KEY", "med24_rx_secret") or "med24_rx_secret").encode()
        self.firebase_service = FirebaseService()

    def validate_file_content(self, filename: str, content_type: str, content: bytes) -> Tuple[str, str, str]:
        """
        Validate file extension, MIME type, file size, and magic bytes.
        Returns (ext, mime_type, sha256_checksum).
        """
        # 1. Check size
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": "Uploaded prescription file is empty.",
                    "error": {"code": "EMPTY_PRESCRIPTION_FILE"},
                },
            )

        if len(content) > MAX_PRESCRIPTION_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Prescription file size ({len(content)} bytes) exceeds the maximum limit of 10 MB.",
                    "error": {"code": "PRESCRIPTION_FILE_TOO_LARGE"},
                },
            )

        # 2. Check extension
        ext = os.path.splitext(filename or "")[1].lower()
        if ext not in ALLOWED_PRESCRIPTION_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Invalid file extension '{ext}'. Allowed extensions: .jpg, .jpeg, .png, .pdf.",
                    "error": {"code": "INVALID_PRESCRIPTION_EXTENSION"},
                },
            )

        # 3. Check declared MIME type
        norm_mime = (content_type or "").lower()
        if norm_mime == "image/jpg":
            norm_mime = "image/jpeg"

        if norm_mime not in ALLOWED_PRESCRIPTION_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Unsupported MIME type '{content_type}'. Allowed types: JPEG, PNG, PDF.",
                    "error": {"code": "INVALID_PRESCRIPTION_MIME_TYPE"},
                },
            )

        # 4. Strict magic byte validation
        if ext in {".jpg", ".jpeg"} or norm_mime == "image/jpeg":
            if not content.startswith(b"\xff\xd8\xff"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": "Corrupted or spoofed JPEG file. Header magic bytes mismatch.",
                        "error": {"code": "MALFORMED_JPEG_HEADER"},
                    },
                )
            detected_mime = "image/jpeg"

        elif ext == ".png" or norm_mime == "image/png":
            if not content.startswith(b"\x89PNG\r\n\x1a\n"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": "Corrupted or spoofed PNG file. Header magic bytes mismatch.",
                        "error": {"code": "MALFORMED_PNG_HEADER"},
                    },
                )
            detected_mime = "image/png"

        elif ext == ".pdf" or norm_mime == "application/pdf":
            if not content.startswith(b"%PDF-"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": "Corrupted or spoofed PDF document. Header magic bytes mismatch.",
                        "error": {"code": "MALFORMED_PDF_HEADER"},
                    },
                )
            detected_mime = "application/pdf"
        else:
            detected_mime = norm_mime

        # 5. Compute SHA-256 Checksum
        checksum = hashlib.sha256(content).hexdigest()

        return ext, detected_mime, checksum

    async def save_prescription_file(
        self,
        file: UploadFile,
        customer_id: uuid.UUID,
        prescription_id: uuid.UUID,
    ) -> Tuple[str, str, int, str, str]:
        """
        Validates and writes an uploaded file to private storage and Firebase Cloud Storage.
        Returns: (safe_storage_key, original_filename, file_size, mime_type, checksum)
        """
        filename = os.path.basename(file.filename or "prescription_document")
        content = await file.read()

        ext, mime_type, checksum = self.validate_file_content(filename, file.content_type or "", content)

        # Generate non-guessable storage key
        unique_file_id = uuid.uuid4().hex
        storage_filename = f"rx_{prescription_id.hex}_{unique_file_id}{ext}"
        blob_path = f"prescriptions/{prescription_id.hex}/{storage_filename}"
        target_path = (self.upload_dir / storage_filename).resolve()

        # Path traversal guard
        if not str(target_path).startswith(str(self.upload_dir.resolve())):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": "Security error: invalid storage path detected.",
                    "error": {"code": "PATH_TRAVERSAL_DETECTED"},
                },
            )

        # Write to local secure directory cache
        with open(target_path, "wb") as f:
            f.write(content)

        # Upload to Firebase Cloud Storage (Private encrypted bucket)
        if self.provider == "firebase" or not self.firebase_service.is_simulation_mode:
            success, url, err = await self.firebase_service.upload_file(
                destination_blob_name=blob_path,
                content=content,
                content_type=mime_type,
                is_public=False,
            )
            if success:
                logger.info(f"[PRESCRIPTION STORAGE] Encrypted prescription uploaded to Firebase Storage: {blob_path}")
            else:
                logger.warning(f"[PRESCRIPTION STORAGE] Firebase upload notice ({err}); cached in local secure storage.")

        return storage_filename, filename, len(content), mime_type, checksum

    def get_file_path(self, storage_key: str) -> Path:
        """Resolve and verify storage key within the private directory or fetch from Firebase Storage."""
        safe_key = os.path.basename(storage_key)
        target_path = (self.upload_dir / safe_key).resolve()

        if not str(target_path).startswith(str(self.upload_dir.resolve())):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Illegal path access attempt."},
            )

        if target_path.exists() and target_path.is_file():
            return target_path

        # If not present in local cache, attempt download from Firebase Storage
        if not self.firebase_service.is_simulation_mode:
            bucket = self.firebase_service.get_bucket()
            if bucket:
                try:
                    blobs = list(bucket.list_blobs(prefix="prescriptions/"))
                    matching_blob = next((b for b in blobs if b.name.endswith(safe_key)), None)
                    if matching_blob:
                        data = matching_blob.download_as_bytes()
                        with open(target_path, "wb") as f:
                            f.write(data)
                        return target_path
                except Exception as e:
                    logger.error(f"[PRESCRIPTION STORAGE] Error downloading from Firebase Storage: {e}")

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Prescription document not found on storage server."},
        )

    async def get_firebase_signed_url(self, storage_key: str, expires_seconds: int = 900) -> Tuple[bool, str, Optional[str]]:
        """Generate a time-limited signed download URL directly from Firebase Storage."""
        safe_key = os.path.basename(storage_key)
        bucket = self.firebase_service.get_bucket()
        if not bucket or self.firebase_service.is_simulation_mode:
            return False, "", "Firebase Storage bucket is not available."

        try:
            blobs = list(bucket.list_blobs(prefix="prescriptions/"))
            matching_blob = next((b for b in blobs if b.name.endswith(safe_key)), None)
            if matching_blob:
                return await self.firebase_service.get_signed_download_url(matching_blob.name, expires_seconds=expires_seconds)
            return False, "", "Prescription file not found in Firebase Storage."
        except Exception as e:
            return False, "", str(e)

    def generate_signed_view_token(self, file_id: uuid.UUID, expires_in: int = DEFAULT_SIGNED_URL_EXPIRY_SECONDS) -> str:
        """
        Generate a cryptographically tamper-evident, time-limited token for viewing
        the prescription in image tags or PDF viewers.
        Format: <expires_timestamp>:<hex_hmac>
        """
        expires_at = int(time.time()) + expires_in
        payload = f"{file_id.hex}:{expires_at}".encode()
        sig = hmac.new(self.signing_secret, payload, hashlib.sha256).hexdigest()
        return f"{expires_at}.{sig}"

    def verify_signed_view_token(self, file_id: uuid.UUID, token: str) -> bool:
        """
        Verify that the signed token is authentic and has not expired.
        """
        try:
            parts = token.split(".")
            if len(parts) != 2:
                return False
            expires_at_str, received_sig = parts
            expires_at = int(expires_at_str)

            if time.time() > expires_at:
                return False

            payload = f"{file_id.hex}:{expires_at}".encode()
            expected_sig = hmac.new(self.signing_secret, payload, hashlib.sha256).hexdigest()
            return hmac.compare_digest(expected_sig, received_sig)
        except Exception:
            return False


prescription_storage_service = PrescriptionStorageService()
