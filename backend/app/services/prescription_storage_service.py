import hashlib
import hmac
import os
import time
import uuid
from pathlib import Path
from typing import Optional, Set, Tuple
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

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


class PrescriptionStorageService:
    """
    Secure private storage service for clinical prescriptions under Rule 65.
    Prescriptions are strictly isolated from public CDN/static web endpoints,
    stored in private storage, and only accessible via authenticated access
    or short-lived HMAC signed tokens.
    """

    def __init__(self):
        self.upload_dir = Path("private_storage/prescriptions")
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.provider = getattr(settings, "STORAGE_PROVIDER", "local")
        self.signing_secret = (getattr(settings, "JWT_SECRET_KEY", "med24_rx_secret") or "med24_rx_secret").encode()

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
        Validates and writes an uploaded file to private storage.
        Returns: (safe_storage_key, original_filename, file_size, mime_type, checksum)
        """
        filename = os.path.basename(file.filename or "prescription_document")
        content = await file.read()

        ext, mime_type, checksum = self.validate_file_content(filename, file.content_type or "", content)

        # Generate non-guessable storage key
        unique_file_id = uuid.uuid4().hex
        storage_filename = f"rx_{prescription_id.hex}_{unique_file_id}{ext}"
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

        with open(target_path, "wb") as f:
            f.write(content)

        return storage_filename, filename, len(content), mime_type, checksum

    def get_file_path(self, storage_key: str) -> Path:
        """Resolve and verify storage key within the private directory."""
        safe_key = os.path.basename(storage_key)
        target_path = (self.upload_dir / safe_key).resolve()

        if not str(target_path).startswith(str(self.upload_dir.resolve())):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Illegal path access attempt."},
            )

        if not target_path.exists() or not target_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Prescription document not found on storage server."},
            )

        return target_path

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

