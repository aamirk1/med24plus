import uuid
from datetime import date, timedelta
from decimal import Decimal
import pytest

from app.models.checkout import CheckoutSetting
from app.models.product import Product
from app.schemas.address import AddressCreate, AddressUpdate
from app.schemas.serviceability import ServiceablePincodeCreate
from app.services.pricing_service import PricingService
from app.services.prescription_rules import PrescriptionValidityPolicy


def test_pricing_service_single_item_dpco_cap_and_gst_extraction():
    """Verify DPCO price cap enforcement and statutory 12% GST extraction from inclusive price."""
    product = Product(
        name="Paracetamol 500mg Tablets",
        slug="pcm-500",
        sku="PCM-500",
        generic_name="Paracetamol",
        pack_size="Strip of 10 Tablets",
        dosage_form="Tablet",
        mrp=Decimal("50.00"),
        selling_price=Decimal("40.00"),
        gst_rate=Decimal("12.00"),
        is_active=True,
    )

    # Calculate for 2 units
    calc = PricingService.calculate_item_price(product, quantity=2)
    assert calc.unit_price == Decimal("40.00")
    assert calc.unit_mrp == Decimal("50.00")
    assert calc.subtotal == Decimal("80.00")
    assert calc.line_total == Decimal("80.00")
    assert calc.mrp_subtotal == Decimal("100.00")
    assert calc.discount_amount == Decimal("20.00")

    # Taxable = 80 / 1.12 = 71.43
    assert calc.taxable_amount == Decimal("71.43")
    # Tax = 80 - 71.43 = 8.57
    assert calc.tax_amount == Decimal("8.57")
    assert calc.cgst_amount == Decimal("4.29")
    assert calc.sgst_amount == Decimal("4.28")
    assert calc.cgst_amount + calc.sgst_amount == Decimal("8.57")
    assert calc.igst_amount == Decimal("0.00")


def test_pricing_service_interstate_igst_calculation():
    """Verify inter-state supply directs entire GST to IGST."""
    product = Product(
        name="Antacid Liquid",
        slug="antacid-200ml",
        sku="ANT-200",
        generic_name="Antacid",
        pack_size="200ml Bottle",
        dosage_form="Syrup",
        mrp=Decimal("100.00"),
        selling_price=Decimal("90.00"),
        gst_rate=Decimal("18.00"),
        is_active=True,
    )

    calc = PricingService.calculate_item_price(product, quantity=1, is_interstate=True)
    assert calc.subtotal == Decimal("90.00")
    assert calc.cgst_amount == Decimal("0.00")
    assert calc.sgst_amount == Decimal("0.00")
    # Taxable = 90 / 1.18 = 76.27, Tax = 13.73
    assert calc.taxable_amount == Decimal("76.27")
    assert calc.igst_amount == Decimal("13.73")
    assert calc.tax_amount == Decimal("13.73")


def test_pricing_service_selling_price_exceeding_mrp_is_strictly_capped():
    """Statutory DPCO protection: selling price must never exceed MRP."""
    product = Product(
        name="Price Anomaly Drug",
        slug="price-anomaly",
        sku="ANO-001",
        generic_name="Test Drug",
        pack_size="Box",
        dosage_form="Tablet",
        mrp=Decimal("50.00"),
        selling_price=Decimal("60.00"),  # Client/catalog anomaly: selling price > MRP
        gst_rate=Decimal("5.00"),
        is_active=True,
    )

    calc = PricingService.calculate_item_price(product, quantity=1)
    assert calc.unit_price == Decimal("50.00"), "Selling price must be capped at statutory MRP!"
    assert calc.subtotal == Decimal("50.00")


def test_cart_totals_free_delivery_threshold_and_surcharge():
    """Test delivery fee matrix: standard fee vs free delivery tier."""
    settings = CheckoutSetting(
        standard_delivery_fee=Decimal("40.00"),
        free_delivery_threshold=Decimal("499.00"),
        express_cold_chain_fee=Decimal("99.00"),
        minimum_cart_value=Decimal("100.00"),
    )

    p1 = Product(
        name="Medicine A",
        slug="med-a",
        sku="MED-A",
        generic_name="Drug A",
        pack_size="Strip",
        dosage_form="Tablet",
        mrp=Decimal("100.00"),
        selling_price=Decimal("80.00"),
        gst_rate=Decimal("12.00"),
        is_active=True,
        is_cold_chain=False,
    )
    p_cold = Product(
        name="Insulin Cartridge",
        slug="insulin-100iu",
        sku="INS-100",
        generic_name="Insulin Human",
        pack_size="3ml Cartridge",
        dosage_form="Injection",
        mrp=Decimal("250.00"),
        selling_price=Decimal("200.00"),
        gst_rate=Decimal("5.00"),
        is_active=True,
        is_cold_chain=True,
    )

    # 1. Cart subtotal = 160 (below 499 threshold, non-cold chain) -> delivery fee = 40.00
    c1 = [PricingService.calculate_item_price(p1, quantity=2)]
    s1 = PricingService.calculate_cart_totals(c1, settings, has_cold_chain=False)
    assert s1.subtotal == Decimal("160.00")
    assert s1.delivery_fee == Decimal("40.00")
    assert s1.grand_total == Decimal("200.00")
    assert s1.amount_needed_for_free_delivery == Decimal("339.00")

    # 2. Cart subtotal = 200 with cold-chain priority item -> delivery fee = 99.00
    c2 = [PricingService.calculate_item_price(p_cold, quantity=1)]
    s2 = PricingService.calculate_cart_totals(c2, settings, has_cold_chain=True)
    assert s2.subtotal == Decimal("200.00")
    assert s2.delivery_fee == Decimal("99.00")
    assert s2.grand_total == Decimal("299.00")

    # 3. Cart subtotal >= 499 (e.g. 3 * 200 = 600) -> free delivery overrides even cold chain
    c3 = [PricingService.calculate_item_price(p_cold, quantity=3)]
    s3 = PricingService.calculate_cart_totals(c3, settings, has_cold_chain=True)
    assert s3.subtotal == Decimal("600.00")
    assert s3.delivery_fee == Decimal("0.00")
    assert s3.grand_total == Decimal("600.00")
    assert s3.amount_needed_for_free_delivery == Decimal("0.00")


def test_prescription_validity_evaluation_policy():
    """Verify Rule 65 validity policy (30 days for Schedule X, 180 days for general)."""
    # 1. Valid non-scheduled prescription
    today = date.today()
    is_valid, reason = PrescriptionValidityPolicy.evaluate_prescription_validity(
        prescription_date=today - timedelta(days=30),
        valid_until=today + timedelta(days=60),
    )
    assert is_valid is True
    assert reason is None

    # 2. Expired valid_until date
    is_valid, reason = PrescriptionValidityPolicy.evaluate_prescription_validity(
        prescription_date=today - timedelta(days=90),
        valid_until=today - timedelta(days=1),
    )
    assert is_valid is False
    assert "expired" in reason.lower()

    # 3. Future prescription date rejected
    is_valid, reason = PrescriptionValidityPolicy.evaluate_prescription_validity(
        prescription_date=today + timedelta(days=2),
        valid_until=today + timedelta(days=90),
    )
    assert is_valid is False
    assert "future" in reason.lower()

    # 4. Schedule X strictly limited to 30 days
    sched_x_prod = Product(
        name="Methylphenidate",
        slug="methylphenidate",
        sku="MPH-10",
        generic_name="Methylphenidate",
        pack_size="Strip",
        dosage_form="Tablet",
        mrp=Decimal("200.00"),
        selling_price=Decimal("180.00"),
        requires_prescription=True,
        schedule_classification="Schedule X",
    )
    # 40 days old Schedule X prescription exceeds 30-day limit
    is_valid, reason = PrescriptionValidityPolicy.evaluate_prescription_validity(
        prescription_date=today - timedelta(days=40),
        valid_until=None,
        associated_products=[sched_x_prod],
    )
    assert is_valid is False
    assert "statutory validity limit" in reason.lower()


def test_indian_pincode_and_mobile_schema_validations():
    """Verify Pydantic input schemas strictly enforce 6-digit Indian PIN codes and 10-digit mobile numbers."""
    # Valid address
    addr = AddressCreate(
        recipient_name="Aarav Sharma",
        phone="9876543210",
        address_line1="123 MG Road",
        city="Bengaluru",
        state="Karnataka",
        pincode="560001",
        address_type="home",
    )
    assert addr.pincode == "560001"
    assert addr.phone == "9876543210"

    # Invalid PIN code starting with 0
    with pytest.raises(ValueError, match="PIN code"):
        AddressCreate(
            recipient_name="Aarav Sharma",
            phone="9876543210",
            address_line1="123 MG Road",
            city="Bengaluru",
            state="Karnataka",
            pincode="060001",
        )

    # Invalid PIN code length (5 digits)
    with pytest.raises(ValueError, match="PIN code"):
        AddressCreate(
            recipient_name="Aarav Sharma",
            phone="9876543210",
            address_line1="123 MG Road",
            city="Bengaluru",
            state="Karnataka",
            pincode="56001",
        )

    # Invalid phone starting with 1
    with pytest.raises(ValueError, match="mobile number"):
        AddressCreate(
            recipient_name="Aarav Sharma",
            phone="1234567890",
            address_line1="123 MG Road",
            city="Bengaluru",
            state="Karnataka",
            pincode="560001",
        )


def test_serviceable_pincode_schema_validation():
    """Verify ServiceablePincodeCreate validates 6-digit PIN codes."""
    pin = ServiceablePincodeCreate(
        pincode="560103",
        area_name="Bellandur",
        city="Bengaluru",
        state="Karnataka",
        estimated_delivery_hours=4,
    )
    assert pin.pincode == "560103"
    assert pin.estimated_delivery_hours == 4

    with pytest.raises(ValueError, match="PIN code"):
        ServiceablePincodeCreate(
            pincode="ABCDEF",
            area_name="Invalid",
        )
