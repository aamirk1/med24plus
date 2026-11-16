import math
import uuid
from datetime import date
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Header,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_authenticated_user
from app.core.permissions import RoleEnum
from app.models.user import User
from app.schemas.common import APIResponse, PaginatedData, PaginationMeta
from app.schemas.prescription import (
    PrescriptionCancelRequest,
    PrescriptionCustomerResponse,
    PrescriptionFileResponse,
)
from app.services.prescription_service import PrescriptionService
from app.services.prescription_storage_service import prescription_storage_service

router = APIRouter()


@router.post("", response_model=APIResponse[PrescriptionCustomerResponse], status_code=status.HTTP_201_CREATED)
async def upload_prescription(
    request: Request,
    files: List[UploadFile] = File(..., description="Prescription documents (JPEG, PNG, PDF up to 10MB)"),
    patient_name: Optional[str] = Form(None),
    patient_age: Optional[int] = Form(None),
    patient_gender: Optional[str] = Form(None),
    doctor_name: Optional[str] = Form(None),
    doctor_registration_no: Optional[str] = Form(None),
    doctor_clinic_or_hospital: Optional[str] = Form(None),
    prescription_date: Optional[date] = Form(None),
    customer_notes: Optional[str] = Form(None),
    associated_product_ids: Optional[str] = Form(None, description="Comma-separated product UUIDs"),
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Customer prescription upload under Rule 65.
    Accepts 1-5 files (JPEG, PNG, PDF), validates magic bytes, computes SHA-256 checksums,
    stores documents in private encrypted storage, and places order into pharmacist review queue.
    """
    prod_ids: Optional[List[uuid.UUID]] = None
    if associated_product_ids:
        try:
            prod_ids = [uuid.UUID(pid.strip()) for pid in associated_product_ids.split(",") if pid.strip()]
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Invalid associated product UUID format."},
            )

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = PrescriptionService(db)
    rx = await service.upload_prescription(
        customer=current_user,
        files=files,
        patient_name=patient_name,
        patient_age=patient_age,
        patient_gender=patient_gender,
        doctor_name=doctor_name,
        doctor_registration_no=doctor_registration_no,
        doctor_clinic_or_hospital=doctor_clinic_or_hospital,
        prescription_date=prescription_date,
        customer_notes=customer_notes,
        associated_product_ids=prod_ids,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    return APIResponse(
        success=True,
        message=f"Prescription {rx.prescription_reference} submitted successfully for registered pharmacist review.",
        data=rx,
    )


@router.get("", response_model=APIResponse[PaginatedData[PrescriptionCustomerResponse]])
async def list_customer_prescriptions(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve customer's personal prescription vault with pagination and status filtering.
    Cross-customer access is strictly prevented.
    """
    service = PrescriptionService(db)
    skip = (page - 1) * page_size
    records, total = await service.repo.list_for_customer(
        customer_id=current_user.id,
        status=status_filter,
        skip=skip,
        limit=page_size,
    )

    dtos = [service._build_customer_response(r) for r in records]
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return APIResponse(
        success=True,
        message="Prescription history retrieved successfully.",
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


@router.get("/{prescription_id}", response_model=APIResponse[PrescriptionCustomerResponse])
async def get_customer_prescription(
    prescription_id: uuid.UUID,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch single prescription record. Validates customer ownership.
    """
    service = PrescriptionService(db)
    rx = await service.get_customer_prescription(prescription_id, current_user)
    return APIResponse(
        success=True,
        message="Prescription retrieved successfully.",
        data=rx,
    )


@router.post("/{prescription_id}/files", response_model=APIResponse[PrescriptionCustomerResponse])
async def add_prescription_files(
    prescription_id: uuid.UUID,
    request: Request,
    files: List[UploadFile] = File(...),
    customer_notes: Optional[str] = Form(None),
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Add supporting files to a prescription in pending_review or clarification_required state."""
    service = PrescriptionService(db)
    rx = await service.add_clarification_files(
        prescription_id=prescription_id,
        customer=current_user,
        files=files,
        customer_notes=customer_notes,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(
        success=True,
        message="Additional documents attached successfully.",
        data=rx,
    )


@router.post("/{prescription_id}/clarification-files", response_model=APIResponse[PrescriptionCustomerResponse])
async def submit_clarification_files(
    prescription_id: uuid.UUID,
    request: Request,
    files: List[UploadFile] = File(...),
    customer_notes: Optional[str] = Form(None),
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit clarification documents requested by pharmacist.
    Transitions prescription status back to PENDING_REVIEW.
    """
    service = PrescriptionService(db)
    rx = await service.add_clarification_files(
        prescription_id=prescription_id,
        customer=current_user,
        files=files,
        customer_notes=customer_notes,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(
        success=True,
        message="Clarification documents submitted. Status returned to pending review.",
        data=rx,
    )


@router.post("/{prescription_id}/cancel", response_model=APIResponse[PrescriptionCustomerResponse])
async def cancel_customer_prescription(
    prescription_id: uuid.UUID,
    request: Request,
    payload: Optional[PrescriptionCancelRequest] = None,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Allow customer to cancel their own prescription if it is in pending_review or clarification_required status.
    """
    service = PrescriptionService(db)
    reason = payload.reason if payload else None
    rx = await service.cancel_prescription(
        prescription_id=prescription_id,
        customer=current_user,
        reason=reason,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(
        success=True,
        message=f"Prescription {rx.prescription_reference} cancelled successfully.",
        data=rx,
    )


@router.get("/{prescription_id}/files", response_model=APIResponse[List[PrescriptionFileResponse]])
async def list_prescription_files(
    prescription_id: uuid.UUID,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active files attached to a prescription."""
    service = PrescriptionService(db)
    # Check ownership
    rx = await service.repo.get_by_id(prescription_id)
    if not rx:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Prescription not found."})

    roles = getattr(current_user, "_cached_roles", [])
    is_staff = any(r in roles for r in [RoleEnum.PHARMACIST.value, RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value])

    if rx.customer_id != current_user.id and not is_staff:
        raise HTTPException(status_code=403, detail={"success": False, "message": "Access forbidden."})

    files = await service.repo.get_files_for_prescription(prescription_id)
    dtos = [service._build_file_response(f) for f in files]
    return APIResponse(success=True, message="Files retrieved successfully.", data=dtos)


@router.get("/{prescription_id}/files/{file_id}/view")
async def view_prescription_file(
    prescription_id: uuid.UUID,
    file_id: uuid.UUID,
    request: Request,
    token: Optional[str] = Query(None, description="Short-lived HMAC signed view token"),
    db: AsyncSession = Depends(get_db),
):
    """
    Securely stream a private prescription file inline for web browser viewing.
    Supports either a valid short-lived HMAC signed URL token or active authenticated Bearer session.
    Never exposes raw filesystem path or makes files public.
    """
    service = PrescriptionService(db)
    file_rec = await service.repo.get_file(file_id)
    if not file_rec or file_rec.prescription_id != prescription_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Prescription document not found."},
        )

    # 1. First check signed token if present
    authorized = False
    if token:
        authorized = prescription_storage_service.verify_signed_view_token(file_id, token)

    # 2. If token absent or invalid, check Bearer header or cookie session
    if not authorized:
        try:
            auth_header = request.headers.get("authorization")
            cookie_token = request.cookies.get("med24_access_token")
            user = await get_current_user(request=request, authorization=auth_header, med24_access_token=cookie_token, db=db)
            roles = getattr(user, "_cached_roles", [])
            rx = await service.repo.get_by_id(prescription_id)
            if rx and (rx.customer_id == user.id or any(r in roles for r in [RoleEnum.PHARMACIST.value, RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value])):
                authorized = True
        except Exception:
            pass

    if not authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "message": "Access denied. Valid signed token or authenticated session required to view clinical documents.",
            },
        )

    file_path = prescription_storage_service.get_file_path(file_rec.storage_key)

    return FileResponse(
        path=str(file_path),
        media_type=file_rec.file_type,
        filename=file_rec.original_filename,
        content_disposition_type="inline",
    )


@router.get("/{prescription_id}/files/{file_id}/download")
async def download_prescription_file(
    prescription_id: uuid.UUID,
    file_id: uuid.UUID,
    request: Request,
    token: Optional[str] = Query(None, description="Short-lived HMAC signed view token"),
    db: AsyncSession = Depends(get_db),
):
    """
    Securely download a private prescription document as an attachment.
    """
    service = PrescriptionService(db)
    file_rec = await service.repo.get_file(file_id)
    if not file_rec or file_rec.prescription_id != prescription_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Prescription document not found."},
        )

    authorized = False
    if token:
        authorized = prescription_storage_service.verify_signed_view_token(file_id, token)

    if not authorized:
        try:
            auth_header = request.headers.get("authorization")
            cookie_token = request.cookies.get("med24_access_token")
            user = await get_current_user(request=request, authorization=auth_header, med24_access_token=cookie_token, db=db)
            roles = getattr(user, "_cached_roles", [])
            rx = await service.repo.get_by_id(prescription_id)
            if rx and (rx.customer_id == user.id or any(r in roles for r in [RoleEnum.PHARMACIST.value, RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value])):
                authorized = True
        except Exception:
            pass

    if not authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "message": "Access denied to download document."},
        )

    file_path = prescription_storage_service.get_file_path(file_rec.storage_key)

    return FileResponse(
        path=str(file_path),
        media_type=file_rec.file_type,
        filename=file_rec.original_filename,
        content_disposition_type="attachment",
    )

