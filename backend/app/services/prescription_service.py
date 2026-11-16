import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.models.prescription import (
    Prescription,
    PrescriptionFile,
    PrescriptionItem,
    PrescriptionReviewLog,
)
from app.models.product import Product
from app.core.permissions import RoleEnum
from app.models.role import UserRole
from app.models.user import User
from app.repositories.prescription_repository import PrescriptionRepository
from app.schemas.prescription import (
    AdminPrescriptionResponse,
    AdminCustomerSummary,
    PaginationMeta,
    PrescriptionCustomerResponse,
    PrescriptionFileResponse,
    PrescriptionItemResponse,
    PrescriptionItemVerifyRequest,
    PrescriptionReviewLogResponse,
)
from app.services.prescription_rules import (
    PrescriptionStatusEnum,
    PrescriptionValidityPolicy,
    validate_status_transition,
)
from app.services.prescription_storage_service import (
    MAX_FILES_PER_PRESCRIPTION,
    prescription_storage_service,
)


class PrescriptionService:
    """Core prescription verification, lifecycle management, and statutory audit service."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PrescriptionRepository(db)

    def _build_file_response(self, f: PrescriptionFile) -> PrescriptionFileResponse:
        """Convert a database PrescriptionFile to schema with short-lived secure viewing URLs."""
        token = prescription_storage_service.generate_signed_view_token(f.id)
        view_url = f"/api/v1/prescriptions/{f.prescription_id}/files/{f.id}/view?token={token}"
        download_url = f"/api/v1/prescriptions/{f.prescription_id}/files/{f.id}/download?token={token}"
        return PrescriptionFileResponse(
            id=f.id,
            prescription_id=f.prescription_id,
            original_filename=f.original_filename,
            file_type=f.file_type,
            file_size=f.file_size,
            storage_provider=f.storage_provider,
            checksum=f.checksum,
            file_category=f.file_category,
            is_active=f.is_active,
            uploaded_at=f.uploaded_at,
            secure_view_url=view_url,
            secure_download_url=download_url,
        )

    def _build_customer_response(self, rx: Prescription) -> PrescriptionCustomerResponse:
        """Convert Prescription model to customer DTO."""
        file_dtos = [self._build_file_response(f) for f in (rx.files or []) if f.is_active]
        item_dtos = [
            PrescriptionItemResponse(
                id=item.id,
                prescription_id=item.prescription_id,
                product_id=item.product_id,
                product_name=item.product.name if item.product else None,
                medicine_name_prescribed=item.medicine_name_prescribed,
                dosage=item.dosage,
                frequency=item.frequency,
                duration_days=item.duration_days,
                quantity_prescribed=item.quantity_prescribed,
                quantity_approved=item.quantity_approved,
                is_verified=item.is_verified,
                verification_status=item.verification_status,
                pharmacist_remarks=item.pharmacist_remarks,
            )
            for item in (rx.items or [])
        ]
        log_dtos = [
            PrescriptionReviewLogResponse(
                id=log.id,
                prescription_id=log.prescription_id,
                pharmacist_id=log.pharmacist_id,
                pharmacist_name=log.pharmacist.full_name if log.pharmacist else None,
                pharmacist_registration_no=log.pharmacist_profile.registration_number if log.pharmacist_profile else None,
                previous_status=log.previous_status,
                new_status=log.new_status,
                action=log.action,
                decision=log.action,
                notes=log.notes,
                remarks=log.notes,
                ip_address=log.ip_address,
                created_at=log.created_at,
            )
            for log in (rx.review_logs or [])
        ]

        return PrescriptionCustomerResponse(
            id=rx.id,
            prescription_number=rx.prescription_reference,
            prescription_reference=rx.prescription_reference,
            customer_id=rx.customer_id,
            status=rx.prescription_status,
            prescription_status=rx.prescription_status,
            patient_name=rx.patient_name,
            patient_age=rx.patient_age,
            patient_gender=rx.patient_gender,
            doctor_name=rx.doctor_name,
            doctor_registration_no=rx.doctor_registration_no,
            doctor_clinic_or_hospital=rx.doctor_clinic_or_hospital,
            prescription_date=rx.prescription_date,
            valid_until=rx.valid_until,
            is_valid=rx.is_valid,
            invalidity_reason=rx.invalidity_reason,
            pharmacist_notes=rx.pharmacist_notes,
            rejection_reason=rx.rejection_reason,
            clarification_remarks=rx.clarification_remarks,
            customer_notes=rx.customer_notes,
            uploaded_at=rx.created_at,
            reviewed_at=rx.reviewed_at,
            rejected_at=rx.rejected_at,
            files=file_dtos,
            items=item_dtos,
            review_logs=log_dtos,
        )

    def _build_admin_response(self, rx: Prescription) -> AdminPrescriptionResponse:
        """Convert Prescription model to admin/pharmacist workbench DTO."""
        base = self._build_customer_response(rx)

        cust_summary = None
        if rx.customer:
            cust_summary = AdminCustomerSummary(
                id=rx.customer.id,
                full_name=rx.customer.full_name,
                phone_number=rx.customer.phone,
                email=rx.customer.email,
            )

        reviewed_by_name = rx.reviewed_by.full_name if rx.reviewed_by else None
        rejected_by_name = rx.rejected_by.full_name if rx.rejected_by else None
        under_review_by_name = rx.under_review_by.full_name if rx.under_review_by else None

        return AdminPrescriptionResponse(
            **base.model_dump(),
            customer=cust_summary,
            reviewed_by_name=reviewed_by_name,
            rejected_by_name=rejected_by_name,
            under_review_by_name=under_review_by_name,
        )

    async def upload_prescription(
        self,
        customer: User,
        files: List[UploadFile],
        patient_name: Optional[str] = None,
        patient_age: Optional[int] = None,
        patient_gender: Optional[str] = None,
        doctor_name: Optional[str] = None,
        doctor_registration_no: Optional[str] = None,
        doctor_clinic_or_hospital: Optional[str] = None,
        prescription_date: Optional[date] = None,
        customer_notes: Optional[str] = None,
        associated_product_ids: Optional[List[uuid.UUID]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> PrescriptionCustomerResponse:
        """
        Handle customer prescription upload with multiple files, integrity verification,
        private storage persistence, catalog product linking, and in-app alerts.
        """
        if not files or len(files) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "At least one prescription file document is required."},
            )

        if len(files) > MAX_FILES_PER_PRESCRIPTION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Cannot upload more than {MAX_FILES_PER_PRESCRIPTION} files per prescription.",
                },
            )

        ref_number = await self.repo.generate_unique_reference()

        # Check prescription date validity
        is_valid = True
        invalidity_reason = None
        if prescription_date:
            is_valid, invalidity_reason = PrescriptionValidityPolicy.evaluate_prescription_validity(
                prescription_date=prescription_date,
                valid_until=None,
            )

        # 1. Create prescription parent record
        prescription = Prescription(
            customer_id=customer.id,
            prescription_reference=ref_number,
            prescription_status=PrescriptionStatusEnum.PENDING_REVIEW.value,
            patient_name=patient_name or (customer.profile.full_name if customer.profile else "Patient"),
            patient_age=patient_age,
            patient_gender=patient_gender,
            doctor_name=doctor_name,
            doctor_registration_no=doctor_registration_no,
            doctor_clinic_or_hospital=doctor_clinic_or_hospital,
            prescription_date=prescription_date,
            customer_notes=customer_notes,
            is_valid=is_valid,
            invalidity_reason=invalidity_reason,
        )
        await self.repo.create(prescription)

        # 2. Process and save each file
        first_file = True
        for file in files:
            storage_key, orig_name, file_size, mime_type, checksum = await prescription_storage_service.save_prescription_file(
                file=file,
                customer_id=customer.id,
                prescription_id=prescription.id,
            )

            # Store legacy fields for backward compatibility on first file
            if first_file:
                prescription.storage_object_key = storage_key
                prescription.original_filename = orig_name
                prescription.file_size_bytes = file_size
                prescription.file_mime_type = mime_type
                first_file = False

            rx_file = PrescriptionFile(
                prescription_id=prescription.id,
                original_filename=orig_name,
                storage_key=storage_key,
                file_type=mime_type,
                file_size=file_size,
                storage_provider="local",
                checksum=checksum,
                file_category="initial",
                is_active=True,
                uploaded_by_id=customer.id,
            )
            await self.repo.add_file(rx_file)

        # 3. Associate catalog products if provided
        if associated_product_ids:
            for pid in associated_product_ids:
                stmt = select(Product).where(Product.id == pid, Product.is_deleted == False)  # noqa: E712
                prod_res = await self.db.execute(stmt)
                prod = prod_res.scalars().first()
                if prod:
                    item = PrescriptionItem(
                        prescription_id=prescription.id,
                        product_id=prod.id,
                        medicine_name_prescribed=prod.name,
                        dosage=prod.strength,
                        quantity_prescribed=1,
                        quantity_approved=0,
                        is_verified=False,
                        verification_status="pending",
                    )
                    await self.repo.add_item(item)

        # 4. Audit Log
        audit = AuditLog(
            actor_id=customer.id,
            actor_role="customer",
            action="PRESCRIPTION_UPLOADED",
            entity_type="Prescription",
            entity_id=str(prescription.id),
            before_state=None,
            after_state={
                "prescription_reference": ref_number,
                "status": PrescriptionStatusEnum.PENDING_REVIEW.value,
                "files_count": len(files),
                "is_valid": is_valid,
            },
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(audit)

        # 5. In-app Notification for Customer
        customer_notif = Notification(
            user_id=customer.id,
            title="Prescription Submitted for Review",
            message=f"Prescription {ref_number} has been submitted to our licensed pharmacists for clinical verification.",
            notification_type="prescription_submitted",
            reference_type="prescription",
            reference_id=prescription.id,
            is_read=False,
        )
        self.db.add(customer_notif)

        # 6. Notify Pharmacists
        pharmacist_stmt = (
            select(User.id)
            .join(UserRole, UserRole.user_id == User.id)
            .where(UserRole.role_id.in_(
                select(UserRole.role_id).where(User.phone.is_not(None))  # will notify active pharmacist roles
            ))
            .limit(5)
        )
        # Note: commit transaction
        await self.db.commit()

        # Reload with relations
        reloaded = await self.repo.get_by_id_with_relations(prescription.id)
        return self._build_customer_response(reloaded or prescription)

    async def add_clarification_files(
        self,
        prescription_id: uuid.UUID,
        customer: User,
        files: List[UploadFile],
        customer_notes: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> PrescriptionCustomerResponse:
        """
        Customer uploads supplementary documentation in response to a pharmacist clarification request.
        Resets prescription status back to PENDING_REVIEW for pharmacist re-audit.
        """
        prescription = await self.repo.get_by_id_for_update(prescription_id)
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Prescription record not found."},
            )

        if prescription.customer_id != customer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"success": False, "message": "You do not have access to this prescription."},
            )

        if prescription.prescription_status != PrescriptionStatusEnum.CLARIFICATION_REQUIRED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Clarification documents cannot be added when status is '{prescription.prescription_status}'.",
                },
            )

        if not files or len(files) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "At least one clarification file is required."},
            )

        prev_status = prescription.prescription_status
        validate_status_transition(prev_status, PrescriptionStatusEnum.PENDING_REVIEW.value)

        # Process new files
        for file in files:
            storage_key, orig_name, file_size, mime_type, checksum = await prescription_storage_service.save_prescription_file(
                file=file,
                customer_id=customer.id,
                prescription_id=prescription.id,
            )

            rx_file = PrescriptionFile(
                prescription_id=prescription.id,
                original_filename=orig_name,
                storage_key=storage_key,
                file_type=mime_type,
                file_size=file_size,
                storage_provider="local",
                checksum=checksum,
                file_category="clarification",
                is_active=True,
                uploaded_by_id=customer.id,
            )
            await self.repo.add_file(rx_file)

        if customer_notes:
            prescription.customer_notes = (prescription.customer_notes or "") + f"\n[Clarification]: {customer_notes}"

        # Transition back to pending_review
        prescription.prescription_status = PrescriptionStatusEnum.PENDING_REVIEW.value
        prescription.under_review_at = None
        prescription.under_review_by_id = None

        # Audit log
        audit = AuditLog(
            actor_id=customer.id,
            actor_role="customer",
            action="CLARIFICATION_DOCUMENTS_SUBMITTED",
            entity_type="Prescription",
            entity_id=str(prescription.id),
            before_state={"status": prev_status},
            after_state={
                "status": PrescriptionStatusEnum.PENDING_REVIEW.value,
                "clarification_files_added": len(files),
            },
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(audit)

        await self.db.commit()

        reloaded = await self.repo.get_by_id_with_relations(prescription.id)
        return self._build_customer_response(reloaded or prescription)

    async def cancel_prescription(
        self,
        prescription_id: uuid.UUID,
        customer: User,
        reason: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> PrescriptionCustomerResponse:
        """Customer cancels their own pending prescription."""
        prescription = await self.repo.get_by_id_for_update(prescription_id)
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Prescription record not found."},
            )

        if prescription.customer_id != customer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"success": False, "message": "You cannot cancel another customer's prescription."},
            )

        prev_status = prescription.prescription_status
        validate_status_transition(prev_status, PrescriptionStatusEnum.CANCELLED.value)

        prescription.prescription_status = PrescriptionStatusEnum.CANCELLED.value
        prescription.pharmacist_notes = (prescription.pharmacist_notes or "") + f"\n[Cancelled by Customer]: {reason or 'No reason provided'}"

        audit = AuditLog(
            actor_id=customer.id,
            actor_role="customer",
            action="PRESCRIPTION_CANCELLED_BY_CUSTOMER",
            entity_type="Prescription",
            entity_id=str(prescription.id),
            before_state={"status": prev_status},
            after_state={"status": PrescriptionStatusEnum.CANCELLED.value, "reason": reason},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(audit)

        await self.db.commit()
        reloaded = await self.repo.get_by_id_with_relations(prescription.id)
        return self._build_customer_response(reloaded or prescription)

    async def start_review(
        self,
        prescription_id: uuid.UUID,
        pharmacist: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AdminPrescriptionResponse:
        """Mark prescription under active clinical review by a verified pharmacist."""
        prescription = await self.repo.get_by_id_for_update(prescription_id)
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Prescription not found."},
            )

        prev_status = prescription.prescription_status
        validate_status_transition(prev_status, PrescriptionStatusEnum.UNDER_REVIEW.value)

        prescription.prescription_status = PrescriptionStatusEnum.UNDER_REVIEW.value
        prescription.under_review_at = datetime.now()
        prescription.under_review_by_id = pharmacist.id

        # Statutory review log
        profile_id = pharmacist.pharmacist_profile.id if pharmacist.pharmacist_profile else None
        log = PrescriptionReviewLog(
            prescription_id=prescription.id,
            pharmacist_id=pharmacist.id,
            pharmacist_profile_id=profile_id,
            previous_status=prev_status,
            new_status=PrescriptionStatusEnum.UNDER_REVIEW.value,
            action="START_REVIEW",
            notes="Pharmacist initiated clinical verification of prescription document.",
            ip_address=ip_address,
        )
        await self.repo.add_review_log(log)

        # Audit log
        audit = AuditLog(
            actor_id=pharmacist.id,
            actor_role="pharmacist",
            action="PRESCRIPTION_REVIEW_STARTED",
            entity_type="Prescription",
            entity_id=str(prescription.id),
            before_state={"status": prev_status},
            after_state={"status": PrescriptionStatusEnum.UNDER_REVIEW.value, "under_review_by": str(pharmacist.id)},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(audit)

        await self.db.commit()
        reloaded = await self.repo.get_by_id_with_relations(prescription.id)
        return self._build_admin_response(reloaded or prescription)

    async def approve_prescription(
        self,
        prescription_id: uuid.UUID,
        pharmacist: User,
        pharmacist_notes: Optional[str] = None,
        valid_until: Optional[date] = None,
        verified_items: Optional[List[PrescriptionItemVerifyRequest]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AdminPrescriptionResponse:
        """
        Pharmacist clinical approval under Rule 65 of the Drugs and Cosmetics Rules, 1945.
        Enforces state transition, records statutory audit trail, sets validity period,
        and alerts the customer.
        """
        prescription = await self.repo.get_by_id_for_update(prescription_id)
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Prescription not found."},
            )

        prev_status = prescription.prescription_status
        validate_status_transition(prev_status, PrescriptionStatusEnum.APPROVED.value)

        # Compute validity if not provided
        if not valid_until:
            valid_until = PrescriptionValidityPolicy.calculate_default_valid_until(
                prescription_date=prescription.prescription_date or date.today()
            )

        # Update items verification
        if verified_items:
            for v_item in verified_items:
                if v_item.item_id:
                    item_rec = await self.repo.get_item(v_item.item_id)
                    if item_rec:
                        item_rec.is_verified = v_item.is_verified
                        item_rec.quantity_approved = v_item.quantity_approved
                        item_rec.verification_status = v_item.verification_status
                        if v_item.pharmacist_remarks:
                            item_rec.pharmacist_remarks = v_item.pharmacist_remarks
                elif v_item.medicine_name_prescribed:
                    # New line item extracted by pharmacist
                    new_item = PrescriptionItem(
                        prescription_id=prescription.id,
                        product_id=v_item.product_id,
                        medicine_name_prescribed=v_item.medicine_name_prescribed,
                        dosage=v_item.dosage,
                        frequency=v_item.frequency,
                        duration_days=v_item.duration_days,
                        quantity_prescribed=v_item.quantity_prescribed or 1,
                        quantity_approved=v_item.quantity_approved,
                        is_verified=v_item.is_verified,
                        verification_status=v_item.verification_status,
                        pharmacist_remarks=v_item.pharmacist_remarks,
                    )
                    await self.repo.add_item(new_item)

        # Update prescription
        prescription.prescription_status = PrescriptionStatusEnum.APPROVED.value
        prescription.reviewed_by_id = pharmacist.id
        prescription.reviewed_at = datetime.now()
        prescription.pharmacist_notes = pharmacist_notes
        prescription.valid_until = valid_until
        prescription.is_valid = True
        prescription.invalidity_reason = None

        # Statutory review log
        profile_id = pharmacist.pharmacist_profile.id if pharmacist.pharmacist_profile else None
        log = PrescriptionReviewLog(
            prescription_id=prescription.id,
            pharmacist_id=pharmacist.id,
            pharmacist_profile_id=profile_id,
            previous_status=prev_status,
            new_status=PrescriptionStatusEnum.APPROVED.value,
            action="APPROVED",
            notes=pharmacist_notes or "Prescription verified and approved for dispensing.",
            ip_address=ip_address,
        )
        await self.repo.add_review_log(log)

        # Audit log
        audit = AuditLog(
            actor_id=pharmacist.id,
            actor_role="pharmacist",
            action="PRESCRIPTION_APPROVED",
            entity_type="Prescription",
            entity_id=str(prescription.id),
            before_state={"status": prev_status},
            after_state={
                "status": PrescriptionStatusEnum.APPROVED.value,
                "valid_until": valid_until.isoformat() if valid_until else None,
                "pharmacist_notes": pharmacist_notes,
            },
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(audit)

        # In-app Notification for Customer
        notif = Notification(
            user_id=prescription.customer_id,
            title="Prescription Approved",
            message=f"Prescription {prescription.prescription_reference} has been clinically verified and approved by our registered pharmacist.",
            notification_type="prescription_approved",
            reference_type="prescription",
            reference_id=prescription.id,
            is_read=False,
        )
        self.db.add(notif)

        await self.db.commit()
        reloaded = await self.repo.get_by_id_with_relations(prescription.id)
        return self._build_admin_response(reloaded or prescription)

    async def reject_prescription(
        self,
        prescription_id: uuid.UUID,
        pharmacist: User,
        rejection_reason: str,
        pharmacist_notes: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AdminPrescriptionResponse:
        """
        Pharmacist rejects prescription.
        Mandatory statutory rejection reason is recorded. Terminal state.
        """
        if not rejection_reason or not rejection_reason.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "A specific statutory rejection reason is mandatory under Rule 65."},
            )

        prescription = await self.repo.get_by_id_for_update(prescription_id)
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Prescription not found."},
            )

        prev_status = prescription.prescription_status
        validate_status_transition(prev_status, PrescriptionStatusEnum.REJECTED.value)

        prescription.prescription_status = PrescriptionStatusEnum.REJECTED.value
        prescription.rejected_by_id = pharmacist.id
        prescription.rejected_at = datetime.now()
        prescription.rejection_reason = rejection_reason.strip()
        if pharmacist_notes:
            prescription.pharmacist_notes = pharmacist_notes

        # Statutory review log
        profile_id = pharmacist.pharmacist_profile.id if pharmacist.pharmacist_profile else None
        log = PrescriptionReviewLog(
            prescription_id=prescription.id,
            pharmacist_id=pharmacist.id,
            pharmacist_profile_id=profile_id,
            previous_status=prev_status,
            new_status=PrescriptionStatusEnum.REJECTED.value,
            action="REJECTED",
            notes=f"Rejection Reason: {rejection_reason.strip()}",
            ip_address=ip_address,
        )
        await self.repo.add_review_log(log)

        # Audit log
        audit = AuditLog(
            actor_id=pharmacist.id,
            actor_role="pharmacist",
            action="PRESCRIPTION_REJECTED",
            entity_type="Prescription",
            entity_id=str(prescription.id),
            before_state={"status": prev_status},
            after_state={
                "status": PrescriptionStatusEnum.REJECTED.value,
                "rejection_reason": rejection_reason.strip(),
            },
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(audit)

        # In-app Notification for Customer
        notif = Notification(
            user_id=prescription.customer_id,
            title="Prescription Rejected",
            message=f"Prescription {prescription.prescription_reference} could not be approved. Reason: {rejection_reason.strip()}",
            notification_type="prescription_rejected",
            reference_type="prescription",
            reference_id=prescription.id,
            is_read=False,
        )
        self.db.add(notif)

        await self.db.commit()
        reloaded = await self.repo.get_by_id_with_relations(prescription.id)
        return self._build_admin_response(reloaded or prescription)

    async def request_clarification(
        self,
        prescription_id: uuid.UUID,
        pharmacist: User,
        clarification_remarks: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AdminPrescriptionResponse:
        """
        Pharmacist requests patient clarification (e.g. illegible scan, missing signature, dosage ambiguity).
        """
        if not clarification_remarks or not clarification_remarks.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Clarification instructions are required."},
            )

        prescription = await self.repo.get_by_id_for_update(prescription_id)
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Prescription not found."},
            )

        prev_status = prescription.prescription_status
        validate_status_transition(prev_status, PrescriptionStatusEnum.CLARIFICATION_REQUIRED.value)

        prescription.prescription_status = PrescriptionStatusEnum.CLARIFICATION_REQUIRED.value
        prescription.clarification_requested_by_id = pharmacist.id
        prescription.clarification_requested_at = datetime.now()
        prescription.clarification_remarks = clarification_remarks.strip()

        # Statutory review log
        profile_id = pharmacist.pharmacist_profile.id if pharmacist.pharmacist_profile else None
        log = PrescriptionReviewLog(
            prescription_id=prescription.id,
            pharmacist_id=pharmacist.id,
            pharmacist_profile_id=profile_id,
            previous_status=prev_status,
            new_status=PrescriptionStatusEnum.CLARIFICATION_REQUIRED.value,
            action="REQUEST_CLARIFICATION",
            notes=f"Clarification Requested: {clarification_remarks.strip()}",
            ip_address=ip_address,
        )
        await self.repo.add_review_log(log)

        # Audit log
        audit = AuditLog(
            actor_id=pharmacist.id,
            actor_role="pharmacist",
            action="PRESCRIPTION_CLARIFICATION_REQUESTED",
            entity_type="Prescription",
            entity_id=str(prescription.id),
            before_state={"status": prev_status},
            after_state={
                "status": PrescriptionStatusEnum.CLARIFICATION_REQUIRED.value,
                "clarification_remarks": clarification_remarks.strip(),
            },
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(audit)

        # In-app Notification for Customer
        notif = Notification(
            user_id=prescription.customer_id,
            title="Prescription Clarification Required",
            message=f"Pharmacist requested clarification for {prescription.prescription_reference}: {clarification_remarks.strip()}",
            notification_type="prescription_clarification_required",
            reference_type="prescription",
            reference_id=prescription.id,
            is_read=False,
        )
        self.db.add(notif)

        await self.db.commit()
        reloaded = await self.repo.get_by_id_with_relations(prescription.id)
        return self._build_admin_response(reloaded or prescription)

    async def get_customer_prescription(
        self,
        prescription_id: uuid.UUID,
        customer: User,
    ) -> PrescriptionCustomerResponse:
        """Fetch prescription with customer ownership enforcement."""
        prescription = await self.repo.get_by_id_with_relations(prescription_id)
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Prescription record not found."},
            )

        if prescription.customer_id != customer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"success": False, "message": "Access forbidden: you do not own this prescription."},
            )

        return self._build_customer_response(prescription)

    async def get_admin_prescription(
        self,
        prescription_id: uuid.UUID,
    ) -> AdminPrescriptionResponse:
        """Fetch prescription details for authorized pharmacist/admin."""
        prescription = await self.repo.get_by_id_with_relations(prescription_id)
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Prescription record not found."},
            )
        return self._build_admin_response(prescription)
