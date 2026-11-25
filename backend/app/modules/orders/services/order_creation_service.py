from datetime import datetime, timedelta, timezone
from decimal import Decimal
import hashlib
import json
from typing import Any, Dict, List, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.order import (
    Order,
    OrderIdempotencyRecord,
    OrderItem,
    OrderStatusHistory,
)
from app.models.user import User
from app.modules.orders.services.inventory_reservation_service import InventoryReservationService
from app.modules.orders.services.invoice_service import InvoiceService
from app.modules.orders.utils.number_generators import generate_order_number
from app.repositories.address_repository import AddressRepository
from app.repositories.cart_repository import CartRepository
from app.repositories.checkout_repository import CheckoutRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.serviceability_repository import ServiceabilityRepository
from app.schemas.order import OrderCreateRequest, OrderResponse
from app.services.fefo_allocation_service import (
    InsufficientStockError,
    fefo_allocation_service,
)
from app.services.prescription_eligibility_service import PrescriptionEligibilityService
from app.services.pricing_service import PricingService
from app.services.serviceability_service import ServiceabilityService


class OrderCreationService:
    """
    Authoritative domain service executing the 21-step order creation workflow.
    Validates idempotency, recalculates pricing, re-evaluates clinical prescriptions under Rule 65,
    locks batches and reserves physical inventory via FEFO, and commits all changes transactionally.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.cart_repo = CartRepository(db)
        self.product_repo = ProductRepository(db)
        self.address_repo = AddressRepository(db)
        self.settings_repo = ServiceabilityRepository(db)
        self.checkout_repo = CheckoutRepository(db)
        self.rx_service = PrescriptionEligibilityService(db)
        self.serviceability_service = ServiceabilityService(db)
        self.res_service = InventoryReservationService(db)
        self.invoice_service = InvoiceService(db)

    @staticmethod
    def compute_request_hash(payload_dict: Dict[str, Any]) -> str:
        """Compute SHA-256 digest of normalized request payload for idempotency verification."""
        serialized = json.dumps(payload_dict, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    async def create_order_from_cart(
        self,
        customer: User,
        payload: OrderCreateRequest,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Execute full transactional order creation workflow.
        Guarantees atomicity: no partial orders or orphan reservations.
        """
        customer_id = customer.id
        now_utc = datetime.now(timezone.utc)

        # ---------------------------------------------------------------------
        # 1. Idempotency Gate (Section 6)
        # ---------------------------------------------------------------------
        payload_dict = payload.model_dump()
        request_hash = self.compute_request_hash(payload_dict)
        idempotency_record: Optional[OrderIdempotencyRecord] = None

        if idempotency_key:
            idempotency_record = await self.order_repo.get_idempotency_record(idempotency_key, customer_id)
            if idempotency_record:
                if idempotency_record.status == "completed":
                    if idempotency_record.request_hash == request_hash:
                        # Return cached identical response
                        if idempotency_record.response_payload:
                            return idempotency_record.response_payload
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail={
                                "success": False,
                                "message": "Idempotency key was previously used with a different request payload.",
                                "error": {"code": "IDEMPOTENCY_KEY_PAYLOAD_MISMATCH"},
                            },
                        )
                elif idempotency_record.status == "processing":
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail={
                            "success": False,
                            "message": "An order with this idempotency key is already currently being processed.",
                            "error": {"code": "CONCURRENT_ORDER_CREATION"},
                        },
                    )

            # Record initial processing state
            if not idempotency_record:
                idempotency_record = OrderIdempotencyRecord(
                    idempotency_key=idempotency_key,
                    customer_id=customer_id,
                    request_hash=request_hash,
                    status="processing",
                    expires_at=now_utc + timedelta(hours=24),
                )
                self.db.add(idempotency_record)
                await self.db.flush()

        try:
            # -----------------------------------------------------------------
            # 2. Retrieve & Verify Active Cart
            # -----------------------------------------------------------------
            cart = await self.cart_repo.get_active_cart(customer_id, load_items=True)
            if not cart or not cart.items:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": "Cannot create order from an empty cart.",
                        "error": {"code": "CART_EMPTY"},
                    },
                )

            # -----------------------------------------------------------------
            # 3. Retrieve & Validate Delivery Address Ownership & Serviceability
            # -----------------------------------------------------------------
            address = await self.address_repo.get_by_id_and_user(payload.delivery_address_id, customer_id)
            if not address:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={
                        "success": False,
                        "message": "Delivery address does not exist or does not belong to you.",
                        "error": {"code": "ADDRESS_NOT_FOUND"},
                    },
                )

            settings = await self.settings_repo.get_or_create_settings()
            serviceability_check = await self.serviceability_service.check_pincode_serviceability(address.pincode)
            if settings.is_serviceability_enforced and not serviceability_check.is_serviceable:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": f"Delivery address PIN code ({address.pincode}) is outside our active delivery geofence.",
                        "error": {"code": "ADDRESS_NOT_SERVICEABLE"},
                    },
                )

            delivery_snapshot = {
                "address_id": str(address.id),
                "recipient_name": address.recipient_name,
                "recipient_phone": address.recipient_phone,
                "address_line1": address.address_line1,
                "address_line2": address.address_line2,
                "street_address": f"{address.address_line1} {address.address_line2 or ''}".strip(),
                "landmark": address.landmark,
                "area": address.city,
                "city": address.city,
                "state": address.state,
                "pincode": address.pincode,
                "address_type": address.address_type,
            }

            # -----------------------------------------------------------------
            # 4. Product Eligibility, Backend Pricing Recalculation & Rx Revalidation
            # -----------------------------------------------------------------
            item_calcs = []
            has_cold_chain = False
            requires_pharmacist_review = False
            associated_prescription_id: Optional[uuid.UUID] = None

            for item in cart.items:
                product = item.product
                if not product or not product.is_active or product.is_deleted:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={
                            "success": False,
                            "message": f"Medicine '{product.name if product else 'Unknown'}' is inactive or no longer sold.",
                            "error": {"code": "PRODUCT_INACTIVE"},
                        },
                    )

                if product.is_cold_chain:
                    has_cold_chain = True

                calc = PricingService.calculate_item_price(product, item.quantity)
                item_calcs.append((item, product, calc))

                # Check price change acknowledgement
                if item.unit_price_snapshot is not None and item.unit_price_snapshot != calc.unit_price:
                    if not payload.acknowledge_price_changes:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail={
                                "success": False,
                                "message": (
                                    f"Price for '{product.name}' changed from ₹{item.unit_price_snapshot} to ₹{calc.unit_price}. "
                                    "Please review and acknowledge price changes to proceed."
                                ),
                                "error": {
                                    "code": "PRICE_CHANGED",
                                    "product_id": str(product.id),
                                    "old_price": str(item.unit_price_snapshot),
                                    "new_price": str(calc.unit_price),
                                },
                            },
                        )

                # Clinical Prescription Revalidation under Rule 65
                if product.requires_prescription:
                    rx_eval = await self.rx_service.evaluate_product_prescription(customer_id, product)
                    if not rx_eval.is_eligible:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail={
                                "success": False,
                                "message": rx_eval.message,
                                "error": {
                                    "code": "PRESCRIPTION_REQUIRED",
                                    "product_id": str(product.id),
                                    "status": rx_eval.validation_status,
                                },
                            },
                        )
                    requires_pharmacist_review = True
                    if rx_eval.prescription_id:
                        associated_prescription_id = rx_eval.prescription_id

            # Calculate total summary
            pure_calcs = [c for _, _, c in item_calcs]
            pricing_summary = PricingService.calculate_cart_totals(
                item_calculations=pure_calcs,
                settings=settings,
                has_cold_chain=has_cold_chain,
            )

            # -----------------------------------------------------------------
            # 5. Order Header Creation
            # -----------------------------------------------------------------
            order_number = generate_order_number()
            initial_status = "pharmacist_review" if requires_pharmacist_review else "pending_payment"

            order = Order(
                order_number=order_number,
                customer_id=customer_id,
                prescription_id=associated_prescription_id,
                status=initial_status,
                payment_status="pending",
                subtotal=pricing_summary.subtotal,
                discount_amount=pricing_summary.discount_total,
                tax_amount=pricing_summary.tax_total,
                cgst_amount=pricing_summary.cgst_amount,
                sgst_amount=pricing_summary.sgst_amount,
                igst_amount=pricing_summary.igst_amount,
                delivery_fee=pricing_summary.delivery_fee,
                grand_total=pricing_summary.grand_total,
                currency="INR",
                delivery_address_snapshot=delivery_snapshot,
                customer_notes=payload.customer_notes,
                is_cold_chain_required=has_cold_chain,
                placed_at=now_utc,
                idempotency_key=idempotency_key,
            )
            self.db.add(order)
            await self.db.flush()

            # -----------------------------------------------------------------
            # 6. FEFO Batch Allocation & Reservation Creation (Atomic)
            # -----------------------------------------------------------------
            for item, product, calc in item_calcs:
                try:
                    fefo_result = await fefo_allocation_service.allocate_product_stock(
                        db=self.db,
                        product_id=product.id,
                        requested_quantity=item.quantity,
                        lock_for_update=True,
                        raise_if_insufficient=True,
                    )
                except InsufficientStockError as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={
                            "success": False,
                            "message": f"Insufficient sellable stock for '{product.name}'. {e}",
                            "error": {"code": "INSUFFICIENT_STOCK", "product_id": str(product.id)},
                        },
                    )

                primary_batch = fefo_result.batches[0] if fefo_result.batches else None

                # Create immutable OrderItem snapshot
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    batch_id=primary_batch.batch_id if primary_batch else None,
                    product_name_snapshot=product.name,
                    product_sku_snapshot=product.sku,
                    generic_name_snapshot=product.generic_name or "",
                    strength_snapshot=product.strength,
                    pack_size_snapshot=product.pack_size,
                    manufacturer_snapshot=product.brand.name if product.brand else "Generic",
                    batch_number_snapshot=primary_batch.batch_number if primary_batch else None,
                    expiry_date_snapshot=primary_batch.expiry_date if primary_batch else None,
                    hsn_code_snapshot=product.hsn_code or "3004",
                    gst_rate_snapshot=product.gst_rate,
                    unit_mrp=calc.unit_mrp,
                    unit_price=calc.unit_price,
                    quantity=item.quantity,
                    subtotal=calc.subtotal,
                    discount_amount=calc.discount_amount,
                    taxable_amount=calc.taxable_amount,
                    tax_amount=calc.tax_amount,
                    total_amount=calc.subtotal,
                    prescription_required=product.requires_prescription,
                )
                self.db.add(order_item)
                await self.db.flush()

                # Reserve every allocated batch slice
                for alloc_batch in fefo_result.batches:
                    await self.res_service.reserve_batch_stock(
                        order_id=order.id,
                        order_item_id=order_item.id,
                        batch_id=alloc_batch.batch_id,
                        product_id=product.id,
                        quantity=alloc_batch.allocated_quantity,
                        acting_user_id=customer_id,
                    )

            # -----------------------------------------------------------------
            # 7. Order Status History Entry
            # -----------------------------------------------------------------
            status_history = OrderStatusHistory(
                order_id=order.id,
                previous_status=None,
                new_status=initial_status,
                changed_by_id=customer_id,
                actor_role="customer",
                notes="Order placed by customer via validated checkout",
                created_at=now_utc,
            )
            self.db.add(status_history)

            # -----------------------------------------------------------------
            # 8. Notifications
            # -----------------------------------------------------------------
            cust_notification = Notification(
                user_id=customer_id,
                title="Order Placed Successfully",
                message=f"Your order {order.order_number} has been placed.",
                notification_type="ORDER_PLACED",
                reference_type="order",
                reference_id=order.id,
                is_read=False,
            )
            self.db.add(cust_notification)

            if requires_pharmacist_review:
                review_notification = Notification(
                    user_id=customer_id,
                    title="Prescription Under Review",
                    message=f"Order {order.order_number} is pending registered pharmacist verification under Rule 65.",
                    notification_type="ORDER_PHARMACIST_REVIEW",
                    reference_type="order",
                    reference_id=order.id,
                    is_read=False,
                )
                self.db.add(review_notification)

            # -----------------------------------------------------------------
            # 9. Clear Active Cart Upon Order Creation
            # -----------------------------------------------------------------
            await self.cart_repo.clear_cart(customer_id)

            # -----------------------------------------------------------------
            # 10. Generate Immutable Statutory Tax Invoice / Form 20 Cash Memo
            # -----------------------------------------------------------------
            try:
                await self.invoice_service.generate_invoice_for_order(order, acting_user=customer)
            except Exception as inv_err:
                # Log invoice error but do not fail order creation if pharmacy credentials need config
                print(f"[Warning] Invoice generation deferred: {inv_err}")

            # Reload full order for response
            await self.db.flush()
            loaded_order = await self.order_repo.get_by_id(order.id, load_relations=True)
            response_dto = OrderResponse.model_validate(loaded_order)
            response_data = response_dto.model_dump(mode="json")

            # Update Idempotency Record
            if idempotency_record:
                idempotency_record.status = "completed"
                idempotency_record.order_id = order.id
                idempotency_record.response_payload = response_data
                await self.db.flush()

            # Commit the entire transaction atomically to make the order persistent
            await self.db.commit()

            return response_data

        except Exception as e:
            # Mark idempotency failed if any unhandled error occurs
            if idempotency_record and idempotency_record.status == "processing":
                idempotency_record.status = "failed"
                await self.db.flush()
            raise e
