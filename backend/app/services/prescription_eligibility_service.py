import uuid
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.prescription import Prescription, PrescriptionItem
from app.models.product import Product
from app.services.prescription_rules import PrescriptionValidityPolicy


class ProductPrescriptionEvaluation(BaseModel):
    requires_prescription: bool
    schedule_classification: str
    is_eligible: bool
    validation_status: str  # 'not_required', 'eligible', 'prescription_required', 'prescription_pending_review', 'pharmacist_review_required', 'prescription_rejected', 'prescription_expired'
    prescription_reference: Optional[str] = None
    prescription_id: Optional[uuid.UUID] = None
    message: str


class PrescriptionEligibilityService:
    """
    Statutory prescription eligibility evaluator integrating Phase 6 clinical records.
    Verifies that prescription-required medicines under Drugs and Cosmetics Rules (Rule 65)
    are strictly associated with valid, pharmacist-approved clinical orders.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def evaluate_product_prescription(
        self,
        customer_id: uuid.UUID,
        product: Product,
    ) -> ProductPrescriptionEvaluation:
        """
        Evaluate customer's statutory eligibility to purchase a specific product.
        """
        if not product.requires_prescription:
            return ProductPrescriptionEvaluation(
                requires_prescription=False,
                schedule_classification=product.schedule_classification or "OTC",
                is_eligible=True,
                validation_status="not_required",
                message="Prescription not required for this product.",
            )

        # Product requires prescription - query customer's prescriptions
        stmt = (
            select(Prescription)
            .where(
                Prescription.customer_id == customer_id,
                Prescription.is_deleted == False,  # noqa: E712
            )
            .options(
                selectinload(Prescription.items),
            )
            .order_by(Prescription.created_at.desc())
        )
        result = await self.db.execute(stmt)
        customer_prescriptions: List[Prescription] = list(result.scalars().all())

        if not customer_prescriptions:
            return ProductPrescriptionEvaluation(
                requires_prescription=True,
                schedule_classification=product.schedule_classification or "Schedule H",
                is_eligible=False,
                validation_status="prescription_required",
                message=f"Valid doctor's prescription is required for {product.name} ({product.schedule_classification or 'Schedule H'}).",
            )

        # 1. Search for an approved, legally valid prescription explicitly authorizing this medicine
        for rx in customer_prescriptions:
            if rx.prescription_status == "approved":
                # Check validity under Rule 65
                is_valid, invalid_reason = PrescriptionValidityPolicy.evaluate_prescription_validity(
                    rx.prescription_date, rx.valid_until, [product]
                )
                if not is_valid:
                    continue  # This prescription is expired or lapsed

                # Check if this prescription covers this medicine
                # A prescription item matches if product_id matches or medicine_name matches
                matched = False
                for item in rx.items:
                    if item.product_id == product.id:
                        matched = True
                        break
                    # Name matching fallback
                    item_name_clean = item.medicine_name_prescribed.lower().strip()
                    prod_name_clean = product.name.lower().strip()
                    prod_generic_clean = (product.generic_name or "").lower().strip()
                    if (
                        item_name_clean in prod_name_clean
                        or prod_name_clean in item_name_clean
                        or (prod_generic_clean and item_name_clean in prod_generic_clean)
                    ):
                        matched = True
                        break

                # If the prescription was approved and either has matching item or is a general approved Rx
                # (when pharmacist approved the overall prescription for customer orders)
                if matched or (len(rx.items) == 0 and rx.prescription_status == "approved"):
                    return ProductPrescriptionEvaluation(
                        requires_prescription=True,
                        schedule_classification=product.schedule_classification or "Schedule H",
                        is_eligible=True,
                        validation_status="eligible",
                        prescription_reference=rx.prescription_reference,
                        prescription_id=rx.id,
                        message=f"Approved under prescription {rx.prescription_reference}.",
                    )

        # 2. Check if customer has prescriptions in review
        for rx in customer_prescriptions:
            if rx.prescription_status in {"pending_review", "under_review"}:
                return ProductPrescriptionEvaluation(
                    requires_prescription=True,
                    schedule_classification=product.schedule_classification or "Schedule H",
                    is_eligible=False,
                    validation_status="prescription_pending_review",
                    prescription_reference=rx.prescription_reference,
                    prescription_id=rx.id,
                    message=f"Uploaded prescription ({rx.prescription_reference}) is pending pharmacist review.",
                )

        # 3. Check if customer has prescriptions with clarification requested
        for rx in customer_prescriptions:
            if rx.prescription_status == "clarification_required":
                return ProductPrescriptionEvaluation(
                    requires_prescription=True,
                    schedule_classification=product.schedule_classification or "Schedule H",
                    is_eligible=False,
                    validation_status="pharmacist_review_required",
                    prescription_reference=rx.prescription_reference,
                    prescription_id=rx.id,
                    message=f"Pharmacist requested clarification on prescription ({rx.prescription_reference}).",
                )

        # 4. Check if customer has expired prescriptions
        for rx in customer_prescriptions:
            if rx.prescription_status == "expired":
                return ProductPrescriptionEvaluation(
                    requires_prescription=True,
                    schedule_classification=product.schedule_classification or "Schedule H",
                    is_eligible=False,
                    validation_status="prescription_expired",
                    prescription_reference=rx.prescription_reference,
                    prescription_id=rx.id,
                    message=f"Previous prescription ({rx.prescription_reference}) has expired under Rule 65.",
                )

        # 5. Check if customer has rejected prescriptions
        for rx in customer_prescriptions:
            if rx.prescription_status == "rejected":
                reason = rx.rejection_reason or "Statutory requirement unmet"
                return ProductPrescriptionEvaluation(
                    requires_prescription=True,
                    schedule_classification=product.schedule_classification or "Schedule H",
                    is_eligible=False,
                    validation_status="prescription_rejected",
                    prescription_reference=rx.prescription_reference,
                    prescription_id=rx.id,
                    message=f"Prescription {rx.prescription_reference} was rejected: {reason}.",
                )

        # 6. Fallback: prescription required
        return ProductPrescriptionEvaluation(
            requires_prescription=True,
            schedule_classification=product.schedule_classification or "Schedule H",
            is_eligible=False,
            validation_status="prescription_required",
            message=f"No matching approved prescription found for {product.name}.",
        )
