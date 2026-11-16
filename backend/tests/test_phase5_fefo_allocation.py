import uuid
from datetime import date, timedelta
from decimal import Decimal
import pytest

from app.models.inventory import InventoryBatch
from app.services.fefo_allocation_service import (
    FEFOAllocationService,
    InsufficientStockError,
    fefo_allocation_service,
)


def make_test_batch(
    product_id: uuid.UUID,
    batch_number: str,
    days_to_expiry: int,
    available_qty: int,
    reserved_qty: int = 0,
    status: str = "active",
    purchase_price: Decimal = Decimal("50.00"),
    mrp: Decimal = Decimal("100.00"),
) -> InventoryBatch:
    today = date.today()
    return InventoryBatch(
        id=uuid.uuid4(),
        product_id=product_id,
        batch_number=batch_number,
        manufacturing_date=today - timedelta(days=60),
        expiry_date=today + timedelta(days=days_to_expiry),
        received_quantity=available_qty + reserved_qty,
        available_quantity=available_qty,
        reserved_quantity=reserved_qty,
        damaged_quantity=0,
        quarantined_quantity=0,
        purchase_price=purchase_price,
        batch_mrp=mrp,
        batch_status=status,
    )


def test_fefo_allocates_earliest_expiry_first():
    """Verify that FEFO strictly allocates from the batch closest to expiration first."""
    prod_id = uuid.uuid4()
    # Batch A expires in 120 days
    batch_a = make_test_batch(prod_id, "BATCH-A", days_to_expiry=120, available_qty=50)
    # Batch B expires in 30 days (earliest)
    batch_b = make_test_batch(prod_id, "BATCH-B", days_to_expiry=30, available_qty=30)
    # Batch C expires in 200 days
    batch_c = make_test_batch(prod_id, "BATCH-C", days_to_expiry=200, available_qty=100)

    result = FEFOAllocationService.calculate_allocation_from_batches(
        product_id=prod_id,
        batches=[batch_a, batch_b, batch_c],
        requested_quantity=20,
    )

    assert result.is_fully_allocated is True
    assert result.total_allocated == 20
    assert result.shortfall == 0
    assert len(result.batches) == 1
    # Must allocate exclusively from BATCH-B because it expires earliest
    assert result.batches[0].batch_number == "BATCH-B"
    assert result.batches[0].allocated_quantity == 20


def test_fefo_spans_multiple_batches_in_chronological_order():
    """Verify that when requested quantity exceeds earliest batch, allocation cascades chronologically."""
    prod_id = uuid.uuid4()
    batch_early = make_test_batch(prod_id, "EARLY", days_to_expiry=45, available_qty=25)
    batch_mid = make_test_batch(prod_id, "MID", days_to_expiry=90, available_qty=40)
    batch_late = make_test_batch(prod_id, "LATE", days_to_expiry=180, available_qty=100)

    # Request 50 units: 25 from EARLY, 25 from MID, 0 from LATE
    result = FEFOAllocationService.calculate_allocation_from_batches(
        product_id=prod_id,
        batches=[batch_late, batch_mid, batch_early],
        requested_quantity=50,
    )

    assert result.is_fully_allocated is True
    assert result.total_allocated == 50
    assert len(result.batches) == 2
    assert result.batches[0].batch_number == "EARLY"
    assert result.batches[0].allocated_quantity == 25
    assert result.batches[1].batch_number == "MID"
    assert result.batches[1].allocated_quantity == 25


def test_fefo_skips_expired_batches():
    """Verify that expired batches (expiry_date <= today) are strictly skipped under Rule 65."""
    prod_id = uuid.uuid4()
    # Batch expired 5 days ago
    batch_expired = make_test_batch(prod_id, "EXPIRED", days_to_expiry=-5, available_qty=50)
    # Valid batch expiring in 60 days
    batch_valid = make_test_batch(prod_id, "VALID", days_to_expiry=60, available_qty=20)

    result = FEFOAllocationService.calculate_allocation_from_batches(
        product_id=prod_id,
        batches=[batch_expired, batch_valid],
        requested_quantity=20,
    )

    assert result.is_fully_allocated is True
    assert len(result.batches) == 1
    assert result.batches[0].batch_number == "VALID"
    assert result.batches[0].allocated_quantity == 20


def test_fefo_skips_quarantined_damaged_and_inactive_batches():
    """Verify that non-active, quarantined, or recalled batches are completely excluded."""
    prod_id = uuid.uuid4()
    batch_quarantine = make_test_batch(prod_id, "QUARANTINED", days_to_expiry=30, available_qty=50, status="quarantined")
    batch_recalled = make_test_batch(prod_id, "RECALLED", days_to_expiry=40, available_qty=50, status="recalled")
    batch_depleted = make_test_batch(prod_id, "DEPLETED", days_to_expiry=50, available_qty=0, status="depleted")
    batch_sound = make_test_batch(prod_id, "SOUND", days_to_expiry=100, available_qty=15, status="active")

    result = FEFOAllocationService.calculate_allocation_from_batches(
        product_id=prod_id,
        batches=[batch_quarantine, batch_recalled, batch_depleted, batch_sound],
        requested_quantity=10,
    )

    assert result.is_fully_allocated is True
    assert len(result.batches) == 1
    assert result.batches[0].batch_number == "SOUND"
    assert result.batches[0].allocated_quantity == 10


def test_fefo_excludes_reserved_quantities_from_sellable_capacity():
    """Verify that reserved quantities are not double-allocated."""
    prod_id = uuid.uuid4()
    # Batch has 50 physical units, but 40 are already reserved for pending orders
    batch = make_test_batch(prod_id, "PARTIALLY_RESERVED", days_to_expiry=60, available_qty=50, reserved_qty=40)

    result = FEFOAllocationService.calculate_allocation_from_batches(
        product_id=prod_id,
        batches=[batch],
        requested_quantity=15,
    )

    # Only 10 units are sellable (50 - 40)
    assert result.is_fully_allocated is False
    assert result.total_allocated == 10
    assert result.shortfall == 5
    assert result.batches[0].allocated_quantity == 10


def test_fefo_detects_insufficient_stock():
    """Verify that shortage detection correctly flags partial fulfillment."""
    prod_id = uuid.uuid4()
    batch = make_test_batch(prod_id, "BATCH-LIMITED", days_to_expiry=90, available_qty=8)

    result = FEFOAllocationService.calculate_allocation_from_batches(
        product_id=prod_id,
        batches=[batch],
        requested_quantity=20,
    )

    assert result.is_fully_allocated is False
    assert result.total_allocated == 8
    assert result.shortfall == 12


def test_fefo_invalid_requested_quantity_raises_value_error():
    """Verify that zero or negative requested quantity raises ValueError."""
    prod_id = uuid.uuid4()
    with pytest.raises(ValueError, match="strictly positive"):
        FEFOAllocationService.calculate_allocation_from_batches(
            product_id=prod_id,
            batches=[],
            requested_quantity=0,
        )

    with pytest.raises(ValueError, match="strictly positive"):
        FEFOAllocationService.calculate_allocation_from_batches(
            product_id=prod_id,
            batches=[],
            requested_quantity=-5,
        )

