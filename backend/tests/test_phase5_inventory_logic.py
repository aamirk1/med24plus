import uuid
from datetime import date, timedelta
from decimal import Decimal
import pytest
from pydantic import ValidationError

from app.schemas.inventory import (
    InventoryBatchBase,
    InventoryBatchCreate,
    StockAdjustmentCreate,
    StockReceiveRequest,
)


def test_batch_expiry_must_be_after_manufacturing_date():
    """Verify batch schema enforces expiry_date > manufacturing_date."""
    today = date.today()
    with pytest.raises(ValidationError, match="strictly after manufacturing date"):
        InventoryBatchCreate(
            product_id=uuid.uuid4(),
            batch_number="INV-001",
            manufacturing_date=today,
            expiry_date=today,  # Same day -> Invalid!
            received_quantity=100,
            purchase_price=Decimal("45.00"),
            batch_mrp=Decimal("80.00"),
        )

    with pytest.raises(ValidationError, match="strictly after manufacturing date"):
        InventoryBatchCreate(
            product_id=uuid.uuid4(),
            batch_number="INV-002",
            manufacturing_date=today,
            expiry_date=today - timedelta(days=10),  # Expired before mfg -> Invalid!
            received_quantity=100,
            purchase_price=Decimal("45.00"),
            batch_mrp=Decimal("80.00"),
        )


def test_stock_receive_request_validation():
    """Verify stock receive schema validates positive quantities and date order."""
    today = date.today()
    # Negative or zero received quantity rejected
    with pytest.raises(ValidationError):
        StockReceiveRequest(
            product_id=uuid.uuid4(),
            batch_number="B1",
            received_quantity=0,
            manufacturing_date=today - timedelta(days=30),
            expiry_date=today + timedelta(days=300),
            purchase_price=Decimal("50.00"),
            batch_mrp=Decimal("90.00"),
        )

    # Valid request
    valid = StockReceiveRequest(
        product_id=uuid.uuid4(),
        batch_number="B1-VALID",
        received_quantity=100,
        manufacturing_date=today - timedelta(days=30),
        expiry_date=today + timedelta(days=300),
        purchase_price=Decimal("50.00"),
        batch_mrp=Decimal("90.00"),
    )
    assert valid.received_quantity == 100
    assert valid.batch_number == "B1-VALID"


def test_stock_adjustment_validation():
    """Verify stock adjustment schema validates required fields and adjustment types."""
    prod_id = uuid.uuid4()
    batch_id = uuid.uuid4()

    valid_adj = StockAdjustmentCreate(
        product_id=prod_id,
        batch_id=batch_id,
        adjustment_type="damaged",
        quantity=5,
        reason="Broken ampoule during rack inspection",
    )
    assert valid_adj.adjustment_type == "damaged"
    assert valid_adj.quantity == 5

    # Zero quantity rejected
    with pytest.raises(ValidationError):
        StockAdjustmentCreate(
            product_id=prod_id,
            batch_id=batch_id,
            adjustment_type="decrease",
            quantity=0,
            reason="Zero adjustment test",
        )


def test_inventory_valuation_decimal_math():
    """Verify valuation calculations use exact Decimal arithmetic without rounding errors."""
    units_1 = 333
    price_1 = Decimal("33.33")
    units_2 = 667
    price_2 = Decimal("66.67")

    # Pure Decimal multiplication and sum
    val_1 = Decimal(units_1) * price_1
    val_2 = Decimal(units_2) * price_2
    total_val = val_1 + val_2

    assert val_1 == Decimal("11098.89")
    assert val_2 == Decimal("44468.89")
    assert total_val == Decimal("55567.78")


def test_expiry_date_categorization():
    """Verify statutory expiry bracket categorization (<=7d, <=15d, <=30d, <=60d, <=90d, expired)."""
    today = date.today()

    def categorize_expiry(exp_date: date) -> str:
        diff = (exp_date - today).days
        if diff <= 0:
            return "expired"
        elif diff <= 7:
            return "7_days"
        elif diff <= 15:
            return "15_days"
        elif diff <= 30:
            return "30_days"
        elif diff <= 60:
            return "60_days"
        elif diff <= 90:
            return "90_days"
        return "safe"

    assert categorize_expiry(today - timedelta(days=1)) == "expired"
    assert categorize_expiry(today) == "expired"
    assert categorize_expiry(today + timedelta(days=5)) == "7_days"
    assert categorize_expiry(today + timedelta(days=12)) == "15_days"
    assert categorize_expiry(today + timedelta(days=25)) == "30_days"
    assert categorize_expiry(today + timedelta(days=50)) == "60_days"
    assert categorize_expiry(today + timedelta(days=80)) == "90_days"
    assert categorize_expiry(today + timedelta(days=120)) == "safe"

