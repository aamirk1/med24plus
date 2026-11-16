import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.checkout import CheckoutValidation
from app.repositories.address_repository import AddressRepository
from app.repositories.cart_repository import CartRepository
from app.repositories.checkout_repository import CheckoutRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.serviceability_repository import ServiceabilityRepository
from app.schemas.address import AddressResponse
from app.schemas.cart import CartItemResponse
from app.schemas.checkout import (
    CheckoutSummaryResponse,
    CheckoutValidateRequest,
    CheckoutValidationResponse,
)
from app.services.prescription_eligibility_service import PrescriptionEligibilityService
from app.services.pricing_service import PricingService
from app.services.serviceability_service import ServiceabilityService


class CheckoutService:
    """
    Core domain service orchestrating the multi-factor checkout validation pipeline.
    Validates product eligibility, server prices, physical inventory, clinical prescriptions,
    address ownership, and statutory delivery geofence serviceability.
    
    IMPORTANT: A checkout validation record is NOT an order and DOES NOT reserve stock.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.cart_repo = CartRepository(db)
        self.product_repo = ProductRepository(db)
        self.address_repo = AddressRepository(db)
        self.settings_repo = ServiceabilityRepository(db)
        self.checkout_repo = CheckoutRepository(db)
        self.rx_service = PrescriptionEligibilityService(db)
        self.serviceability_service = ServiceabilityService(db)

    async def validate_checkout(
        self,
        customer_id: uuid.UUID,
        payload: CheckoutValidateRequest,
    ) -> CheckoutValidationResponse:
        """
        Execute full checkout validation workflow.
        Returns definitive summary and persists time-limited quote.
        """
        # 1. Fetch Active Cart
        cart = await self.cart_repo.get_active_cart(customer_id, load_items=True)
        if not cart or not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": "Cannot prepare checkout for an empty cart.",
                    "error": {"code": "CART_EMPTY"},
                },
            )

        # 2. Fetch & Validate Delivery Address Ownership
        address = await self.address_repo.get_by_id_and_user(payload.delivery_address_id, customer_id)
        if not address:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "message": "Selected delivery address does not exist or does not belong to you.",
                    "error": {"code": "ADDRESS_NOT_FOUND"},
                },
            )

        # 3. Check Delivery Geofence Serviceability
        settings = await self.settings_repo.get_or_create_settings()
        serviceability_check = await self.serviceability_service.check_pincode_serviceability(address.pincode)

        blocking_errors: List[str] = []
        warnings: List[str] = []
        validation_error_items: List[Dict[str, Any]] = []

        if settings.is_serviceability_enforced and not serviceability_check.is_serviceable:
            msg = f"Delivery address PIN code ({address.pincode}) is currently outside our serviceable delivery network."
            blocking_errors.append(msg)
            validation_error_items.append({
                "field": "delivery_address_id",
                "code": "ADDRESS_NOT_SERVICEABLE",
                "message": msg,
            })

        # 4. Fetch Real-time Sellable Inventory
        product_ids = [item.product_id for item in cart.items]
        stock_map = await self.product_repo.get_sellable_stock_for_products(product_ids)

        item_dtos: List[CartItemResponse] = []
        item_calcs = []
        item_validations_list: List[Dict[str, Any]] = []
        has_cold_chain = False

        for item in cart.items:
            product = item.product
            quantity = item.quantity

            if product.is_cold_chain:
                has_cold_chain = True

            # Selling Price & MRP
            calc = PricingService.calculate_item_price(product, quantity)
            item_calcs.append(calc)

            # Price Change Detection
            snapshot = item.unit_price_snapshot
            unit_price_curr = calc.unit_price
            is_price_changed = False
            prev_price = None

            if snapshot is not None and snapshot != unit_price_curr:
                is_price_changed = True
                prev_price = snapshot
                diff = unit_price_curr - snapshot
                if payload.acknowledge_price_changes:
                    # Update snapshot upon explicit user acknowledgement
                    await self.cart_repo.update_snapshot_price(item, unit_price_curr)
                    warnings.append(
                        f"Price change for '{product.name}' (₹{snapshot} → ₹{unit_price_curr}) was acknowledged."
                    )
                else:
                    if diff > 0:
                        msg = f"Price for '{product.name}' has increased from ₹{snapshot} to ₹{unit_price_curr}. Please review."
                    else:
                        msg = f"Price for '{product.name}' has decreased from ₹{snapshot} to ₹{unit_price_curr}."
                    warnings.append(msg)
                    validation_error_items.append({
                        "product_id": str(product.id),
                        "code": "PRICE_CHANGED",
                        "message": msg,
                        "old_price": str(snapshot),
                        "new_price": str(unit_price_curr),
                    })

            # Check Sellable Stock
            sellable = stock_map.get(product.id, 0)
            is_available = sellable >= quantity and product.is_active and not product.is_deleted

            if not product.is_active or product.is_deleted:
                msg = f"Product '{product.name}' is no longer active or available for sale."
                blocking_errors.append(msg)
                val_status = "inactive_product"
                validation_error_items.append({
                    "product_id": str(product.id),
                    "code": "PRODUCT_INACTIVE",
                    "message": msg,
                })
            elif sellable == 0:
                msg = f"Product '{product.name}' is completely out of stock."
                blocking_errors.append(msg)
                val_status = "insufficient_stock"
                validation_error_items.append({
                    "product_id": str(product.id),
                    "code": "OUT_OF_STOCK",
                    "message": msg,
                })
            elif quantity > sellable:
                msg = f"Only {sellable} units of '{product.name}' in stock (you requested {quantity})."
                blocking_errors.append(msg)
                val_status = "insufficient_stock"
                validation_error_items.append({
                    "product_id": str(product.id),
                    "code": "INSUFFICIENT_STOCK",
                    "message": msg,
                    "available_quantity": sellable,
                })
            elif is_price_changed:
                val_status = "price_changed"
            else:
                val_status = "available"

            # Check Clinical Prescription Requirements
            rx_eval = await self.rx_service.evaluate_product_prescription(customer_id, product)
            if rx_eval.requires_prescription and not rx_eval.is_eligible:
                msg = rx_eval.message
                blocking_errors.append(msg)
                val_status = rx_eval.validation_status
                validation_error_items.append({
                    "product_id": str(product.id),
                    "code": "PRESCRIPTION_BLOCK",
                    "status": rx_eval.validation_status,
                    "message": msg,
                })

            img_url = None
            if product.images:
                primary = next((img for img in product.images if img.is_primary), product.images[0])
                img_url = primary.image_url

            item_dto = CartItemResponse(
                id=item.id,
                cart_id=item.cart_id,
                product_id=product.id,
                product_name=product.name,
                product_slug=product.slug,
                product_sku=product.sku,
                generic_name=product.generic_name,
                pack_size=product.pack_size,
                dosage_form=product.dosage_form,
                strength=product.strength,
                brand_name=product.brand.name if product.brand else None,
                category_name=product.category.name if product.category else None,
                image_url=img_url,
                is_cold_chain=product.is_cold_chain,
                unit_price=calc.unit_price,
                unit_mrp=calc.unit_mrp,
                unit_price_snapshot=snapshot,
                is_price_changed=is_price_changed,
                previous_price=prev_price,
                quantity=quantity,
                subtotal=calc.subtotal,
                mrp_subtotal=calc.mrp_subtotal,
                discount_amount=calc.discount_amount,
                gst_rate=calc.gst_rate,
                tax_amount=calc.tax_amount,
                is_available=is_available,
                sellable_stock=sellable,
                requires_prescription=product.requires_prescription,
                schedule_classification=product.schedule_classification or "OTC",
                prescription_status=rx_eval.validation_status,
                prescription_reference=rx_eval.prescription_reference,
                prescription_message=rx_eval.message if rx_eval.requires_prescription else None,
                validation_status=val_status,
                status_message=None if val_status == "available" else val_status,
            )
            item_dtos.append(item_dto)
            item_validations_list.append(item_dto.model_dump(mode="json"))

        # Calculate authoritatively aggregated totals
        cart_pricing = PricingService.calculate_cart_totals(item_calcs, settings, has_cold_chain=has_cold_chain)

        # Minimum cart value check
        if cart_pricing.subtotal < settings.minimum_cart_value:
            msg = f"Order subtotal (₹{cart_pricing.subtotal}) is below the minimum order value of ₹{settings.minimum_cart_value}."
            blocking_errors.append(msg)
            validation_error_items.append({
                "code": "MINIMUM_ORDER_VALUE_NOT_MET",
                "message": msg,
                "minimum_cart_value": str(settings.minimum_cart_value),
            })

        # Final state determination
        if blocking_errors:
            validation_status = "blocked"
            is_eligible = False
        elif warnings:
            validation_status = "valid_with_warnings"
            is_eligible = True
        else:
            validation_status = "valid"
            is_eligible = True

        calculated_at = datetime.utcnow()
        expires_at = calculated_at + timedelta(minutes=15)

        # Persist CheckoutValidation record
        validation_record = CheckoutValidation(
            customer_id=customer_id,
            cart_id=cart.id,
            delivery_address_id=address.id,
            validation_status=validation_status,
            subtotal=cart_pricing.subtotal,
            discount_total=cart_pricing.total_discount,
            tax_total=cart_pricing.total_tax,
            delivery_fee=cart_pricing.delivery_fee,
            grand_total=cart_pricing.grand_total,
            validation_errors=validation_error_items,
            item_validations=item_validations_list,
            tax_breakdown={
                "taxable_amount": str(cart_pricing.taxable_amount),
                "cgst_total": str(cart_pricing.cgst_total),
                "sgst_total": str(cart_pricing.sgst_total),
                "igst_total": str(cart_pricing.igst_total),
                "total_tax": str(cart_pricing.total_tax),
                "rate_breakdowns": cart_pricing.rate_breakdowns,
            },
            calculated_at=calculated_at,
            expires_at=expires_at,
        )
        saved_record = await self.checkout_repo.save_validation(validation_record)
        await self.db.commit()

        return CheckoutValidationResponse(
            id=saved_record.id,
            cart_id=cart.id,
            customer_id=customer_id,
            delivery_address_id=address.id,
            selected_address=AddressResponse.model_validate(address),
            validation_status=validation_status,
            is_eligible_for_checkout=is_eligible,
            is_address_serviceable=serviceability_check.is_serviceable,
            serviceability_message=serviceability_check.message,
            estimated_delivery_hours=serviceability_check.estimated_delivery_hours,
            subtotal=cart_pricing.subtotal,
            discount_total=cart_pricing.total_discount,
            tax_total=cart_pricing.total_tax,
            delivery_fee=cart_pricing.delivery_fee,
            grand_total=cart_pricing.grand_total,
            tax_breakdown={
                "taxable_amount": cart_pricing.taxable_amount,
                "cgst_total": cart_pricing.cgst_total,
                "sgst_total": cart_pricing.sgst_total,
                "igst_total": cart_pricing.igst_total,
                "total_tax": cart_pricing.total_tax,
                "rate_breakdowns": cart_pricing.rate_breakdowns,
            },
            items=item_dtos,
            warnings=warnings,
            blocking_errors=blocking_errors,
            validation_errors=validation_error_items,
            calculated_at=calculated_at,
            expires_at=expires_at,
        )

    async def get_checkout_summary(
        self,
        customer_id: uuid.UUID,
        address_id: Optional[uuid.UUID] = None,
    ) -> CheckoutSummaryResponse:
        """
        Generate lightweight live summary of cart and delivery checkout status.
        """
        cart = await self.cart_repo.get_active_cart(customer_id, load_items=True)
        if not cart or not cart.items:
            empty_pricing = PricingService.calculate_cart_totals([], await self.settings_repo.get_or_create_settings())
            return CheckoutSummaryResponse(
                cart_id=uuid.uuid4() if not cart else cart.id,
                validation_status="blocked",
                is_eligible_for_checkout=False,
                subtotal=empty_pricing.subtotal,
                discount_total=empty_pricing.total_discount,
                tax_total=empty_pricing.total_tax,
                delivery_fee=empty_pricing.delivery_fee,
                grand_total=empty_pricing.grand_total,
                item_count=0,
                items=[],
                selected_address=None,
                is_address_serviceable=False,
                serviceability_message="Cart is empty.",
                warnings=[],
                blocking_errors=["Cart is empty."],
                expires_at=None,
            )

        # Resolve address (specified or default)
        selected_address = None
        if address_id:
            selected_address = await self.address_repo.get_by_id_and_user(address_id, customer_id)
        if not selected_address:
            selected_address = await self.address_repo.get_default_by_user(customer_id)

        # Build validation using validate_checkout if address is available
        if selected_address:
            val_resp = await self.validate_checkout(
                customer_id=customer_id,
                payload=CheckoutValidateRequest(
                    delivery_address_id=selected_address.id,
                    acknowledge_price_changes=False,
                ),
            )
            return CheckoutSummaryResponse(
                cart_id=cart.id,
                validation_status=val_resp.validation_status,
                is_eligible_for_checkout=val_resp.is_eligible_for_checkout,
                subtotal=val_resp.subtotal,
                discount_total=val_resp.discount_total,
                tax_total=val_resp.tax_total,
                delivery_fee=val_resp.delivery_fee,
                grand_total=val_resp.grand_total,
                item_count=len(val_resp.items),
                items=val_resp.items,
                selected_address=val_resp.selected_address,
                is_address_serviceable=val_resp.is_address_serviceable,
                serviceability_message=val_resp.serviceability_message,
                warnings=val_resp.warnings,
                blocking_errors=val_resp.blocking_errors,
                expires_at=val_resp.expires_at,
            )

        # No address selected yet: calculate cart pricing only
        settings = await self.settings_repo.get_or_create_settings()
        item_calcs = [
            PricingService.calculate_item_price(item.product, item.quantity)
            for item in cart.items
        ]
        has_cold_chain = any(item.product.is_cold_chain for item in cart.items)
        cart_pricing = PricingService.calculate_cart_totals(item_calcs, settings, has_cold_chain=has_cold_chain)

        warnings = ["Please select or add a delivery address to verify serviceability."]
        blocking = ["No delivery address selected."]

        return CheckoutSummaryResponse(
            cart_id=cart.id,
            validation_status="blocked",
            is_eligible_for_checkout=False,
            subtotal=cart_pricing.subtotal,
            discount_total=cart_pricing.total_discount,
            tax_total=cart_pricing.total_tax,
            delivery_fee=cart_pricing.delivery_fee,
            grand_total=cart_pricing.grand_total,
            item_count=len(cart.items),
            items=[],
            selected_address=None,
            is_address_serviceable=False,
            serviceability_message="Address selection required.",
            warnings=warnings,
            blocking_errors=blocking,
            expires_at=None,
        )
