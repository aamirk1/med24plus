import io
import uuid
from decimal import Decimal
import pytest
from fastapi import HTTPException, UploadFile
from pydantic import ValidationError

from app.schemas.catalog import (
    BrandCreate,
    CategoryCreate,
    CategoryUpdate,
    ProductCreate,
    ProductUpdate,
)
from app.services.catalog_service import CatalogService, slugify
from app.services.storage_service import StorageService


def test_slugify_helper():
    """Verify URL slug generation produces clean, standardized slugs."""
    assert slugify("Paracetamol 650mg & Caffeine") == "paracetamol-650mg-caffeine"
    assert slugify("  Augmentin 625 Duo  ") == "augmentin-625-duo"
    assert slugify("Vitamin-D3 (Cholecalciferol) 60,000 IU") == "vitamin-d3-cholecalciferol-60000-iu"


def test_discount_percent_calculation():
    """Verify exact discount percentage computation without floating point drift."""
    # MRP 100, Selling 80 -> 20%
    assert CatalogService.calculate_discount_percent(Decimal("100.00"), Decimal("80.00")) == Decimal("20.00")
    # MRP 150, Selling 120 -> 20%
    assert CatalogService.calculate_discount_percent(Decimal("150.00"), Decimal("120.00")) == Decimal("20.00")
    # Selling >= MRP -> 0%
    assert CatalogService.calculate_discount_percent(Decimal("100.00"), Decimal("100.00")) == Decimal("0.00")
    assert CatalogService.calculate_discount_percent(Decimal("100.00"), Decimal("110.00")) == Decimal("0.00")
    # Zero MRP -> 0%
    assert CatalogService.calculate_discount_percent(Decimal("0.00"), Decimal("0.00")) == Decimal("0.00")


def test_product_selling_price_exceeding_mrp_rejected():
    """Verify Pydantic model validator rejects selling_price > mrp."""
    with pytest.raises(ValidationError, match="Selling price cannot exceed Maximum Retail Price"):
        ProductCreate(
            name="Overpriced Medicine",
            sku="OVER-001",
            generic_name="Sample Salt",
            category_id=uuid.uuid4(),
            brand_id=uuid.uuid4(),
            manufacturer="Pharma Ltd",
            pack_size="10 Tablets",
            dosage_form="Tablet",
            mrp=Decimal("100.00"),
            selling_price=Decimal("150.00"),  # > MRP!
            hsn_code="3004",
        )


def test_product_update_price_validation():
    """Verify update schema rejects selling_price > mrp when both provided."""
    with pytest.raises(ValidationError, match="Selling price cannot exceed Maximum Retail Price"):
        ProductUpdate(
            mrp=Decimal("50.00"),
            selling_price=Decimal("75.00"),
        )


def test_negative_prices_rejected():
    """Verify negative MRP and selling price are rejected by validation constraints."""
    with pytest.raises(ValidationError):
        ProductCreate(
            name="Negative Price",
            sku="NEG-001",
            generic_name="Sample Salt",
            category_id=uuid.uuid4(),
            brand_id=uuid.uuid4(),
            manufacturer="Pharma Ltd",
            pack_size="10 Tablets",
            dosage_form="Tablet",
            mrp=Decimal("-10.00"),
            selling_price=Decimal("10.00"),
            hsn_code="3004",
        )


def test_storage_service_mime_type_validation():
    """Verify file storage rejects invalid image MIME types and executable files."""
    storage = StorageService()

    # Disallowed MIME type
    fake_exe = UploadFile(
        filename="malicious.exe",
        file=io.BytesIO(b"MZ executable header"),
        headers={"content-type": "application/x-msdownload"},
    )
    with pytest.raises(HTTPException) as exc_info:
        storage.validate_file(fake_exe)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["error"]["code"] == "INVALID_IMAGE_TYPE"

    # Disallowed extension despite fake MIME
    fake_php = UploadFile(
        filename="shell.php",
        file=io.BytesIO(b"<?php phpinfo(); ?>"),
        headers={"content-type": "image/jpeg"},
    )
    with pytest.raises(HTTPException) as exc_info2:
        storage.validate_file(fake_php)
    assert exc_info2.value.status_code == 400
    assert exc_info2.value.detail["error"]["code"] == "INVALID_FILE_EXTENSION"

    # Valid image
    valid_jpg = UploadFile(
        filename="blister_pack.jpg",
        file=io.BytesIO(b"\xff\xd8\xff JPEG content"),
        headers={"content-type": "image/jpeg"},
    )
    ext = storage.validate_file(valid_jpg)
    assert ext == ".jpg"

