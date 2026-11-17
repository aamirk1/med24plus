import hashlib
import json
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.core.permissions import RoleEnum
from app.models.inventory import Inventory, InventoryBatch, StockMovement
from app.models.order import (
    Invoice,
    InventoryReservation,
    Order,
    OrderBatchAllocation,
    OrderCancellation,
    OrderIdempotencyRecord,
    OrderItem,
    OrderStatusHistory,
)
from app.models.product import Product
from app.models.staff import PharmacistProfile
from app.models.user import User
from app.modules.orders.services.inventory_reservation_service import (
    InventoryReservationService,
    ReservationError,
)
from app.modules.orders.services.invoice_service import (
    InvoiceConfigurationError,
    InvoiceService,
)
from app.modules.orders.services.order_cancellation_service import OrderCancellationService
from app.modules.orders.services.order_creation_service import OrderCreationService
from app.modules.orders.services.order_state_machine import (
    InvalidOrderStateTransition,
    OrderStateMachine,
)
from app.modules.orders.services.pdf_invoice_generator import PDFInvoiceGenerator
from app.modules.orders.services.pharmacist_review_service import PharmacistReviewService
from app.modules.orders.utils.number_generators import (
    generate_invoice_number,
    generate_order_number,
)
from app.schemas.order import OrderCancelRequest, OrderCreateRequest
from app.services.fefo_allocation_service import (
    FEFOAllocationService,
    InsufficientStockError,
    fefo_allocation_service,
)
from fastapi import HTTPException


# =============================================================================
# 1. Number Generation & Idempotency Digest Tests
# =============================================================================

def test_order_and_invoice_number_generator():
    """Verify unique, non-guessable number format for orders and invoices."""
    order_num = generate_order_number()
    invoice_num = generate_invoice_number()

    assert order_num.startswith("ORD-")
    assert len(order_num) == 19  # ORD-YYYYMMDD-XXXXXX
    assert invoice_num.startswith("INV-")
    assert len(invoice_num) == 19  # INV-YYYYMMDD-XXXXXX

    # Uniqueness
    assert generate_order_number() != generate_order_number()
    assert generate_invoice_number() != generate_invoice_number()


def test_idempotency_request_hash_determinism_and_tamper_detection():
    """Verify SHA-256 hash is deterministic regardless of key order and detects tamper."""
    addr_id = uuid.uuid4()
    p1 = {"delivery_address_id": str(addr_id), "customer_notes": "Urgent", "acknowledge_price_changes": False}
    p2 = {"acknowledge_price_changes": False, "customer_notes": "Urgent", "delivery_address_id": str(addr_id)}
    p3 = {"delivery_address_id": str(addr_id), "customer_notes": "Standard", "acknowledge_price_changes": False}

    h1 = OrderCreationService.compute_request_hash(p1)
    h2 = OrderCreationService.compute_request_hash(p2)
    h3 = OrderCreationService.compute_request_hash(p3)

    assert h1 == h2  # Order-independent
    assert h1 != h3  # Tamper detected


# =============================================================================
# 2. FEFO Batch Allocation & Multi-Batch Splitting Tests
# =============================================================================

def make_batch(prod_id: uuid.UUID, batch_no: str, days_exp: int, avail: int, res: int = 0, status: str = "active") -> InventoryBatch:
    today = date.today()
    return InventoryBatch(
        id=uuid.uuid4(),
        product_id=prod_id,
        batch_number=batch_no,
        manufacturing_date=today - timedelta(days=90),
        expiry_date=today + timedelta(days=days_exp),
        received_quantity=avail + res,
        available_quantity=avail,
        reserved_quantity=res,
        damaged_quantity=0,
        quarantined_quantity=0,
        purchase_price=Decimal("40.00"),
        batch_mrp=Decimal("80.00"),
        batch_status=status,
    )


def test_fefo_allocation_earliest_expiry_first():
    """Verify earliest expiry batch is allocated first."""
    prod_id = uuid.uuid4()
    b1 = make_batch(prod_id, "BATCH-2027-01", days_exp=60, avail=10)
    b2 = make_batch(prod_id, "BATCH-2027-06", days_exp=180, avail=20)
    b3 = make_batch(prod_id, "BATCH-2026-12", days_exp=30, avail=5)  # Earliest

    res = fefo_allocation_service.calculate_allocation_from_batches(
        product_id=prod_id,
        batches=[b1, b2, b3],
        requested_quantity=12,
    )

    assert res.is_fully_allocated is True
    assert res.total_allocated == 12
    assert len(res.batches) == 2
    # First 5 from b3 (earliest)
    assert res.batches[0].batch_number == "BATCH-2026-12"
    assert res.batches[0].allocated_quantity == 5
    # Remaining 7 from b1
    assert res.batches[1].batch_number == "BATCH-2027-01"
    assert res.batches[1].allocated_quantity == 7


def test_fefo_allocation_excludes_expired_quarantined_damaged():
    """Verify expired, quarantined, and damaged batches are completely excluded from allocation."""
    prod_id = uuid.uuid4()
    today = date.today()
    b_active = make_batch(prod_id, "B-ACTIVE", days_exp=60, avail=10)
    b_expired = make_batch(prod_id, "B-EXPIRED", days_exp=-5, avail=50)  # Expired
    b_quarantine = make_batch(prod_id, "B-QUARANTINE", days_exp=100, avail=50, status="quarantined")
    b_damaged = make_batch(prod_id, "B-DAMAGED", days_exp=100, avail=50, status="damaged")

    res = fefo_allocation_service.calculate_allocation_from_batches(
        product_id=prod_id,
        batches=[b_active, b_expired, b_quarantine, b_damaged],
        requested_quantity=8,
    )

    assert res.is_fully_allocated is True
    assert len(res.batches) == 1
    assert res.batches[0].batch_number == "B-ACTIVE"
    assert res.batches[0].allocated_quantity == 8


def test_fefo_insufficient_stock_detection():
    """Verify insufficient sellable stock returns shortfall and is_fully_allocated=False."""
    prod_id = uuid.uuid4()
    b1 = make_batch(prod_id, "B1", days_exp=30, avail=5, res=2)  # sellable = 3

    res = fefo_allocation_service.calculate_allocation_from_batches(
        product_id=prod_id,
        batches=[b1],
        requested_quantity=10,
    )

    assert res.is_fully_allocated is False
    assert res.total_allocated == 3
    assert res.shortfall == 7


# =============================================================================
# 3. Inventory Reservation Lifecycle Tests
# =============================================================================

@pytest.mark.asyncio
async def test_reservation_creation_and_balance_update():
    """Verify reservation increments reserved_quantity and records double-entry movement."""
    mock_db = MagicMock()
    mock_db.add = MagicMock()
    mock_db.execute = AsyncMock()

    service = InventoryReservationService(mock_db)

    prod_id = uuid.uuid4()
    batch = make_batch(prod_id, "BATCH-RES-1", days_exp=90, avail=20, res=0)
    inventory = Inventory(
        product_id=prod_id,
        total_available_quantity=20,
        total_reserved_quantity=0,
        is_in_stock=True,
    )

    mock_db.execute.side_effect = [
        MagicMock(scalars=MagicMock(return_value=MagicMock(first=MagicMock(return_value=batch)))),
        MagicMock(scalars=MagicMock(return_value=MagicMock(first=MagicMock(return_value=inventory)))),
    ]

    alloc, res = await service.reserve_batch_stock(
        order_id=uuid.uuid4(),
        order_item_id=uuid.uuid4(),
        batch_id=batch.id,
        product_id=prod_id,
        quantity=5,
        acting_user_id=uuid.uuid4(),
    )

    assert alloc.allocated_quantity == 5
    assert res.reserved_quantity == 5
    assert res.status == "active"
    assert batch.reserved_quantity == 5
    assert inventory.total_reserved_quantity == 5

    # Check that StockMovement was added
    added_objects = [call[0][0] for call in mock_db.add.call_args_list]
    movements = [obj for obj in added_objects if isinstance(obj, StockMovement)]
    assert len(movements) == 1
    assert movements[0].movement_type == "STOCK_RESERVED"
    assert movements[0].quantity == 5
    assert movements[0].balance_after == 15  # 20 - 5


@pytest.mark.asyncio
async def test_reservation_release_restores_available_stock():
    """Verify release_reservations restores reserved quantities and marks status released."""
    mock_db = MagicMock()
    mock_db.add = MagicMock()
    mock_db.execute = AsyncMock()

    service = InventoryReservationService(mock_db)

    order_id = uuid.uuid4()
    prod_id = uuid.uuid4()
    batch = make_batch(prod_id, "BATCH-REL-1", days_exp=90, avail=20, res=5)
    inventory = Inventory(
        product_id=prod_id,
        total_available_quantity=20,
        total_reserved_quantity=5,
        is_in_stock=True,
    )

    reservation = InventoryReservation(
        id=uuid.uuid4(),
        order_id=order_id,
        order_item_id=uuid.uuid4(),
        batch_id=batch.id,
        reserved_quantity=5,
        released_quantity=0,
        consumed_quantity=0,
        status="active",
        reserved_at=datetime.now(timezone.utc),
    )

    alloc = OrderBatchAllocation(
        id=uuid.uuid4(),
        order_id=order_id,
        order_item_id=reservation.order_item_id,
        batch_id=batch.id,
        allocated_quantity=5,
        released_quantity=0,
        consumed_quantity=0,
        allocation_status="allocated",
    )

    mock_db.execute.side_effect = [
        MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[reservation])))),
        MagicMock(scalars=MagicMock(return_value=MagicMock(first=MagicMock(return_value=batch)))),
        MagicMock(scalars=MagicMock(return_value=MagicMock(first=MagicMock(return_value=inventory)))),
        MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[alloc])))),
    ]

    released_qty = await service.release_reservations_for_order(order_id, reason="Customer cancelled")

    assert released_qty == 5
    assert reservation.status == "released"
    assert reservation.released_quantity == 5
    assert batch.reserved_quantity == 0
    assert inventory.total_reserved_quantity == 0
    assert alloc.allocation_status == "released"

    added_objects = [call[0][0] for call in mock_db.add.call_args_list]
    movements = [obj for obj in added_objects if isinstance(obj, StockMovement)]
    assert len(movements) == 1
    assert movements[0].movement_type == "RESERVATION_RELEASED"
    assert movements[0].quantity == 5


@pytest.mark.asyncio
async def test_reservation_consumption_upon_dispatch():
    """Verify consumption upon dispatch decrements physical batch available_quantity."""
    mock_db = MagicMock()
    mock_db.add = MagicMock()
    mock_db.execute = AsyncMock()

    service = InventoryReservationService(mock_db)

    order_id = uuid.uuid4()
    prod_id = uuid.uuid4()
    batch = make_batch(prod_id, "BATCH-CON-1", days_exp=90, avail=20, res=5)
    inventory = Inventory(
        product_id=prod_id,
        total_available_quantity=20,
        total_reserved_quantity=5,
        is_in_stock=True,
    )

    reservation = InventoryReservation(
        id=uuid.uuid4(),
        order_id=order_id,
        order_item_id=uuid.uuid4(),
        batch_id=batch.id,
        reserved_quantity=5,
        released_quantity=0,
        consumed_quantity=0,
        status="active",
        reserved_at=datetime.now(timezone.utc),
    )

    alloc = OrderBatchAllocation(
        id=uuid.uuid4(),
        order_id=order_id,
        order_item_id=reservation.order_item_id,
        batch_id=batch.id,
        allocated_quantity=5,
        released_quantity=0,
        consumed_quantity=0,
        allocation_status="allocated",
    )

    mock_db.execute.side_effect = [
        MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[reservation])))),
        MagicMock(scalars=MagicMock(return_value=MagicMock(first=MagicMock(return_value=batch)))),
        MagicMock(scalars=MagicMock(return_value=MagicMock(first=MagicMock(return_value=inventory)))),
        MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[alloc])))),
    ]

    consumed_qty = await service.consume_reservations_for_order(order_id)

    assert consumed_qty == 5
    assert reservation.status == "consumed"
    assert reservation.consumed_quantity == 5
    assert batch.reserved_quantity == 0
    assert batch.available_quantity == 15  # Decremented by 5
    assert inventory.total_available_quantity == 15
    assert alloc.allocation_status == "consumed"


# =============================================================================
# 4. Order Status State Machine & Security Tests
# =============================================================================

@pytest.mark.asyncio
async def test_order_state_machine_valid_transitions():
    """Verify valid transitions: placed -> pending_payment -> payment_confirmed -> processing -> ready_for_dispatch -> dispatched -> delivered."""
    mock_db = MagicMock()
    mock_db.add = MagicMock()
    mock_db.flush = AsyncMock()

    sm = OrderStateMachine(mock_db)
    sm.res_service = MagicMock()
    sm.res_service.consume_reservations_for_order = AsyncMock(return_value=5)

    admin_user = User(id=uuid.uuid4(), status="active", is_active=True)
    admin_user._cached_roles = [RoleEnum.ADMIN.value]

    order = Order(
        id=uuid.uuid4(),
        order_number="ORD-TEST-001",
        customer_id=uuid.uuid4(),
        status="placed",
        payment_status="paid",  # Paid for dispatch test
        subtotal=Decimal("100.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("12.00"),
        delivery_fee=Decimal("0.00"),
        grand_total=Decimal("112.00"),
        delivery_address_snapshot={},
    )

    # 1. placed -> pending_payment
    order = await sm.transition_order(order, "pending_payment", admin_user)
    assert order.status == "pending_payment"

    # 2. pending_payment -> payment_confirmed
    order = await sm.transition_order(order, "payment_confirmed", admin_user)
    assert order.status == "payment_confirmed"
    assert order.confirmed_at is not None

    # 3. payment_confirmed -> processing
    order = await sm.transition_order(order, "processing", admin_user)
    assert order.status == "processing"

    # 4. processing -> ready_for_dispatch
    order = await sm.transition_order(order, "ready_for_dispatch", admin_user)
    assert order.status == "ready_for_dispatch"

    # 5. ready_for_dispatch -> dispatched
    order = await sm.transition_order(order, "dispatched", admin_user)
    assert order.status == "dispatched"
    sm.res_service.consume_reservations_for_order.assert_called_once()

    # 6. dispatched -> delivered (Terminal)
    order = await sm.transition_order(order, "delivered", admin_user)
    assert order.status == "delivered"
    assert order.completed_at is not None


@pytest.mark.asyncio
async def test_order_state_machine_invalid_transition_rejected():
    """Verify arbitrary status jumping (e.g. placed -> delivered) is rejected with 400 Bad Request."""
    mock_db = MagicMock()
    sm = OrderStateMachine(mock_db)

    admin_user = User(id=uuid.uuid4(), status="active", is_active=True)
    admin_user._cached_roles = [RoleEnum.ADMIN.value]

    order = Order(
        id=uuid.uuid4(),
        order_number="ORD-TEST-002",
        customer_id=uuid.uuid4(),
        status="placed",
        payment_status="pending",
        subtotal=Decimal("100.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("12.00"),
        delivery_fee=Decimal("0.00"),
        grand_total=Decimal("112.00"),
        delivery_address_snapshot={},
    )

    with pytest.raises(InvalidOrderStateTransition):
        await sm.transition_order(order, "delivered", admin_user)


@pytest.mark.asyncio
async def test_customer_cannot_update_operational_status():
    """Verify customers cannot alter order operational statuses (processing, dispatched, etc.)."""
    mock_db = MagicMock()
    sm = OrderStateMachine(mock_db)

    cust_id = uuid.uuid4()
    cust_user = User(id=cust_id, status="active", is_active=True)
    cust_user._cached_roles = [RoleEnum.CUSTOMER.value]

    order = Order(
        id=uuid.uuid4(),
        order_number="ORD-TEST-003",
        customer_id=cust_id,
        status="processing",
        payment_status="paid",
        subtotal=Decimal("100.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("12.00"),
        delivery_fee=Decimal("0.00"),
        grand_total=Decimal("112.00"),
        delivery_address_snapshot={},
    )

    with pytest.raises(HTTPException) as exc_info:
        await sm.transition_order(order, "ready_for_dispatch", cust_user)
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_payment_gating_blocks_dispatch_when_unpaid():
    """Verify Section 10: unverified payment blocks dispatch even for administrators."""
    mock_db = MagicMock()
    sm = OrderStateMachine(mock_db)

    admin_user = User(id=uuid.uuid4(), status="active", is_active=True)
    admin_user._cached_roles = [RoleEnum.ADMIN.value]

    order = Order(
        id=uuid.uuid4(),
        order_number="ORD-TEST-004",
        customer_id=uuid.uuid4(),
        status="ready_for_dispatch",
        payment_status="pending",  # Unpaid!
        subtotal=Decimal("100.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("12.00"),
        delivery_fee=Decimal("0.00"),
        grand_total=Decimal("112.00"),
        delivery_address_snapshot={},
    )

    with pytest.raises(HTTPException) as exc_info:
        await sm.transition_order(order, "dispatched", admin_user)
    assert exc_info.value.status_code == 400
    assert "Verified payment evidence is required" in exc_info.value.detail["message"]


# =============================================================================
# 5. Pharmacist Review & Rule 65 Gating Tests
# =============================================================================

@pytest.mark.asyncio
async def test_unverified_pharmacist_cannot_approve_clinical_order():
    """Verify pharmacist without verified PharmacistProfile is blocked under Rule 65."""
    mock_db = MagicMock()
    service = PharmacistReviewService(mock_db)

    ph_user = User(id=uuid.uuid4(), status="active", is_active=True)
    ph_user._cached_roles = [RoleEnum.PHARMACIST.value]
    ph_user.pharmacist_profile = PharmacistProfile(
        registration_number="REG-12345",
        is_verified=False,  # NOT VERIFIED!
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.approve_order(uuid.uuid4(), ph_user)
    assert exc_info.value.status_code == 403
    assert "pending statutory council verification" in exc_info.value.detail["message"]


@pytest.mark.asyncio
async def test_pharmacist_rejection_mandates_reason_and_releases_stock():
    """Verify pharmacist rejection requires mandatory statutory reason and triggers cancellation."""
    mock_db = MagicMock()
    mock_db.add = MagicMock()
    mock_db.flush = AsyncMock()

    service = PharmacistReviewService(mock_db)
    service.order_repo.get_by_id = AsyncMock()

    ph_user = User(id=uuid.uuid4(), full_name="Sanjay Sharma, R.Ph", status="active", is_active=True)
    ph_user._cached_roles = [RoleEnum.PHARMACIST.value]
    ph_user.pharmacist_profile = PharmacistProfile(
        registration_number="PCI-REG-94821",
        is_verified=True,
    )

    order = Order(
        id=uuid.uuid4(),
        order_number="ORD-PHARM-001",
        customer_id=uuid.uuid4(),
        status="pharmacist_review",
        payment_status="pending",
        subtotal=Decimal("200.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("24.00"),
        delivery_fee=Decimal("0.00"),
        grand_total=Decimal("224.00"),
        delivery_address_snapshot={},
    )
    service.order_repo.get_by_id.return_value = order

    service.state_machine.res_service.release_reservations_for_order = AsyncMock(return_value=2)

    order = await service.reject_order(
        order_id=order.id,
        pharmacist_user=ph_user,
        reason="Prescription dosage exceeds maximum safe therapeutic limit under Rule 65.",
    )

    assert order.status == "rejected"
    # Verify cancellation record created
    added = [call[0][0] for call in mock_db.add.call_args_list]
    cancellations = [o for o in added if isinstance(o, OrderCancellation)]
    assert len(cancellations) == 1
    assert cancellations[0].cancellation_type == "pharmacist_rejected"


# =============================================================================
# 6. Order Cancellation & Post-Dispatch Protections
# =============================================================================

@pytest.mark.asyncio
async def test_cancellation_before_dispatch_releases_reservations():
    """Verify cancellation before dispatch successfully cancels and releases reservations."""
    mock_db = MagicMock()
    mock_db.add = MagicMock()
    mock_db.flush = AsyncMock()

    service = OrderCancellationService(mock_db)
    service.order_repo.get_by_id = AsyncMock()
    service.state_machine.res_service.release_reservations_for_order = AsyncMock(return_value=3)

    cust_id = uuid.uuid4()
    cust_user = User(id=cust_id, status="active", is_active=True)
    cust_user._cached_roles = [RoleEnum.CUSTOMER.value]

    order = Order(
        id=uuid.uuid4(),
        order_number="ORD-CANCEL-001",
        customer_id=cust_id,
        status="placed",
        payment_status="pending",
        subtotal=Decimal("100.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("12.00"),
        delivery_fee=Decimal("0.00"),
        grand_total=Decimal("112.00"),
        delivery_address_snapshot={},
    )
    service.order_repo.get_by_id.return_value = order

    cancelled_order = await service.cancel_order(
        order_id=order.id,
        reason="Patient changed physician prescription",
        acting_user=cust_user,
    )

    assert cancelled_order.status == "cancelled"
    assert cancelled_order.cancelled_at is not None
    service.state_machine.res_service.release_reservations_for_order.assert_called_once()


@pytest.mark.asyncio
async def test_cancellation_after_dispatch_is_strictly_rejected():
    """Verify cancellation after dispatch is rejected (Section 14 & 25)."""
    mock_db = MagicMock()
    service = OrderCancellationService(mock_db)
    service.order_repo.get_by_id = AsyncMock()

    cust_id = uuid.uuid4()
    cust_user = User(id=cust_id, status="active", is_active=True)
    cust_user._cached_roles = [RoleEnum.CUSTOMER.value]

    order = Order(
        id=uuid.uuid4(),
        order_number="ORD-CANCEL-002",
        customer_id=cust_id,
        status="dispatched",  # Already dispatched!
        payment_status="paid",
        subtotal=Decimal("100.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("12.00"),
        delivery_fee=Decimal("0.00"),
        grand_total=Decimal("112.00"),
        delivery_address_snapshot={},
    )
    service.order_repo.get_by_id.return_value = order

    with pytest.raises(HTTPException) as exc_info:
        await service.cancel_order(
            order_id=order.id,
            reason="I changed my mind",
            acting_user=cust_user,
        )
    assert exc_info.value.status_code == 400
    assert "already been dispatched" in exc_info.value.detail["message"]


# =============================================================================
# 7. Invoice PDF Generation & Storage Tests
# =============================================================================

def test_pure_python_pdf_generator_produces_valid_pdf14():
    """Verify PDFInvoiceGenerator produces standard, compliant PDF 1.4 binary stream."""
    now_utc = datetime.now(timezone.utc)
    pdf_bytes = PDFInvoiceGenerator.generate_invoice_pdf(
        invoice_number="INV-20261117-948210",
        order_number="ORD-20261117-948210",
        invoice_date=now_utc,
        pharmacy_details={
            "name": "Med24Plus Retail Pharmacy",
            "dl_number": "DL-KA-BLR-2026-094182",
            "gstin": "29AABCM2424P1Z3",
            "fssai": "11226999000123",
            "address": "HSR Layout, Bengaluru",
        },
        customer_details={"name": "Priya Sharma", "phone": "+919876543210", "email": "priya@example.com"},
        delivery_address={"recipient_name": "Priya Sharma", "street_address": "Flat 302, Green Heights", "city": "Bengaluru", "pincode": "560102"},
        items=[
            {
                "product_name_snapshot": "Amoxicillin 500mg Capsules",
                "hsn_code_snapshot": "3004",
                "batch_number_snapshot": "AMX-2027-01",
                "expiry_date_snapshot": date(2027, 8, 31),
                "quantity": 2,
                "unit_mrp": Decimal("120.00"),
                "unit_price": Decimal("95.00"),
                "gst_rate_snapshot": Decimal("12.00"),
                "total_amount": Decimal("190.00"),
            }
        ],
        subtotal=Decimal("240.00"),
        discount_total=Decimal("50.00"),
        cgst_amount=Decimal("10.18"),
        sgst_amount=Decimal("10.18"),
        igst_amount=Decimal("0.00"),
        tax_total=Decimal("20.36"),
        delivery_fee=Decimal("0.00"),
        grand_total=Decimal("190.00"),
        payment_status="paid",
    )

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 2000
    assert pdf_bytes.startswith(b"%PDF-1.4\n")
    assert pdf_bytes.endswith(b"%%EOF\n")
    assert b"/Type /Catalog" in pdf_bytes
    assert b"/Type /Pages" in pdf_bytes
    assert b"/Type /Page" in pdf_bytes
    assert b"INV-20261117-948210" in pdf_bytes
    assert b"AMX-2027-01" in pdf_bytes


@pytest.mark.asyncio
async def test_invoice_service_missing_credentials_raises_configuration_error():
    """Verify Section 15: unconfigured pharmacy details refuse to generate unverified invoices."""
    mock_db = MagicMock()
    service = InvoiceService(mock_db)

    # Force empty credentials
    service.get_pharmacy_details = MagicMock(side_effect=InvoiceConfigurationError("Missing DL and GSTIN"))

    order = Order(
        id=uuid.uuid4(),
        order_number="ORD-TEST-999",
        customer_id=uuid.uuid4(),
        subtotal=Decimal("100.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("12.00"),
        delivery_fee=Decimal("0.00"),
        grand_total=Decimal("112.00"),
        delivery_address_snapshot={},
    )
    service.order_repo.get_invoice_by_order_id = AsyncMock(return_value=None)

    with pytest.raises(InvoiceConfigurationError):
        await service.generate_invoice_for_order(order)


# =============================================================================
# 8. Order Creation Workflow & Idempotency Integration Tests
# =============================================================================

@pytest.mark.asyncio
async def test_order_creation_idempotency_cached_response():
    """Verify duplicate request with same idempotency key returns original order without re-creation."""
    mock_db = MagicMock()
    service = OrderCreationService(mock_db)

    cust_id = uuid.uuid4()
    cust_user = User(id=cust_id, full_name="Aarav Sharma", status="active", is_active=True)

    addr_id = uuid.uuid4()
    payload = OrderCreateRequest(
        delivery_address_id=addr_id,
        customer_notes="Please ring bell",
        acknowledge_price_changes=False,
    )
    req_hash = OrderCreationService.compute_request_hash(payload.model_dump())

    cached_payload = {
        "id": str(uuid.uuid4()),
        "order_number": "ORD-20261117-CACHED",
        "customer_id": str(cust_id),
        "status": "pending_payment",
        "grand_total": "150.00",
    }

    existing_record = OrderIdempotencyRecord(
        idempotency_key="IDEMP-KEY-12345",
        customer_id=cust_id,
        request_hash=req_hash,
        status="completed",
        response_payload=cached_payload,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )

    service.order_repo.get_idempotency_record = AsyncMock(return_value=existing_record)

    result = await service.create_order_from_cart(
        customer=cust_user,
        payload=payload,
        idempotency_key="IDEMP-KEY-12345",
    )

    assert result["order_number"] == "ORD-20261117-CACHED"
    assert result["status"] == "pending_payment"
    # Ensure cart was NOT touched
    service.cart_repo.get_active_cart = AsyncMock()
    service.cart_repo.get_active_cart.assert_not_called()


@pytest.mark.asyncio
async def test_order_creation_idempotency_mismatched_payload_rejected():
    """Verify reusing idempotency key with a changed payload returns HTTP 400 Bad Request."""
    mock_db = MagicMock()
    service = OrderCreationService(mock_db)

    cust_id = uuid.uuid4()
    cust_user = User(id=cust_id, status="active", is_active=True)

    existing_record = OrderIdempotencyRecord(
        idempotency_key="IDEMP-KEY-99999",
        customer_id=cust_id,
        request_hash="different_sha256_hash_12345",
        status="completed",
        response_payload={},
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )

    service.order_repo.get_idempotency_record = AsyncMock(return_value=existing_record)

    payload = OrderCreateRequest(
        delivery_address_id=uuid.uuid4(),
        customer_notes="Different note",
        acknowledge_price_changes=False,
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.create_order_from_cart(
            customer=cust_user,
            payload=payload,
            idempotency_key="IDEMP-KEY-99999",
        )
    assert exc_info.value.status_code == 400
    assert "different request payload" in exc_info.value.detail["message"]


@pytest.mark.asyncio
async def test_order_creation_price_change_acknowledgement_required():
    """Verify unacknowledged price change halts order creation and prompts customer."""
    mock_db = MagicMock()
    service = OrderCreationService(mock_db)

    cust_id = uuid.uuid4()
    cust_user = User(id=cust_id, status="active", is_active=True)

    prod = Product(
        id=uuid.uuid4(),
        name="Paracetamol 650mg",
        sku="PCM-650",
        generic_name="Paracetamol",
        selling_price=Decimal("45.00"),  # Increased to 45
        mrp=Decimal("50.00"),
        gst_rate=Decimal("12.00"),
        is_active=True,
        is_deleted=False,
        requires_prescription=False,
    )

    cart_item = MagicMock(
        product=prod,
        quantity=2,
        unit_price_snapshot=Decimal("40.00"),  # Snapshot was 40
    )
    cart = MagicMock(items=[cart_item])

    service.order_repo.get_idempotency_record = AsyncMock(return_value=None)
    service.cart_repo.get_active_cart = AsyncMock(return_value=cart)
    service.address_repo.get_by_id_and_user = AsyncMock(return_value=MagicMock(pincode="560102"))
    service.settings_repo.get_or_create_settings = AsyncMock(return_value=MagicMock(is_serviceability_enforced=False))
    service.serviceability_service.check_pincode_serviceability = AsyncMock(return_value=MagicMock(is_serviceable=True))

    payload = OrderCreateRequest(
        delivery_address_id=uuid.uuid4(),
        acknowledge_price_changes=False,  # NOT ACKNOWLEDGED!
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.create_order_from_cart(
            customer=cust_user,
            payload=payload,
        )
    assert exc_info.value.status_code == 400
    assert "Price for 'Paracetamol 650mg' changed" in exc_info.value.detail["message"]


@pytest.mark.asyncio
async def test_order_creation_prescription_missing_blocks_order():
    """Verify missing prescription for Schedule H drug blocks order creation immediately."""
    mock_db = MagicMock()
    service = OrderCreationService(mock_db)

    cust_id = uuid.uuid4()
    cust_user = User(id=cust_id, status="active", is_active=True)

    rx_prod = Product(
        id=uuid.uuid4(),
        name="Amoxicillin 500mg",
        sku="AMX-500",
        selling_price=Decimal("90.00"),
        mrp=Decimal("100.00"),
        gst_rate=Decimal("12.00"),
        is_active=True,
        is_deleted=False,
        requires_prescription=True,  # Prescription required!
        schedule_classification="Schedule H",
    )

    cart_item = MagicMock(product=rx_prod, quantity=1, unit_price_snapshot=Decimal("90.00"))
    cart = MagicMock(items=[cart_item])

    service.order_repo.get_idempotency_record = AsyncMock(return_value=None)
    service.cart_repo.get_active_cart = AsyncMock(return_value=cart)
    service.address_repo.get_by_id_and_user = AsyncMock(return_value=MagicMock(pincode="560102"))
    service.settings_repo.get_or_create_settings = AsyncMock(return_value=MagicMock(is_serviceability_enforced=False))
    service.serviceability_service.check_pincode_serviceability = AsyncMock(return_value=MagicMock(is_serviceable=True))

    # Rx service returns not eligible
    rx_eval = MagicMock(
        is_eligible=False,
        message="Valid doctor's prescription is required for Amoxicillin 500mg.",
        validation_status="prescription_required",
    )
    service.rx_service.evaluate_product_prescription = AsyncMock(return_value=rx_eval)

    payload = OrderCreateRequest(
        delivery_address_id=uuid.uuid4(),
        acknowledge_price_changes=True,
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.create_order_from_cart(
            customer=cust_user,
            payload=payload,
        )
    assert exc_info.value.status_code == 400
    assert "prescription is required" in exc_info.value.detail["message"]


@pytest.mark.asyncio
async def test_pricing_service_totals_and_property_aliases():
    """Verify PricingService.calculate_cart_totals signature and CartPricingSummary property aliases."""
    from app.services.pricing_service import PricingService, ItemPriceCalculation
    from app.models.checkout import CheckoutSetting

    calc = ItemPriceCalculation(
        unit_price=Decimal("100.00"),
        unit_mrp=Decimal("120.00"),
        quantity=2,
        subtotal=Decimal("200.00"),
        mrp_subtotal=Decimal("240.00"),
        discount_amount=Decimal("40.00"),
        gst_rate=Decimal("12.00"),
        taxable_amount=Decimal("178.57"),
        tax_amount=Decimal("21.43"),
        cgst_amount=Decimal("10.71"),
        sgst_amount=Decimal("10.72"),
        igst_amount=Decimal("0.00"),
    )
    settings = CheckoutSetting(
        free_delivery_threshold=Decimal("500.00"),
        standard_delivery_fee=Decimal("40.00"),
        express_cold_chain_fee=Decimal("80.00"),
    )

    summary = PricingService.calculate_cart_totals(
        item_calculations=[calc],
        settings=settings,
        has_cold_chain=True,
    )

    # Check primary fields
    assert summary.subtotal == Decimal("200.00")
    assert summary.total_discount == Decimal("40.00")
    assert summary.total_tax == Decimal("21.43")
    assert summary.cgst_total == Decimal("10.71")
    assert summary.sgst_total == Decimal("10.72")
    assert summary.delivery_fee == Decimal("80.00")

    # Check backward-compatible property aliases
    assert summary.discount_total == summary.total_discount
    assert summary.tax_total == summary.total_tax
    assert summary.cgst_amount == summary.cgst_total
    assert summary.sgst_amount == summary.sgst_total
    assert summary.igst_amount == summary.igst_total

