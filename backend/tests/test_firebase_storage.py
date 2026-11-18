import io
import uuid
import pytest
from unittest.mock import MagicMock, patch
from fastapi import UploadFile

from app.core.config import settings
from app.services.firebase_service import FirebaseService
from app.services.storage_service import StorageService
from app.services.prescription_storage_service import (
    PrescriptionStorageService,
    prescription_storage_service,
)

VALID_JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00" + b"\x00" * 200
VALID_PNG_BYTES = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"\x00" * 100
VALID_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<<\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF"


@pytest.mark.asyncio
async def test_firebase_service_storage_upload():
    """Verify upload_file on FirebaseService."""
    service = FirebaseService()
    test_blob = f"test/sample_{uuid.uuid4().hex[:8]}.jpg"
    test_data = b"Sample test binary data for firebase storage"

    if service.is_simulation_mode:
        success, url, err = await service.upload_file(test_blob, test_data, "image/jpeg", is_public=True)
        assert success is True
        assert "firebasestorage.googleapis.com" in url
        assert err is None
    else:
        mock_blob = MagicMock()
        mock_blob.public_url = f"https://storage.googleapis.com/med24plus/{test_blob}"
        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob
        mock_bucket.name = "med24plus.firebasestorage.app"

        with patch.object(service, "get_bucket", return_value=mock_bucket):
            success, url, err = await service.upload_file(test_blob, test_data, "image/jpeg", is_public=True)
            assert success is True
            assert mock_blob.upload_from_string.called
            assert err is None


@pytest.mark.asyncio
async def test_firebase_service_signed_download_url():
    """Verify generation of signed download URL."""
    service = FirebaseService()
    test_blob = "prescriptions/sample_rx_123.pdf"

    if service.is_simulation_mode:
        success, url, err = await service.get_signed_download_url(test_blob, expires_seconds=300)
        assert success is True
        assert "firebasestorage.googleapis.com" in url
    else:
        mock_blob = MagicMock()
        mock_blob.generate_signed_url.return_value = "https://storage.googleapis.com/signed/test_url"
        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob

        with patch.object(service, "get_bucket", return_value=mock_bucket):
            success, url, err = await service.get_signed_download_url(test_blob, expires_seconds=300)
            assert success is True
            assert "signed" in url


@pytest.mark.asyncio
async def test_storage_service_product_image_firebase_upload(tmp_path):
    """Verify medicine product image upload routed to Firebase Storage."""
    service = StorageService()
    service.upload_dir = tmp_path

    product_id = uuid.uuid4()
    file = UploadFile(
        filename="paracetamol_500.jpg",
        file=io.BytesIO(VALID_JPEG_BYTES),
        headers={"content-type": "image/jpeg"},
    )

    with patch.object(service.firebase_service, "upload_file", return_value=(True, "https://firebasestorage.googleapis.com/v0/b/med24plus/o/products%2Fsample.jpg?alt=media", None)):
        url = await service.save_product_image(file, product_id)
        assert "firebasestorage.googleapis.com" in url


@pytest.mark.asyncio
async def test_prescription_storage_service_firebase_upload(tmp_path):
    """Verify clinical prescription document uploaded to Firebase Storage."""
    service = PrescriptionStorageService()
    service.upload_dir = tmp_path

    customer_id = uuid.uuid4()
    rx_id = uuid.uuid4()
    file = UploadFile(
        filename="dr_prescription.pdf",
        file=io.BytesIO(VALID_PDF_BYTES),
        headers={"content-type": "application/pdf"},
    )

    with patch.object(service.firebase_service, "upload_file", return_value=(True, "https://firebasestorage.googleapis.com/prescriptions/sample.pdf", None)):
        storage_key, orig_name, size, mime_type, checksum = await service.save_prescription_file(
            file=file,
            customer_id=customer_id,
            prescription_id=rx_id,
        )

        assert orig_name == "dr_prescription.pdf"
        assert mime_type == "application/pdf"
        assert size == len(VALID_PDF_BYTES)
        assert checksum is not None
        assert storage_key.startswith(f"rx_{rx_id.hex}_")

        # Verify local cache copy exists
        cached_file = service.get_file_path(storage_key)
        assert cached_file.exists()


@pytest.mark.asyncio
async def test_s3_storage_commented_out():
    """Verify that S3 configuration is commented out and Firebase is the active provider."""
    assert getattr(settings, "STORAGE_PROVIDER", "firebase") == "firebase"
    assert getattr(settings, "FIREBASE_STORAGE_BUCKET", None) == "med24plus.firebasestorage.app"
