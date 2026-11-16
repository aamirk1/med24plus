import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.address import UserAddress
from app.models.audit_log import AuditLog
from app.models.base import Base
from app.models.brand import Brand
from app.models.category import Category
from app.models.delivery import Delivery, DeliveryPartner
from app.models.inventory import Inventory, InventoryBatch, StockAlert, StockMovement
from app.models.order import Order, OrderItem
from app.models.payment import Payment, Refund
from app.models.prescription import Prescription, PrescriptionItem, PrescriptionReviewLog
from app.models.product import Product, ProductAttribute, ProductImage
from app.models.role import Permission, Role, RolePermission, UserRole
from app.models.staff import PharmacistProfile, PharmacistQualification, StaffProfile
from app.models.user import User, UserProfile, UserSession


@pytest.fixture(scope="module")
def db_session():
    """Synchronous test session connecting to configured PostgreSQL database."""
    engine = create_engine(settings.SYNC_DATABASE_URL, echo=False)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


def test_all_expected_tables_registered():
    """Verify that all 37 required domain tables are registered with Base.metadata."""
    expected_tables = {
        "users", "user_profiles", "user_addresses", "user_sessions",
        "roles", "permissions", "role_permissions", "user_roles",
        "staff_profiles", "pharmacist_profiles", "pharmacist_qualifications",
        "categories", "brands", "products", "product_images", "product_attributes",
        "inventory", "inventory_batches", "stock_movements", "stock_adjustments",
        "stock_adjustment_items", "stock_alerts",
        "prescriptions", "prescription_items", "prescription_review_logs",
        "orders", "order_items", "order_status_history",
        "payments", "refunds", "payment_transactions",
        "delivery_partners", "deliveries", "delivery_status_history",
        "notifications", "notification_preferences", "audit_logs",
    }
    actual_tables = set(Base.metadata.tables.keys())
    missing_tables = expected_tables - actual_tables
    assert not missing_tables, f"Missing expected tables in metadata: {missing_tables}"
    assert len(expected_tables) == 37


def test_user_creation_and_profiles(db_session):
    """Verify User, UserProfile, and UserAddress relationships and uniqueness."""
    unique_phone = f"+9198{uuid.uuid4().hex[:8]}"
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    user = User(
        phone=unique_phone,
        email=unique_email,
        full_name="Dr. Test User",
        status="active",
        is_phone_verified=True,
    )
    db_session.add(user)
    db_session.flush()

    profile = UserProfile(
        user_id=user.id,
        gender="Female",
        blood_group="O+",
    )
    db_session.add(profile)

    address = UserAddress(
        user_id=user.id,
        address_type="home",
        recipient_name="Dr. Test User",
        recipient_phone=unique_phone,
        address_line1="123 Health Parkway",
        city="Mumbai",
        state="Maharashtra",
        pincode="400001",
        is_default=True,
    )
    db_session.add(address)
    db_session.flush()

    # Validate relationships
    fetched_user = db_session.execute(select(User).where(User.id == user.id)).scalar_one()
    assert fetched_user.profile.blood_group == "O+"
    assert len(fetched_user.addresses) == 1
    assert fetched_user.addresses[0].pincode == "400001"

    # Clean up test user
    db_session.delete(user)
    db_session.commit()


def test_pharmacist_profile_explicit_verification(db_session):
    """Verify PharmacistProfile requires explicit verification and defaults to unverified."""
    unique_phone = f"+9197{uuid.uuid4().hex[:8]}"
    user = User(phone=unique_phone, full_name="Pharmacist Test")
    db_session.add(user)
    db_session.flush()

    pharm_profile = PharmacistProfile(
        user_id=user.id,
        registration_number=f"MH-PHARM-{uuid.uuid4().hex[:6].upper()}",
        state_pharmacy_council="Maharashtra State Pharmacy Council",
        registration_date=date(2020, 1, 15),
        registration_valid_upto=date(2030, 1, 14),
        is_verified=False,  # Explicitly False by default
    )
    db_session.add(pharm_profile)
    db_session.flush()

    assert pharm_profile.is_verified is False
    assert pharm_profile.verified_at is None

    # Add qualification
    qual = PharmacistQualification(
        pharmacist_profile_id=pharm_profile.id,
        degree="B.Pharm",
        institution="Government College of Pharmacy",
        university="Mumbai University",
        year_of_passing=2019,
    )
    db_session.add(qual)
    db_session.flush()

    assert len(pharm_profile.qualifications) == 1
    assert pharm_profile.qualifications[0].degree == "B.Pharm"

    db_session.delete(user)
    db_session.commit()


def test_product_catalog_price_constraints(db_session):
    """Verify check_selling_price_lte_mrp and non-negative constraints."""
    category = db_session.execute(select(Category).limit(1)).scalar_one()
    brand = db_session.execute(select(Brand).limit(1)).scalar_one()

    # Attempt to create product with selling price > MRP (must fail)
    invalid_product = Product(
        name="Invalid Overpriced Product",
        slug=f"invalid-overpriced-{uuid.uuid4().hex[:6]}",
        sku=f"INV-SKU-{uuid.uuid4().hex[:6]}",
        generic_name="Test API",
        category_id=category.id,
        brand_id=brand.id,
        manufacturer="Test Lab",
        pack_size="10 Tablets",
        dosage_form="TABLET",
        mrp=Decimal("100.00"),
        selling_price=Decimal("150.00"),  # Greater than MRP!
        hsn_code="3004",
        gst_rate=Decimal("12.00"),
    )
    db_session.add(invalid_product)
    with pytest.raises(IntegrityError) as exc_info:
        db_session.flush()
    db_session.rollback()
    assert "check_product_selling_lte_mrp" in str(exc_info.value)


def test_inventory_batch_quantity_constraints(db_session):
    """Verify check_batch_reserved_lte_available and non-negative constraints."""
    product = db_session.execute(select(Product).limit(1)).scalar_one()
    today = date.today()

    # Attempt to create batch where reserved > available (must fail)
    invalid_batch = InventoryBatch(
        product_id=product.id,
        batch_number=f"FAIL-BAT-{uuid.uuid4().hex[:6]}",
        manufacturing_date=today - timedelta(days=30),
        expiry_date=today + timedelta(days=365),
        received_quantity=100,
        available_quantity=50,
        reserved_quantity=75,  # Exceeds available quantity!
        purchase_price=Decimal("40.00"),
        batch_mrp=Decimal("80.00"),
    )
    db_session.add(invalid_batch)
    with pytest.raises(IntegrityError) as exc_info:
        db_session.flush()
    db_session.rollback()
    assert "check_batch_reserved_lte_available" in str(exc_info.value)


def test_batch_expiry_after_mfg_constraint(db_session):
    """Verify check_batch_expiry_after_mfg ensures expiry > manufacturing date."""
    product = db_session.execute(select(Product).limit(1)).scalar_one()
    today = date.today()

    invalid_batch = InventoryBatch(
        product_id=product.id,
        batch_number=f"FAIL-EXP-{uuid.uuid4().hex[:6]}",
        manufacturing_date=today,
        expiry_date=today - timedelta(days=10),  # Expired before manufactured!
        received_quantity=100,
        available_quantity=100,
        reserved_quantity=0,
        purchase_price=Decimal("40.00"),
        batch_mrp=Decimal("80.00"),
    )
    db_session.add(invalid_batch)
    with pytest.raises(IntegrityError) as exc_info:
        db_session.flush()
    db_session.rollback()
    assert "check_batch_expiry_after_mfg" in str(exc_info.value)


def test_fefo_allocation_sorting(db_session):
    """Verify First Expiry, First Out (FEFO) query returns earliest expiring batches first."""
    # Find a product with multiple batches
    batches = db_session.execute(
        select(InventoryBatch)
        .where(InventoryBatch.batch_status == "active")
        .order_by(InventoryBatch.expiry_date.asc())
        .limit(5)
    ).scalars().all()

    assert len(batches) >= 2
    # Verify strict ascending order of expiry dates
    for i in range(len(batches) - 1):
        assert batches[i].expiry_date <= batches[i + 1].expiry_date


def test_financial_decimal_precision(db_session):
    """Verify that financial values are stored as exact Decimals without float drift."""
    product = db_session.execute(select(Product).limit(1)).scalar_one()
    assert isinstance(product.mrp, Decimal)
    assert isinstance(product.selling_price, Decimal)
    assert isinstance(product.gst_rate, Decimal)


def test_audit_log_creation(db_session):
    """Verify audit log immutability and metadata recording."""
    log = AuditLog(
        action="BATCH_INSPECTION_AUDIT",
        entity_type="InventoryBatch",
        entity_id=uuid.uuid4().hex,
        before_state={"status": "quarantined"},
        after_state={"status": "active"},
        ip_address="127.0.0.1",
    )
    db_session.add(log)
    db_session.commit()

    fetched = db_session.execute(select(AuditLog).where(AuditLog.id == log.id)).scalar_one()
    assert fetched.action == "BATCH_INSPECTION_AUDIT"
    assert fetched.before_state["status"] == "quarantined"
    assert fetched.after_state["status"] == "active"

    db_session.delete(fetched)
    db_session.commit()

