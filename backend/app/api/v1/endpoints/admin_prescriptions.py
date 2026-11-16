import math
import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    require_role,
    require_verified_pharmacist,
)
from app.core.permissions import RoleEnum
from app.models.prescription import PrescriptionItem
from app.models.user import User
from app.schemas.common import APIResponse, PaginatedData, PaginationMeta
from app.schemas.prescription import (
    AdminPrescriptionResponse,
    PrescriptionApproveRequest,
    PrescriptionClarificationRequest,
    PrescriptionItemCreate,
    PrescriptionItemResponse,
    PrescriptionItemVerifyRequest,
    PrescriptionRejectRequest,
    PrescriptionReviewLogResponse,
    PrescriptionSummaryCountsResponse,
)
from app.services.prescription_service import PrescriptionService

router = APIRouter()


@router.get("/counts", response_model=APIResponse[PrescriptionSummaryCountsResponse])
async def get_prescription_counts(
    current_user: User = Depends(require_role(RoleEnum.PHARMACIST.value, RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value)),
    db: AsyncSession = Depends(get_db),
):
    """
    Aggregate counts of prescriptions across statutory states for the pharmacist review dashboard.
    """
    service = PrescriptionService(db)
    counts = await service.repo.get_status_counts()
    return APIResponse(
        success=True,
        message="Prescription summary counts aggregated.",
        data=PrescriptionSummaryCountsResponse(**counts),
    )


@router.get("", response_model=APIResponse[PaginatedData[AdminPrescriptionResponse]])
async def list_prescriptions_queue(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (or ALL)"),
    search: Optional[str] = Query(None, description="Search reference token, patient name, doctor, or reg no"),
    date_from: Optional[date] = Query(None, description="Filter upload date start"),
    date_to: Optional[date] = Query(None, description="Filter upload date end"),
    customer_id: Optional[uuid.UUID] = Query(None, description="Filter by customer UUID"),
    pharmacist_id: Optional[uuid.UUID] = Query(None, description="Filter by reviewing pharmacist UUID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(RoleEnum.PHARMACIST.value, RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value)),
    db: AsyncSession = Depends(get_db),
):
    """
    Pharmacist clinical verification queue with server-side filtering, sorting, and pagination.
    Restricted to verified pharmacists and administrators under Rule 65.
    """
    service = PrescriptionService(db)
    skip = (page - 1) * page_size
    records, total = await service.repo.list_for_admin(
        status=status_filter,
        search=search,
        date_from=date_from,
        date_to=date_to,
        customer_id=customer_id,
        pharmacist_id=pharmacist_id,
        skip=skip,
        limit=page_size,
    )

    dtos = [service._build_admin_response(r) for r in records]
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return APIResponse(
        success=True,
        message="Prescription queue retrieved successfully.",
        data=PaginatedData(
            items=dtos,
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=total_pages,
            ),
        ),
    )


@router.get("/{prescription_id}", response_model=APIResponse[AdminPrescriptionResponse])
async def get_prescription_detail(
    prescription_id: uuid.UUID,
    current_user: User = Depends(require_role(RoleEnum.PHARMACIST.value, RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value)),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch comprehensive clinical prescription dossier including patient metadata,
    scanned files with secure zoom tokens, requested line items, and audit history.
    """
    service = PrescriptionService(db)
    rx = await service.get_admin_prescription(prescription_id)
    return APIResponse(
        success=True,
        message="Prescription dossier retrieved successfully.",
        data=rx,
    )


@router.post("/{prescription_id}/start-review", response_model=APIResponse[AdminPrescriptionResponse])
async def start_prescription_review(
    prescription_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_verified_pharmacist),
    db: AsyncSession = Depends(get_db),
):
    """
    Initiate clinical audit on prescription. Transitions state from PENDING_REVIEW to UNDER_REVIEW.
    Rule 65 requires that the actor is a registered pharmacist with verified credentials.
    """
    service = PrescriptionService(db)
    rx = await service.start_review(
        prescription_id=prescription_id,
        pharmacist=current_user,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(
        success=True,
        message=f"Clinical review initiated on prescription {rx.prescription_reference}.",
        data=rx,
    )


@router.post("/{prescription_id}/approve", response_model=APIResponse[AdminPrescriptionResponse])
async def approve_prescription(
    prescription_id: uuid.UUID,
    request: Request,
    payload: Optional[PrescriptionApproveRequest] = None,
    current_user: User = Depends(require_verified_pharmacist),
    db: AsyncSession = Depends(get_db),
):
    """
    Statutory clinical approval of prescription under Rule 65.
    Validates drug schedule rules, sets validity expiry, records immutable review audit log,
    and dispatches patient notification.
    """
    service = PrescriptionService(db)
    notes = payload.pharmacist_notes if payload else None
    valid_until = payload.valid_until if payload else None
    items = payload.verified_items if payload else None

    rx = await service.approve_prescription(
        prescription_id=prescription_id,
        pharmacist=current_user,
        pharmacist_notes=notes,
        valid_until=valid_until,
        verified_items=items,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(
        success=True,
        message=f"Prescription {rx.prescription_reference} approved under Rule 65.",
        data=rx,
    )


@router.post("/{prescription_id}/reject", response_model=APIResponse[AdminPrescriptionResponse])
async def reject_prescription(
    prescription_id: uuid.UUID,
    payload: PrescriptionRejectRequest,
    request: Request,
    current_user: User = Depends(require_verified_pharmacist),
    db: AsyncSession = Depends(get_db),
):
    """
    Pharmacist rejects prescription.
    Mandatory statutory reason required. Terminal transition state.
    """
    service = PrescriptionService(db)
    rx = await service.reject_prescription(
        prescription_id=prescription_id,
        pharmacist=current_user,
        rejection_reason=payload.rejection_reason,
        pharmacist_notes=payload.pharmacist_notes,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(
        success=True,
        message=f"Prescription {rx.prescription_reference} rejected. Patient has been notified.",
        data=rx,
    )


@router.post("/{prescription_id}/request-clarification", response_model=APIResponse[AdminPrescriptionResponse])
async def request_prescription_clarification(
    prescription_id: uuid.UUID,
    payload: PrescriptionClarificationRequest,
    request: Request,
    current_user: User = Depends(require_verified_pharmacist),
    db: AsyncSession = Depends(get_db),
):
    """
    Pharmacist requests clarification or re-upload from patient.
    Status transitions to CLARIFICATION_REQUIRED.
    """
    service = PrescriptionService(db)
    rx = await service.request_clarification(
        prescription_id=prescription_id,
        pharmacist=current_user,
        clarification_remarks=payload.clarification_remarks,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(
        success=True,
        message=f"Clarification request sent to patient for {rx.prescription_reference}.",
        data=rx,
    )


@router.get("/{prescription_id}/history", response_model=APIResponse[List[PrescriptionReviewLogResponse]])
async def get_prescription_review_history(
    prescription_id: uuid.UUID,
    current_user: User = Depends(require_role(RoleEnum.PHARMACIST.value, RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value)),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch immutable chronological audit trail of all pharmacist actions and decisions
    for this prescription record.
    """
    service = PrescriptionService(db)
    logs = await service.repo.get_review_logs(prescription_id)
    dtos = [
        PrescriptionReviewLogResponse(
            id=l.id,
            prescription_id=l.prescription_id,
            pharmacist_id=l.pharmacist_id,
            pharmacist_name=l.pharmacist.full_name if l.pharmacist else None,
            pharmacist_registration_no=l.pharmacist_profile.registration_number if l.pharmacist_profile else None,
            previous_status=l.previous_status,
            new_status=l.new_status,
            action=l.action,
            decision=l.action,
            notes=l.notes,
            remarks=l.notes,
            ip_address=l.ip_address,
            created_at=l.created_at,
        )
        for l in logs
    ]
    return APIResponse(
        success=True,
        message="Review history retrieved successfully.",
        data=dtos,
    )


@router.post("/{prescription_id}/items", response_model=APIResponse[PrescriptionItemResponse])
async def add_prescription_item(
    prescription_id: uuid.UUID,
    payload: PrescriptionItemCreate,
    current_user: User = Depends(require_verified_pharmacist),
    db: AsyncSession = Depends(get_db),
):
    """
    Pharmacist adds or extracts a medicine line item from the doctor's prescription.
    """
    service = PrescriptionService(db)
    rx = await service.repo.get_by_id(prescription_id)
    if not rx:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Prescription not found."})

    item = PrescriptionItem(
        prescription_id=prescription_id,
        product_id=payload.product_id,
        medicine_name_prescribed=payload.medicine_name_prescribed,
        dosage=payload.dosage,
        frequency=payload.frequency,
        duration_days=payload.duration_days,
        quantity_prescribed=payload.quantity_prescribed,
        quantity_approved=payload.quantity_prescribed,
        is_verified=True,
        verification_status="verified",
    )
    created = await service.repo.add_item(item)
    await db.commit()

    reloaded = await service.repo.get_item(created.id)
    return APIResponse(
        success=True,
        message="Prescription item recorded.",
        data=PrescriptionItemResponse(
            id=reloaded.id,
            prescription_id=reloaded.prescription_id,
            product_id=reloaded.product_id,
            product_name=reloaded.product.name if reloaded.product else None,
            medicine_name_prescribed=reloaded.medicine_name_prescribed,
            dosage=reloaded.dosage,
            frequency=reloaded.frequency,
            duration_days=reloaded.duration_days,
            quantity_prescribed=reloaded.quantity_prescribed,
            quantity_approved=reloaded.quantity_approved,
            is_verified=reloaded.is_verified,
            verification_status=reloaded.verification_status,
            pharmacist_remarks=reloaded.pharmacist_remarks,
        ),
    )


@router.put("/{prescription_id}/items/{item_id}", response_model=APIResponse[PrescriptionItemResponse])
async def update_prescription_item(
    prescription_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: PrescriptionItemVerifyRequest,
    current_user: User = Depends(require_verified_pharmacist),
    db: AsyncSession = Depends(get_db),
):
    """
    Pharmacist verifies, modifies approved quantity, or rejects a line item.
    """
    service = PrescriptionService(db)
    item = await service.repo.get_item(item_id)
    if not item or item.prescription_id != prescription_id:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Prescription line item not found."})

    item.is_verified = payload.is_verified
    item.quantity_approved = payload.quantity_approved
    item.verification_status = payload.verification_status
    if payload.pharmacist_remarks is not None:
        item.pharmacist_remarks = payload.pharmacist_remarks
    if payload.dosage is not None:
        item.dosage = payload.dosage
    if payload.frequency is not None:
        item.frequency = payload.frequency
    if payload.duration_days is not None:
        item.duration_days = payload.duration_days

    await db.commit()

    return APIResponse(
        success=True,
        message="Prescription line item verification updated.",
        data=PrescriptionItemResponse(
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
        ),
    )
