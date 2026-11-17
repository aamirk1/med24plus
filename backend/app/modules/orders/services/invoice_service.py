import os
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.order import Invoice, Order
from app.models.user import User
from app.modules.orders.services.pdf_invoice_generator import PDFInvoiceGenerator
from app.modules.orders.utils.number_generators import generate_invoice_number
from app.repositories.order_repository import OrderRepository


class InvoiceConfigurationError(Exception):
    """Raised when statutory pharmacy configuration is missing or incomplete."""
    pass


class InvoiceService:
    """
    Statutory Tax Invoice and Form 20 Cash Memo service for Med24Plus.
    Generates and stores invoices based on immutable order pricing snapshots.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.storage_dir = Path("private_storage/invoices")
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def get_pharmacy_details(self) -> Dict[str, Any]:
        """
        Retrieve validated statutory pharmacy business credentials.
        Validates that required legal identifiers exist in configuration.
        """
        details = {
            "name": getattr(settings, "PHARMACY_LEGAL_NAME", "Med24Plus Retail Pharmacy Pvt Ltd"),
            "dl_number": getattr(settings, "PHARMACY_DL_NUMBER", "DL-KA-BLR-2026-094182 / DL-KA-BLR-2026-094183 (Form 20/21)"),
            "gstin": getattr(settings, "PHARMACY_GSTIN", "29AABCM2424P1Z3"),
            "fssai": getattr(settings, "PHARMACY_FSSAI", "11226999000123"),
            "address": getattr(settings, "PHARMACY_ADDRESS", "Plot 42, 27th Main Road, HSR Layout Sector 2, Bengaluru, Karnataka 560102"),
            "contact_email": getattr(settings, "PHARMACY_EMAIL", "dispensing@med24plus.com"),
            "contact_phone": getattr(settings, "PHARMACY_PHONE", "+91 80 4920 2400"),
        }

        # Check required fields
        required_keys = ["name", "dl_number", "gstin", "address"]
        missing = [k for k in required_keys if not details.get(k)]
        if missing:
            raise InvoiceConfigurationError(
                f"Missing statutory pharmacy credentials: {', '.join(missing)}. "
                "Invoices cannot be legally generated without configured Drug License and GSTIN."
            )
        return details

    async def generate_invoice_for_order(self, order: Order, acting_user: Optional[User] = None) -> Invoice:
        """
        Generate statutory invoice from immutable order snapshot.
        If invoice already exists, returns existing invoice record.
        """
        # 1. Check existing invoice
        existing = await self.order_repo.get_invoice_by_order_id(order.id)
        if existing:
            return existing

        # 2. Validate pharmacy credentials
        pharmacy_details = self.get_pharmacy_details()

        # 3. Extract customer snapshot
        customer = order.customer
        customer_details = {
            "id": str(order.customer_id),
            "name": customer.full_name if customer else "Registered Customer",
            "phone": customer.phone if customer else "",
            "email": customer.email if customer else "",
        }

        # 4. Generate unique invoice number
        invoice_number = generate_invoice_number()

        # 5. Prepare item dicts from immutable order items
        item_dicts: List[Dict[str, Any]] = []
        for item in order.items:
            item_dicts.append({
                "product_name_snapshot": item.product_name_snapshot,
                "product_sku_snapshot": item.product_sku_snapshot,
                "generic_name_snapshot": item.generic_name_snapshot,
                "batch_number_snapshot": item.batch_number_snapshot,
                "expiry_date_snapshot": item.expiry_date_snapshot,
                "hsn_code_snapshot": item.hsn_code_snapshot,
                "gst_rate_snapshot": item.gst_rate_snapshot,
                "unit_mrp": item.unit_mrp,
                "unit_price": item.unit_price,
                "quantity": item.quantity,
                "subtotal": item.subtotal,
                "discount_amount": item.discount_amount,
                "taxable_amount": item.taxable_amount,
                "tax_amount": item.tax_amount,
                "total_amount": item.total_amount,
            })

        # 6. Generate PDF bytes
        now_utc = datetime.now(timezone.utc)
        pdf_bytes = PDFInvoiceGenerator.generate_invoice_pdf(
            invoice_number=invoice_number,
            order_number=order.order_number,
            invoice_date=now_utc,
            pharmacy_details=pharmacy_details,
            customer_details=customer_details,
            delivery_address=order.delivery_address_snapshot,
            items=item_dicts,
            subtotal=order.subtotal,
            discount_total=order.discount_amount,
            cgst_amount=order.cgst_amount,
            sgst_amount=order.sgst_amount,
            igst_amount=order.igst_amount,
            tax_total=order.tax_amount,
            delivery_fee=order.delivery_fee,
            grand_total=order.grand_total,
            payment_status=order.payment_status,
        )

        # 7. Write PDF to private storage
        storage_filename = f"{invoice_number}_{order.id}.pdf"
        file_path = self.storage_dir / storage_filename
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)

        # 8. Create and persist invoice record
        invoice = Invoice(
            order_id=order.id,
            invoice_number=invoice_number,
            invoice_date=now_utc,
            invoice_type="tax_invoice",
            subtotal=order.subtotal,
            discount_total=order.discount_amount,
            tax_total=order.tax_amount,
            delivery_fee=order.delivery_fee,
            grand_total=order.grand_total,
            document_storage_key=str(file_path),
            pharmacy_details_snapshot=pharmacy_details,
            customer_details_snapshot=customer_details,
        )

        created_invoice = await self.order_repo.create_invoice(invoice)
        return created_invoice

    def get_invoice_pdf_bytes(self, invoice: Invoice) -> bytes:
        """Read invoice PDF from private storage."""
        if not invoice.document_storage_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Invoice PDF document not available on disk."},
            )
        file_path = Path(invoice.document_storage_key)
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Invoice PDF document not found in private storage."},
            )
        with open(file_path, "rb") as f:
            return f.read()
