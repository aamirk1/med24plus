from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

from app.models.checkout import CheckoutSetting
from app.models.product import Product

TWO_PLACES = Decimal("0.01")


class ItemPriceCalculation(BaseModel):
    unit_price: Decimal
    unit_mrp: Decimal
    quantity: int
    subtotal: Decimal
    mrp_subtotal: Decimal
    discount_amount: Decimal
    gst_rate: Decimal
    taxable_amount: Decimal
    tax_amount: Decimal
    cgst_amount: Decimal
    sgst_amount: Decimal
    igst_amount: Decimal

    @property
    def line_total(self) -> Decimal:
        return self.subtotal


class CartPricingSummary(BaseModel):
    subtotal: Decimal
    total_mrp: Decimal
    total_discount: Decimal
    taxable_amount: Decimal
    total_tax: Decimal
    cgst_total: Decimal
    sgst_total: Decimal
    igst_total: Decimal
    delivery_fee: Decimal
    free_delivery_threshold: Decimal
    amount_needed_for_free_delivery: Decimal
    grand_total: Decimal
    rate_breakdowns: List[Dict[str, Any]] = []

    @property
    def discount_total(self) -> Decimal:
        return self.total_discount

    @property
    def tax_total(self) -> Decimal:
        return self.total_tax

    @property
    def cgst_amount(self) -> Decimal:
        return self.cgst_total

    @property
    def sgst_amount(self) -> Decimal:
        return self.sgst_total

    @property
    def igst_amount(self) -> Decimal:
        return self.igst_total


class PricingService:
    """
    Centralized pricing and statutory taxation engine for Indian pharmacy operations.
    Enforces strict DPCO price ceilings, MRP non-exceedance, and statutory GST apportionment.
    Never uses floating-point arithmetic.
    """

    @staticmethod
    def calculate_item_price(
        product: Product,
        quantity: int,
        is_interstate: bool = False,
    ) -> ItemPriceCalculation:
        """
        Compute line item financials.
        Medicine retail prices in India are inclusive of GST.
        """
        if quantity <= 0:
            raise ValueError("Item quantity must be strictly greater than zero.")

        unit_price = Decimal(str(product.selling_price)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        unit_mrp = Decimal(str(product.mrp)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        gst_rate = Decimal(str(product.gst_rate if product.gst_rate is not None else "12.00")).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

        # Enforce statutory DPCO rule: selling price must never exceed MRP
        if unit_price > unit_mrp:
            unit_price = unit_mrp

        qty_dec = Decimal(quantity)
        subtotal = (unit_price * qty_dec).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        mrp_subtotal = (unit_mrp * qty_dec).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        discount_amount = max(Decimal("0.00"), mrp_subtotal - subtotal).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

        # GST extraction from inclusive price: Taxable = Subtotal / (1 + Rate / 100)
        tax_divisor = Decimal("1.00") + (gst_rate / Decimal("100.00"))
        taxable_amount = (subtotal / tax_divisor).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        tax_amount = max(Decimal("0.00"), subtotal - taxable_amount).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

        if is_interstate:
            igst_amount = tax_amount
            cgst_amount = Decimal("0.00")
            sgst_amount = Decimal("0.00")
        else:
            cgst_amount = (tax_amount / Decimal("2.00")).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
            sgst_amount = (tax_amount - cgst_amount).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
            igst_amount = Decimal("0.00")

        return ItemPriceCalculation(
            unit_price=unit_price,
            unit_mrp=unit_mrp,
            quantity=quantity,
            subtotal=subtotal,
            mrp_subtotal=mrp_subtotal,
            discount_amount=discount_amount,
            gst_rate=gst_rate,
            taxable_amount=taxable_amount,
            tax_amount=tax_amount,
            cgst_amount=cgst_amount,
            sgst_amount=sgst_amount,
            igst_amount=igst_amount,
        )

    @classmethod
    def calculate_cart_totals(
        cls,
        item_calculations: List[ItemPriceCalculation],
        settings: CheckoutSetting,
        has_cold_chain: bool = False,
    ) -> CartPricingSummary:
        """
        Aggregate full cart totals and apply statutory delivery charge tiers.
        """
        subtotal = Decimal("0.00")
        total_mrp = Decimal("0.00")
        total_discount = Decimal("0.00")
        taxable_amount = Decimal("0.00")
        total_tax = Decimal("0.00")
        cgst_total = Decimal("0.00")
        sgst_total = Decimal("0.00")
        igst_total = Decimal("0.00")

        # Map to group by GST rates for statutory reporting
        rate_groups: Dict[str, Dict[str, Decimal]] = {}

        for calc in item_calculations:
            subtotal += calc.subtotal
            total_mrp += calc.mrp_subtotal
            total_discount += calc.discount_amount
            taxable_amount += calc.taxable_amount
            total_tax += calc.tax_amount
            cgst_total += calc.cgst_amount
            sgst_total += calc.sgst_amount
            igst_total += calc.igst_amount

            rate_key = str(calc.gst_rate)
            if rate_key not in rate_groups:
                rate_groups[rate_key] = {
                    "taxable": Decimal("0.00"),
                    "cgst": Decimal("0.00"),
                    "sgst": Decimal("0.00"),
                    "igst": Decimal("0.00"),
                    "total_tax": Decimal("0.00"),
                }
            rate_groups[rate_key]["taxable"] += calc.taxable_amount
            rate_groups[rate_key]["cgst"] += calc.cgst_amount
            rate_groups[rate_key]["sgst"] += calc.sgst_amount
            rate_groups[rate_key]["igst"] += calc.igst_amount
            rate_groups[rate_key]["total_tax"] += calc.tax_amount

        # Delivery fee calculation
        free_threshold = Decimal(str(settings.free_delivery_threshold)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        standard_fee = Decimal(str(settings.standard_delivery_fee)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        cold_chain_fee = Decimal(str(settings.express_cold_chain_fee)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

        if subtotal == Decimal("0.00"):
            delivery_fee = Decimal("0.00")
            shortfall = free_threshold
        elif subtotal >= free_threshold:
            delivery_fee = Decimal("0.00")
            shortfall = Decimal("0.00")
        else:
            delivery_fee = standard_fee
            shortfall = max(Decimal("0.00"), free_threshold - subtotal).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

        # Cold chain priority surcharge if applicable and order does not exceed free tier
        if has_cold_chain and subtotal < free_threshold and cold_chain_fee > standard_fee:
            delivery_fee = cold_chain_fee

        grand_total = (subtotal + delivery_fee).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

        rate_breakdowns = [
            {
                "rate": rate,
                "taxable_amount": str(vals["taxable"].quantize(TWO_PLACES, rounding=ROUND_HALF_UP)),
                "cgst": str(vals["cgst"].quantize(TWO_PLACES, rounding=ROUND_HALF_UP)),
                "sgst": str(vals["sgst"].quantize(TWO_PLACES, rounding=ROUND_HALF_UP)),
                "igst": str(vals["igst"].quantize(TWO_PLACES, rounding=ROUND_HALF_UP)),
                "total_tax": str(vals["total_tax"].quantize(TWO_PLACES, rounding=ROUND_HALF_UP)),
            }
            for rate, vals in sorted(rate_groups.items())
        ]

        return CartPricingSummary(
            subtotal=subtotal.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            total_mrp=total_mrp.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            total_discount=total_discount.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            taxable_amount=taxable_amount.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            total_tax=total_tax.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            cgst_total=cgst_total.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            sgst_total=sgst_total.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            igst_total=igst_total.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            delivery_fee=delivery_fee,
            free_delivery_threshold=free_threshold,
            amount_needed_for_free_delivery=shortfall,
            grand_total=grand_total,
            rate_breakdowns=rate_breakdowns,
        )
