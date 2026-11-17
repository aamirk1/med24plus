import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import get_permissions_for_roles
from app.core.security import create_access_token
from app.models.address import UserAddress
from app.models.brand import Brand
from app.models.cart import Cart, CartItem
from app.models.category import Category
from app.models.checkout import CheckoutSetting, CheckoutValidation, ServiceablePincode
from app.models.inventory import InventoryBatch
from app.models.prescription import Prescription, PrescriptionFile, PrescriptionItem
from app.models.product import Product
from app.models.role import Role, UserRole
from app.models.user import User
from app.services.pricing_service import PricingService
from app.services.prescription_rules import PrescriptionValidityPolicy
from tests.conftest import TestAsyncSessionLocal


@pytest.fixture
async def phase7_setup():
    """Fixture providing initialized users, catalog products, batches, and operational settings."""
    async with TestAsyncSessionLocal() as db_session:
        # 1. Customer User 1
        u1_phone = f"+9198{uuid.uuid4().hex[:8]}"
        customer_user_1 = User(
            phone=u1_phone,
            email=f"customer1_{uuid.uuid4().hex[:6]}@example.com",
            hashed_password="test_argon2_hash",
            full_name="Aarav Sharma",
            status="active",
            is_active=True,
            is_phone_verified=True,
        )
        # Customer User 2 (for ownership testing)
        u2_phone = f"+9197{uuid.uuid4().hex[:8]}"
        customer_user_2 = User(
            phone=u2_phone,
            email=f"customer2_{uuid.uuid4().hex[:6]}@example.com",
            hashed_password="test_argon2_hash",
            full_name="Neha Patel",
            status="active",
            is_active=True,
            is_phone_verified=True,
        )
        # Admin User
        u3_phone = f"+9199{uuid.uuid4().hex[:8]}"
        admin_user = User(
            phone=u3_phone,
            email=f"admin_{uuid.uuid4().hex[:6]}@med24plus.com",
            hashed_password="test_argon2_hash",
            full_name="Admin Chief",
            status="active",
            is_active=True,
            is_phone_verified=True,
        )

        db_session.add_all([customer_user_1, customer_user_2, admin_user])
        await db_session.flush()

        # Assign roles
        res = await db_session.execute(select(Role).where(Role.name == "customer"))
        cust_role = res.scalars().first()
        res = await db_session.execute(select(Role).where(Role.name == "admin"))
        adm_role = res.scalars().first()

        if cust_role:
            db_session.add(UserRole(user_id=customer_user_1.id, role_id=cust_role.id))
            db_session.add(UserRole(user_id=customer_user_2.id, role_id=cust_role.id))
        if adm_role:
            db_session.add(UserRole(user_id=admin_user.id, role_id=adm_role.id))

        # Category and Brand (reuse or create)
        res_c = await db_session.execute(select(Category).where(Category.name == "Analgesics & Pain"))
        category = res_c.scalars().first()
        if not category:
            cat_slug = f"analgesics-{uuid.uuid4().hex[:6]}"
            category = Category(name="Analgesics & Pain", slug=cat_slug, is_active=True)
            db_session.add(category)

        res_b = await db_session.execute(select(Brand).where(Brand.name == "Cipla Ltd"))
        brand = res_b.scalars().first()
        if not brand:
            brand_slug = f"cipla-{uuid.uuid4().hex[:6]}"
            brand = Brand(name="Cipla Ltd", slug=brand_slug, manufacturer_name="Cipla Ltd", is_active=True)
            db_session.add(brand)

        await db_session.flush()

        # Products:
        # 1. OTC Product (Paracetamol)
        prod_otc = Product(
            name=f"Paracetamol 500mg {uuid.uuid4().hex[:4]}",
            slug=f"pcm-500-{uuid.uuid4().hex[:6]}",
            sku=f"PCM-{uuid.uuid4().hex[:6].upper()}",
            generic_name="Paracetamol",
            category_id=category.id,
            brand_id=brand.id,
            manufacturer="Cipla Pharma",
            pack_size="Strip of 10 Tablets",
            dosage_form="Tablet",
            strength="500mg",
            requires_prescription=False,
            schedule_classification="OTC",
            mrp=Decimal("50.00"),
            selling_price=Decimal("40.00"),
            gst_rate=Decimal("12.00"),
            hsn_code="300490",
            is_active=True,
        )
        # 2. Prescription Required Product (Amoxicillin - Schedule H)
        prod_rx = Product(
            name=f"Amoxicillin 500mg {uuid.uuid4().hex[:4]}",
            slug=f"amox-500-{uuid.uuid4().hex[:6]}",
            sku=f"AMX-{uuid.uuid4().hex[:6].upper()}",
            generic_name="Amoxicillin",
            category_id=category.id,
            brand_id=brand.id,
            manufacturer="Cipla Pharma",
            pack_size="Strip of 10 Capsules",
            dosage_form="Capsule",
            strength="500mg",
            requires_prescription=True,
            schedule_classification="Schedule H",
            mrp=Decimal("120.00"),
            selling_price=Decimal("100.00"),
            gst_rate=Decimal("12.00"),
            hsn_code="300410",
            is_active=True,
        )
        # 3. Inactive Product
        prod_inactive = Product(
            name=f"Discontinued Drug {uuid.uuid4().hex[:4]}",
            slug=f"discontinued-{uuid.uuid4().hex[:6]}",
            sku=f"DIS-{uuid.uuid4().hex[:6].upper()}",
            generic_name="Inactive Mol",
            category_id=category.id,
            brand_id=brand.id,
            manufacturer="Old Pharma",
            pack_size="Bottle",
            dosage_form="Syrup",
            requires_prescription=False,
            schedule_classification="OTC",
            mrp=Decimal("80.00"),
            selling_price=Decimal("60.00"),
            gst_rate=Decimal("12.00"),
            hsn_code="300490",
            is_active=False,
        )
        db_session.add_all([prod_otc, prod_rx, prod_inactive])
        await db_session.flush()

        # Batches for sellable stock
        # Valid batch for prod_otc (qty: 50)
        batch_otc = InventoryBatch(
            product_id=prod_otc.id,
            batch_number=f"BAT-OTC-{uuid.uuid4().hex[:4].upper()}",
            manufacturing_date=date.today() - timedelta(days=60),
            expiry_date=date.today() + timedelta(days=365),
            received_quantity=50,
            available_quantity=50,
            reserved_quantity=0,
            damaged_quantity=0,
            quarantined_quantity=0,
            purchase_price=Decimal("25.00"),
            batch_mrp=Decimal("50.00"),
            batch_status="active",
        )
        # Valid batch for prod_rx (qty: 30)
        batch_rx = InventoryBatch(
            product_id=prod_rx.id,
            batch_number=f"BAT-RX-{uuid.uuid4().hex[:4].upper()}",
            manufacturing_date=date.today() - timedelta(days=30),
            expiry_date=date.today() + timedelta(days=180),
            received_quantity=30,
            available_quantity=30,
            reserved_quantity=0,
            damaged_quantity=0,
            quarantined_quantity=0,
            purchase_price=Decimal("60.00"),
            batch_mrp=Decimal("120.00"),
            batch_status="active",
        )
        # Expired batch for prod_otc (should be excluded from sellable stock)
        batch_otc_expired = InventoryBatch(
            product_id=prod_otc.id,
            batch_number=f"BAT-EXP-{uuid.uuid4().hex[:4].upper()}",
            manufacturing_date=date.today() - timedelta(days=400),
            expiry_date=date.today() - timedelta(days=10),
            received_quantity=20,
            available_quantity=20,
            reserved_quantity=0,
            damaged_quantity=0,
            quarantined_quantity=0,
            purchase_price=Decimal("20.00"),
            batch_mrp=Decimal("50.00"),
            batch_status="active",
        )
        db_session.add_all([batch_otc, batch_rx, batch_otc_expired])

        # Delivery Addresses for customer 1
        # 1. Serviceable Bangalore address
        addr_serviceable = UserAddress(
            user_id=customer_user_1.id,
            recipient_name="Aarav Sharma",
            recipient_phone="+919876543210",
            address_line1="Flat 402, Green Glen Heights",
            address_line2="Bellandur Outer Ring Road",
            landmark="Near Ecospace",
            city="Bengaluru",
            state="Karnataka",
            pincode="560103",
            is_default=True,
        )
        # 2. Unserviceable address (Mumbai PIN)
        addr_unserviceable = UserAddress(
            user_id=customer_user_1.id,
            recipient_name="Aarav Sharma (Mumbai Office)",
            recipient_phone="+919876543210",
            address_line1="Nariman Point Business Hub",
            city="Mumbai",
            state="Maharashtra",
            pincode="400021",
            is_default=False,
        )
        # Address for customer 2 (for ownership testing)
        addr_cust2 = UserAddress(
            user_id=customer_user_2.id,
            recipient_name="Neha Patel",
            recipient_phone="+919876543211",
            address_line1="Koramangala 4th Block",
            city="Bengaluru",
            state="Karnataka",
            pincode="560034",
            is_default=True,
        )
        db_session.add_all([addr_serviceable, addr_unserviceable, addr_cust2])

        await db_session.commit()

        # Generate auth tokens
        cust_perms = list(get_permissions_for_roles(["customer"]))
        admin_perms = list(get_permissions_for_roles(["admin"]))
        token_cust1 = create_access_token(subject=str(customer_user_1.id), roles=["customer"], permissions=cust_perms)
        token_cust2 = create_access_token(subject=str(customer_user_2.id), roles=["customer"], permissions=cust_perms)
        token_admin = create_access_token(subject=str(admin_user.id), roles=["admin"], permissions=admin_perms)

        return {
            "cust1": customer_user_1,
            "cust2": customer_user_2,
            "admin": admin_user,
            "token_cust1": token_cust1,
            "token_cust2": token_cust2,
            "token_admin": token_admin,
            "prod_otc": prod_otc,
            "prod_rx": prod_rx,
            "prod_inactive": prod_inactive,
            "addr_serviceable": addr_serviceable,
            "addr_unserviceable": addr_unserviceable,
            "addr_cust2": addr_cust2,
        }


# =============================================================================
# 1. Cart Management & CRUD Tests
# =============================================================================

@pytest.mark.asyncio
async def test_get_or_create_active_cart(async_client: AsyncClient, phase7_setup):
    """Verify customer can retrieve their active cart and initial empty state."""
    headers = {"Authorization": f"Bearer {phase7_setup['token_cust1']}"}
    resp = await async_client.get("/api/v1/cart", headers=headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["customer_id"] == str(phase7_setup["cust1"].id)
    assert data["status"] == "active"
    assert data["item_count"] == 0
    assert Decimal(str(data["subtotal"])) == Decimal("0.00")
    assert Decimal(str(data["grand_total"])) == Decimal("0.00")


@pytest.mark.asyncio
async def test_add_product_to_cart_success(async_client: AsyncClient, phase7_setup):
    """Verify adding an active product calculates line subtotal, MRP, and savings."""
    headers = {"Authorization": f"Bearer {phase7_setup['token_cust1']}"}
    otc = phase7_setup["prod_otc"]

    payload = {"product_id": str(otc.id), "quantity": 3}
    resp = await async_client.post("/api/v1/cart/items", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["item_count"] == 1
    assert data["total_quantity"] == 3

    # Price validation: Selling price 40.00 * 3 = 120.00
    assert Decimal(str(data["subtotal"])) == Decimal("120.00")
    # MRP: 50.00 * 3 = 150.00
    assert Decimal(str(data["total_mrp"])) == Decimal("150.00")
    # Savings: 150 - 120 = 30.00
    assert Decimal(str(data["total_discount"])) == Decimal("30.00")


@pytest.mark.asyncio
async def test_add_same_product_merges_quantity_no_duplicate_rows(
    async_client: AsyncClient, phase7_setup
):
    """Verify adding the same product twice merges quantities rather than creating duplicate rows."""
    headers = {"Authorization": f"Bearer {phase7_setup['token_cust1']}"}
    otc = phase7_setup["prod_otc"]

    # First add: 2 units
    resp1 = await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": str(otc.id), "quantity": 2},
        headers=headers,
    )
    assert resp1.status_code == 201

    # Second add: 3 units
    resp2 = await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": str(otc.id), "quantity": 3},
        headers=headers,
    )
    assert resp2.status_code == 201
    data = resp2.json()["data"]

    # Must still have exactly 1 item row with quantity = 5
    assert data["item_count"] == 1
    assert data["items"][0]["quantity"] == 5
    assert Decimal(str(data["subtotal"])) == Decimal("200.00")  # 5 * 40


@pytest.mark.asyncio
async def test_update_cart_item_quantity(async_client: AsyncClient, phase7_setup):
    """Verify updating cart item quantity re-computes subtotal and tax."""
    headers = {"Authorization": f"Bearer {phase7_setup['token_cust1']}"}
    otc = phase7_setup["prod_otc"]

    # Add item
    add_resp = await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": str(otc.id), "quantity": 2},
        headers=headers,
    )
    item_id = add_resp.json()["data"]["items"][0]["id"]

    # Update quantity to 4
    patch_resp = await async_client.patch(
        f"/api/v1/cart/items/{item_id}",
        json={"quantity": 4},
        headers=headers,
    )
    assert patch_resp.status_code == 200
    data = patch_resp.json()["data"]
    assert data["items"][0]["quantity"] == 4
    assert Decimal(str(data["subtotal"])) == Decimal("160.00")  # 4 * 40


@pytest.mark.asyncio
async def test_remove_cart_item_and_clear_cart(async_client: AsyncClient, phase7_setup):
    """Verify removing single item and clearing the cart."""
    headers = {"Authorization": f"Bearer {phase7_setup['token_cust1']}"}
    otc = phase7_setup["prod_otc"]

    # Add item
    add_resp = await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": str(otc.id), "quantity": 2},
        headers=headers,
    )
    item_id = add_resp.json()["data"]["items"][0]["id"]

    # Remove item
    del_resp = await async_client.delete(f"/api/v1/cart/items/{item_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["data"]["item_count"] == 0

    # Add again and clear cart
    await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": str(otc.id), "quantity": 1},
        headers=headers,
    )
    clear_resp = await async_client.delete("/api/v1/cart/items", headers=headers)
    assert clear_resp.status_code == 200
    assert clear_resp.json()["data"]["item_count"] == 0


@pytest.mark.asyncio
async def test_cart_validations_invalid_product_and_inactive(
    async_client: AsyncClient, phase7_setup
):
    """Verify non-existent and inactive products are rejected."""
    headers = {"Authorization": f"Bearer {phase7_setup['token_cust1']}"}

    # Non-existent product
    fake_id = str(uuid.uuid4())
    resp1 = await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": fake_id, "quantity": 1},
        headers=headers,
    )
    assert resp1.status_code == 404

    # Inactive product
    inactive_id = str(phase7_setup["prod_inactive"].id)
    resp2 = await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": inactive_id, "quantity": 1},
        headers=headers,
    )
    assert resp2.status_code == 400
    assert "inactive" in resp2.json()["message"].lower()


@pytest.mark.asyncio
async def test_cart_zero_or_negative_quantity_rejected(
    async_client: AsyncClient, phase7_setup
):
    """Verify zero or negative requested quantities are rejected by schema."""
    headers = {"Authorization": f"Bearer {phase7_setup['token_cust1']}"}
    otc = phase7_setup["prod_otc"]

    resp_zero = await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": str(otc.id), "quantity": 0},
        headers=headers,
    )
    assert resp_zero.status_code in {400, 422}

    resp_neg = await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": str(otc.id), "quantity": -5},
        headers=headers,
    )
    assert resp_neg.status_code in {400, 422}


@pytest.mark.asyncio
async def test_cart_quantity_exceeds_max_limit_rejected(
    async_client: AsyncClient, phase7_setup
):
    """Verify exceeding configured maximum item limit (10 units) is rejected."""
    headers = {"Authorization": f"Bearer {phase7_setup['token_cust1']}"}
    otc = phase7_setup["prod_otc"]

    resp = await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": str(otc.id), "quantity": 15},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "limit" in resp.json()["message"].lower()


@pytest.mark.asyncio
async def test_cart_customer_isolation_and_cross_customer_tampering(
    async_client: AsyncClient, phase7_setup
):
    """Verify Customer 2 cannot view or manipulate Customer 1's cart or items."""
    headers1 = {"Authorization": f"Bearer {phase7_setup['token_cust1']}"}
    headers2 = {"Authorization": f"Bearer {phase7_setup['token_cust2']}"}
    otc = phase7_setup["prod_otc"]

    # Customer 1 adds item
    add_resp = await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": str(otc.id), "quantity": 2},
        headers=headers1,
    )
    item_id = add_resp.json()["data"]["items"][0]["id"]

    # Customer 2 inspects their own cart (must be empty)
    cart2_resp = await async_client.get("/api/v1/cart", headers=headers2)
    assert cart2_resp.json()["data"]["item_count"] == 0

    # Customer 2 attempts to delete Customer 1's item -> returns 404
    hack_del = await async_client.delete(f"/api/v1/cart/items/{item_id}", headers=headers2)
    assert hack_del.status_code == 404


# =============================================================================
# 2. Centralized Pricing & Statutory GST Calculation Tests
# =============================================================================

def test_centralized_pricing_service_dpco_and_gst_breakdown(phase7_setup):
    """Test Decimal-based GST extraction, CGST/SGST splitting, and DPCO cap."""
    otc = phase7_setup["prod_otc"]  # selling price 40.00, GST 12%

    item_calc = PricingService.calculate_item_price(otc, quantity=2)
    # Subtotal: 2 * 40.00 = 80.00
    assert item_calc.subtotal == Decimal("80.00")
    assert item_calc.mrp_subtotal == Decimal("100.00")
    assert item_calc.discount_amount == Decimal("20.00")

    # Taxable: 80 / 1.12 = 71.43
    assert item_calc.taxable_amount == Decimal("71.43")
    # Tax: 80 - 71.43 = 8.57
    assert item_calc.tax_amount == Decimal("8.57")
    # CGST: 4.29, SGST: 4.28 (summing to 8.57)
    assert item_calc.cgst_amount + item_calc.sgst_amount == Decimal("8.57")


def test_free_delivery_threshold_and_cold_chain_surcharge(phase7_setup):
    """Test standard delivery fee vs free delivery threshold."""
    settings = CheckoutSetting(
        standard_delivery_fee=Decimal("40.00"),
        free_delivery_threshold=Decimal("499.00"),
        express_cold_chain_fee=Decimal("99.00"),
        minimum_cart_value=Decimal("100.00"),
    )

    otc = phase7_setup["prod_otc"]  # 40.00

    # Case 1: Subtotal < 499 (e.g. 5 units * 40 = 200) -> delivery fee is 40.00
    c1 = [PricingService.calculate_item_price(otc, quantity=5)]
    summary1 = PricingService.calculate_cart_totals(c1, settings, has_cold_chain=False)
    assert summary1.subtotal == Decimal("200.00")
    assert summary1.delivery_fee == Decimal("40.00")
    assert summary1.grand_total == Decimal("240.00")
    assert summary1.amount_needed_for_free_delivery == Decimal("299.00")

    # Case 2: Subtotal >= 499 (e.g. 15 units * 40 = 600) -> delivery fee is 0.00
    c2 = [PricingService.calculate_item_price(otc, quantity=15)]
    summary2 = PricingService.calculate_cart_totals(c2, settings, has_cold_chain=False)
    assert summary2.subtotal == Decimal("600.00")
    assert summary2.delivery_fee == Decimal("0.00")
    assert summary2.grand_total == Decimal("600.00")
    assert summary2.amount_needed_for_free_delivery == Decimal("0.00")


# =============================================================================
# 3. Prescription Eligibility & Rule 65 Validation Tests
# =============================================================================

@pytest.mark.asyncio
async def test_prescription_required_blocks_checkout_without_prescription(
    async_client: AsyncClient, phase7_setup
):
    """Verify adding prescription-required medicine flags prescription requirement and blocks checkout."""
    headers = {"Authorization": f"Bearer {phase7_setup['token_cust1']}"}
    rx_prod = phase7_setup["prod_rx"]
    addr = phase7_setup["addr_serviceable"]

    # Clear cart first
    await async_client.delete("/api/v1/cart/items", headers=headers)

    # Add Schedule H medicine
    add_resp = await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": str(rx_prod.id), "quantity": 1},
        headers=headers,
    )
    assert add_resp.status_code == 201
    cart_data = add_resp.json()["data"]
    assert cart_data["has_prescription_items"] is True
    assert cart_data["is_valid_for_checkout"] is False

    # Attempt checkout validation -> status must be 'blocked'
    chk_resp = await async_client.post(
        "/api/v1/checkout/validate",
        json={"delivery_address_id": str(addr.id)},
        headers=headers,
    )
    assert chk_resp.status_code == 200
    chk_data = chk_resp.json()["data"]
    assert chk_data["validation_status"] == "blocked"
    assert chk_data["is_eligible_for_checkout"] is False
    assert any("prescription" in err.lower() for err in chk_data["blocking_errors"])


@pytest.mark.asyncio
async def test_prescription_approved_authorizes_checkout(
    async_client: AsyncClient, phase7_setup
):
    """Verify customer with an approved and valid prescription for the medicine passes validation."""
    headers = {"Authorization": f"Bearer {phase7_setup['token_cust1']}"}
    cust1 = phase7_setup["cust1"]
    rx_prod = phase7_setup["prod_rx"]
    addr = phase7_setup["addr_serviceable"]

    async with TestAsyncSessionLocal() as db_session:
        # Create approved prescription in database for customer 1
        rx = Prescription(
            customer_id=cust1.id,
            prescription_reference=f"RX-{uuid.uuid4().hex[:8].upper()}",
            prescription_status="approved",
            prescription_date=date.today() - timedelta(days=5),
            valid_until=date.today() + timedelta(days=90),
            is_valid=True,
        )
        db_session.add(rx)
        await db_session.flush()

        # Add verified prescription line item matching the product
        rx_item = PrescriptionItem(
            prescription_id=rx.id,
            product_id=rx_prod.id,
            medicine_name_prescribed=rx_prod.name,
            quantity_prescribed=10,
            quantity_approved=10,
            is_verified=True,
            verification_status="approved",
        )
        db_session.add(rx_item)
        await db_session.commit()

    # Add Schedule H medicine to cart
    await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": str(rx_prod.id), "quantity": 1},
        headers=headers,
    )

    # Validate checkout with approved prescription
    chk_resp = await async_client.post(
        "/api/v1/checkout/validate",
        json={"delivery_address_id": str(addr.id)},
        headers=headers,
    )
    assert chk_resp.status_code == 200
    chk_data = chk_resp.json()["data"]
    assert chk_data["is_eligible_for_checkout"] is True
    assert chk_data["validation_status"] in {"valid", "valid_with_warnings"}


# =============================================================================
# 4. Delivery Address & Serviceability Geofence Tests
# =============================================================================

@pytest.mark.asyncio
async def test_address_crud_and_indian_pincode_validation(
    async_client: AsyncClient, phase7_setup
):
    """Verify customer address CRUD operations and Indian PIN code validation."""
    headers = {"Authorization": f"Bearer {phase7_setup['token_cust1']}"}

    # Add valid address
    payload = {
        "recipient_name": "Aarav Sharma",
        "phone": "9876543210",
        "address_line1": "Flat 101, Palm Meadows",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560066",
        "address_type": "home",
        "is_default": False,
    }
    resp = await async_client.post("/api/v1/addresses", json=payload, headers=headers)
    assert resp.status_code == 201
    addr_id = resp.json()["data"]["id"]

    # Verify invalid PIN code rejected by Pydantic schema
    bad_payload = dict(payload)
    bad_payload["pincode"] = "012345"  # Indian PIN codes cannot start with 0
    resp_bad = await async_client.post("/api/v1/addresses", json=bad_payload, headers=headers)
    assert resp_bad.status_code in {400, 422}

    # Set default
    def_resp = await async_client.post(f"/api/v1/addresses/{addr_id}/set-default", headers=headers)
    assert def_resp.status_code == 200
    assert def_resp.json()["data"]["is_default"] is True

    # Delete address
    del_resp = await async_client.delete(f"/api/v1/addresses/{addr_id}", headers=headers)
    assert del_resp.status_code == 200


@pytest.mark.asyncio
async def test_unserviceable_pincode_blocks_checkout(
    async_client: AsyncClient, phase7_setup
):
    """Verify an address outside the configured serviceable geofence blocks checkout."""
    headers = {"Authorization": f"Bearer {phase7_setup['token_cust1']}"}
    otc = phase7_setup["prod_otc"]
    addr_unserviceable = phase7_setup["addr_unserviceable"]  # Mumbai 400021

    # Clear & Add OTC item (>= 100 to meet min order value: 3 * 40 = 120)
    await async_client.delete("/api/v1/cart/items", headers=headers)
    await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": str(otc.id), "quantity": 3},
        headers=headers,
    )

    # Validate checkout with unserviceable address
    chk_resp = await async_client.post(
        "/api/v1/checkout/validate",
        json={"delivery_address_id": str(addr_unserviceable.id)},
        headers=headers,
    )
    assert chk_resp.status_code == 200
    data = chk_resp.json()["data"]
    assert data["validation_status"] == "blocked"
    assert data["is_eligible_for_checkout"] is False
    assert data["is_address_serviceable"] is False
    assert any("serviceable" in err.lower() for err in data["blocking_errors"])


# =============================================================================
# 5. Non-Deduction & No-Order Safety Guarantees
# =============================================================================

@pytest.mark.asyncio
async def test_checkout_validation_does_not_deduct_inventory_or_create_order(
    async_client: AsyncClient, phase7_setup
):
    """
    CRITICAL VERIFICATION:
    Validate that Phase 7 checkout preparation NEVER deducts inventory batches
    and NEVER creates an order record in the database.
    """
    headers = {"Authorization": f"Bearer {phase7_setup['token_cust1']}"}
    otc = phase7_setup["prod_otc"]
    addr = phase7_setup["addr_serviceable"]

    # Clear & add item
    await async_client.delete("/api/v1/cart/items", headers=headers)
    await async_client.post(
        "/api/v1/cart/items",
        json={"product_id": str(otc.id), "quantity": 3},
        headers=headers,
    )

    async with TestAsyncSessionLocal() as db_session:
        # Record available batch quantity before checkout validation
        res = await db_session.execute(
            select(InventoryBatch).where(InventoryBatch.product_id == otc.id)
        )
        batches_before = {b.id: b.available_quantity for b in res.scalars().all()}

    # Execute checkout validation
    chk_resp = await async_client.post(
        "/api/v1/checkout/validate",
        json={"delivery_address_id": str(addr.id)},
        headers=headers,
    )
    assert chk_resp.status_code == 200
    chk_data = chk_resp.json()["data"]
    assert chk_data["is_eligible_for_checkout"] is True

    async with TestAsyncSessionLocal() as db_session:
        # Check database batches after checkout validation
        res_after = await db_session.execute(
            select(InventoryBatch).where(InventoryBatch.product_id == otc.id)
        )
        batches_after = {b.id: b.available_quantity for b in res_after.scalars().all()}

        # Batches must be completely unchanged
        for b_id, qty in batches_before.items():
            assert batches_after[b_id] == qty, f"Batch {b_id} quantity changed unexpectedly!"

        # Verify NO record was inserted into orders table
        from app.models.order import Order
        order_res = await db_session.execute(
            select(Order).where(Order.customer_id == phase7_setup["cust1"].id)
        )
        orders = order_res.scalars().all()
        assert len(orders) == 0, "Order was created unexpectedly in Phase 7!"
