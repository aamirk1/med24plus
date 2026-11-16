import uuid
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.repositories.cart_repository import CartRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.serviceability_repository import ServiceabilityRepository
from app.schemas.cart import (
    CartItemAddRequest,
    CartItemResponse,
    CartItemUpdateRequest,
    CartResponse,
)
from app.services.prescription_eligibility_service import PrescriptionEligibilityService
from app.services.pricing_service import PricingService


class CartService:
    """
    Domain service for customer shopping cart lifecycle, inventory checks,
    and server-authoritative price calculation.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.cart_repo = CartRepository(db)
        self.product_repo = ProductRepository(db)
        self.settings_repo = ServiceabilityRepository(db)
        self.rx_service = PrescriptionEligibilityService(db)

    async def get_cart(self, customer_id: uuid.UUID) -> CartResponse:
        """Retrieve customer's active shopping cart with live pricing and availability."""
        cart = await self.cart_repo.get_or_create_active_cart(customer_id)
        return await self._build_cart_response(cart, customer_id)

    async def add_item_to_cart(
        self, customer_id: uuid.UUID, data: CartItemAddRequest
    ) -> CartResponse:
        """
        Add a medicine/product to the customer's cart.
        Merges quantities if product already in cart.
        Enforces maximum quantity limits and sellable stock availability.
        DOES NOT reserve inventory.
        """
        # 1. Validate Product
        product = await self.product_repo.get_by_id(data.product_id)
        if not product or product.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "message": "Product not found or has been discontinued.",
                    "error": {"code": "PRODUCT_NOT_FOUND"},
                },
            )

        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Product '{product.name}' is currently inactive and unavailable for purchase.",
                    "error": {"code": "PRODUCT_INACTIVE"},
                },
            )

        # 2. Check operational limits
        settings = await self.settings_repo.get_or_create_settings()
        max_qty = settings.max_quantity_per_product or 10

        cart = await self.cart_repo.get_or_create_active_cart(customer_id)
        existing_item = await self.cart_repo.get_cart_item_by_product(cart.id, product.id)

        target_quantity = data.quantity
        if existing_item:
            target_quantity = existing_item.quantity + data.quantity

        if target_quantity > max_qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Cannot add {data.quantity} units. Maximum allowed limit for '{product.name}' is {max_qty} units per customer order.",
                    "error": {"code": "QUANTITY_EXCEEDS_LIMIT", "max_allowed": max_qty},
                },
            )

        # 3. Check sellable inventory
        stock_map = await self.product_repo.get_sellable_stock_for_products([product.id])
        sellable = stock_map.get(product.id, 0)

        if sellable == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Product '{product.name}' is currently out of stock.",
                    "error": {"code": "OUT_OF_STOCK", "available_stock": 0},
                },
            )

        if target_quantity > sellable:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Requested quantity ({target_quantity}) exceeds available sellable stock ({sellable} units).",
                    "error": {"code": "INSUFFICIENT_STOCK", "available_stock": sellable},
                },
            )

        current_price = Decimal(str(product.selling_price))

        if existing_item:
            await self.cart_repo.update_item_quantity(existing_item, target_quantity)
        else:
            await self.cart_repo.add_item(
                cart=cart,
                product_id=product.id,
                quantity=target_quantity,
                unit_price_snapshot=current_price,
            )

        await self.db.commit()

        # Re-fetch cart with fresh relationships
        cart = await self.cart_repo.get_active_cart(customer_id, load_items=True)
        return await self._build_cart_response(cart, customer_id)

    async def update_cart_item_quantity(
        self, customer_id: uuid.UUID, item_id: uuid.UUID, data: CartItemUpdateRequest
    ) -> CartResponse:
        """
        Update the quantity of an item already in the cart.
        """
        cart = await self.cart_repo.get_or_create_active_cart(customer_id)
        item = await self.cart_repo.get_cart_item(cart.id, item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "message": "Cart item not found.",
                    "error": {"code": "CART_ITEM_NOT_FOUND"},
                },
            )

        settings = await self.settings_repo.get_or_create_settings()
        max_qty = settings.max_quantity_per_product or 10

        if data.quantity > max_qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Maximum quantity limit per product is {max_qty}.",
                    "error": {"code": "QUANTITY_EXCEEDS_LIMIT", "max_allowed": max_qty},
                },
            )

        # Validate against sellable stock
        stock_map = await self.product_repo.get_sellable_stock_for_products([item.product_id])
        sellable = stock_map.get(item.product_id, 0)

        if data.quantity > sellable:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Cannot set quantity to {data.quantity}. Only {sellable} units currently available.",
                    "error": {"code": "INSUFFICIENT_STOCK", "available_stock": sellable},
                },
            )

        await self.cart_repo.update_item_quantity(item, data.quantity)
        await self.db.commit()

        cart = await self.cart_repo.get_active_cart(customer_id, load_items=True)
        return await self._build_cart_response(cart, customer_id)

    async def remove_cart_item(
        self, customer_id: uuid.UUID, item_id: uuid.UUID
    ) -> CartResponse:
        """Remove a specific item from the cart."""
        cart = await self.cart_repo.get_or_create_active_cart(customer_id)
        item = await self.cart_repo.get_cart_item(cart.id, item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "message": "Cart item not found.",
                    "error": {"code": "CART_ITEM_NOT_FOUND"},
                },
            )

        await self.cart_repo.remove_item(item)
        await self.db.commit()

        cart = await self.cart_repo.get_active_cart(customer_id, load_items=True)
        return await self._build_cart_response(cart, customer_id)

    async def clear_cart(self, customer_id: uuid.UUID) -> CartResponse:
        """Empty all items from customer's active cart."""
        cart = await self.cart_repo.get_or_create_active_cart(customer_id)
        await self.cart_repo.clear_cart(cart.id)
        await self.db.commit()

        cart = await self.cart_repo.get_active_cart(customer_id, load_items=True)
        return await self._build_cart_response(cart, customer_id)

    async def _build_cart_response(
        self, cart: Cart, customer_id: uuid.UUID
    ) -> CartResponse:
        """
        Assemble comprehensive CartResponse with real-time stock, prescription requirements,
        price change diagnostics, and statutory tax calculations.
        """
        settings = await self.settings_repo.get_or_create_settings()

        if not cart.items:
            empty_pricing = PricingService.calculate_cart_totals([], settings)
            return CartResponse(
                id=cart.id,
                customer_id=cart.customer_id,
                status=cart.status,
                items=[],
                item_count=0,
                total_quantity=0,
                subtotal=empty_pricing.subtotal,
                total_mrp=empty_pricing.total_mrp,
                total_discount=empty_pricing.total_discount,
                taxable_amount=empty_pricing.taxable_amount,
                total_tax=empty_pricing.total_tax,
                delivery_fee=empty_pricing.delivery_fee,
                free_delivery_threshold=empty_pricing.free_delivery_threshold,
                amount_needed_for_free_delivery=empty_pricing.amount_needed_for_free_delivery,
                grand_total=empty_pricing.grand_total,
                has_prescription_items=False,
                has_cold_chain_items=False,
                has_price_changes=False,
                is_valid_for_checkout=False,
                warnings=[],
                blocking_errors=[],
            )

        product_ids = [item.product_id for item in cart.items]
        stock_map = await self.product_repo.get_sellable_stock_for_products(product_ids)

        item_dtos: List[CartItemResponse] = []
        item_calcs = []
        has_cold_chain = False
        has_prescription = False
        has_price_changes = False
        blocking_errors: List[str] = []
        warnings: List[str] = []
        total_quantity = 0

        for item in cart.items:
            product = item.product
            quantity = item.quantity
            total_quantity += quantity

            # Check cold chain
            if product.is_cold_chain:
                has_cold_chain = True

            # Real-time sellable stock
            sellable = stock_map.get(product.id, 0)
            is_available = sellable >= quantity and product.is_active and not product.is_deleted

            # Item price calculation
            calc = PricingService.calculate_item_price(product, quantity)
            item_calcs.append(calc)

            # Price change detection
            unit_price_curr = calc.unit_price
            snapshot = item.unit_price_snapshot
            is_price_changed = False
            prev_price = None

            if snapshot is not None and snapshot != unit_price_curr:
                is_price_changed = True
                has_price_changes = True
                prev_price = snapshot
                diff = unit_price_curr - snapshot
                if diff > 0:
                    warnings.append(
                        f"Price for '{product.name}' increased from ₹{snapshot} to ₹{unit_price_curr}."
                    )
                else:
                    warnings.append(
                        f"Price for '{product.name}' decreased from ₹{snapshot} to ₹{unit_price_curr}."
                    )

            # Prescription evaluation
            rx_eval = await self.rx_service.evaluate_product_prescription(customer_id, product)
            if rx_eval.requires_prescription:
                has_prescription = True

            # Determine item-level validation status
            status_msg = None
            if not product.is_active or product.is_deleted:
                val_status = "inactive_product"
                status_msg = f"Product '{product.name}' is currently unavailable."
                blocking_errors.append(status_msg)
            elif sellable == 0:
                val_status = "insufficient_stock"
                status_msg = f"Product '{product.name}' is completely out of stock."
                blocking_errors.append(status_msg)
            elif quantity > sellable:
                val_status = "insufficient_stock"
                status_msg = f"Only {sellable} units of '{product.name}' available (requested {quantity})."
                blocking_errors.append(status_msg)
            elif rx_eval.requires_prescription and not rx_eval.is_eligible:
                val_status = rx_eval.validation_status
                status_msg = rx_eval.message
                blocking_errors.append(status_msg)
            elif is_price_changed:
                val_status = "price_changed"
                status_msg = f"Price updated to ₹{unit_price_curr}."
            else:
                val_status = "available"

            # Image
            img_url = None
            if product.images:
                primary = next((img for img in product.images if img.is_primary), product.images[0])
                img_url = primary.image_url

            item_dtos.append(
                CartItemResponse(
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
                    status_message=status_msg,
                )
            )

        cart_pricing = PricingService.calculate_cart_totals(item_calcs, settings, has_cold_chain=has_cold_chain)

        # Minimum cart value check
        if cart_pricing.subtotal < settings.minimum_cart_value:
            blocking_errors.append(
                f"Minimum order value is ₹{settings.minimum_cart_value}. Your current medicine subtotal is ₹{cart_pricing.subtotal}."
            )

        is_valid_for_checkout = len(blocking_errors) == 0

        return CartResponse(
            id=cart.id,
            customer_id=cart.customer_id,
            status=cart.status,
            items=item_dtos,
            item_count=len(item_dtos),
            total_quantity=total_quantity,
            subtotal=cart_pricing.subtotal,
            total_mrp=cart_pricing.total_mrp,
            total_discount=cart_pricing.total_discount,
            taxable_amount=cart_pricing.taxable_amount,
            total_tax=cart_pricing.total_tax,
            delivery_fee=cart_pricing.delivery_fee,
            free_delivery_threshold=cart_pricing.free_delivery_threshold,
            amount_needed_for_free_delivery=cart_pricing.amount_needed_for_free_delivery,
            grand_total=cart_pricing.grand_total,
            has_prescription_items=has_prescription,
            has_cold_chain_items=has_cold_chain,
            has_price_changes=has_price_changes,
            is_valid_for_checkout=is_valid_for_checkout,
            warnings=warnings,
            blocking_errors=blocking_errors,
        )
