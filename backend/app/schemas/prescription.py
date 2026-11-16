import uuid
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class PrescriptionFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    prescription_id: uuid.UUID
    original_filename: str
    file_type: str
    file_size: int
    storage_provider: str
    checksum: Optional[str] = None
    file_category: str
    is_active: bool
    uploaded_at: datetime
    secure_view_url: Optional[str] = None
    secure_download_url: Optional[str] = None


class PrescriptionItemCreate(BaseModel):
    product_id: Optional[uuid.UUID] = None
    medicine_name_prescribed: str = Field(..., min_length=2, max_length=250)
    dosage: Optional[str] = Field(None, max_length=100)
    frequency: Optional[str] = Field(None, max_length=100)
    duration_days: Optional[int] = Field(None, ge=1, le=365)
    quantity_prescribed: int = Field(default=1, ge=1)


class PrescriptionItemVerifyRequest(BaseModel):
    item_id: Optional[uuid.UUID] = None
    product_id: Optional[uuid.UUID] = None
    medicine_name_prescribed: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration_days: Optional[int] = None
    quantity_prescribed: Optional[int] = None
    quantity_approved: int = Field(default=0, ge=0)
    is_verified: bool = True
    verification_status: str = Field(default="verified", description="verified, rejected, or modified")
    pharmacist_remarks: Optional[str] = None


class PrescriptionItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    prescription_id: uuid.UUID
    product_id: Optional[uuid.UUID] = None
    product_name: Optional[str] = None
    medicine_name_prescribed: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration_days: Optional[int] = None
    quantity_prescribed: int
    quantity_approved: int
    is_verified: bool
    verification_status: str
    pharmacist_remarks: Optional[str] = None


class PrescriptionReviewLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    prescription_id: uuid.UUID
    pharmacist_id: uuid.UUID
    pharmacist_name: Optional[str] = None
    pharmacist_registration_no: Optional[str] = None
    previous_status: str
    new_status: str
    action: str
    decision: str
    notes: Optional[str] = None
    remarks: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime


class PrescriptionCreateMetadata(BaseModel):
    patient_name: Optional[str] = Field(None, max_length=100)
    patient_age: Optional[int] = Field(None, ge=0, le=130)
    patient_gender: Optional[str] = Field(None, max_length=20)
    doctor_name: Optional[str] = Field(None, max_length=150)
    doctor_registration_no: Optional[str] = Field(None, max_length=100)
    doctor_clinic_or_hospital: Optional[str] = Field(None, max_length=200)
    prescription_date: Optional[date] = None
    customer_notes: Optional[str] = Field(None, max_length=1000)
    associated_product_ids: Optional[List[uuid.UUID]] = None


class PrescriptionCustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    prescription_number: str
    prescription_reference: str
    customer_id: uuid.UUID
    status: str
    prescription_status: str
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_registration_no: Optional[str] = None
    doctor_clinic_or_hospital: Optional[str] = None
    prescription_date: Optional[date] = None
    valid_until: Optional[date] = None
    is_valid: bool = True
    invalidity_reason: Optional[str] = None
    pharmacist_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    clarification_remarks: Optional[str] = None
    customer_notes: Optional[str] = None
    uploaded_at: datetime
    reviewed_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    files: List[PrescriptionFileResponse] = []
    items: List[PrescriptionItemResponse] = []
    review_logs: List[PrescriptionReviewLogResponse] = []


class AdminCustomerSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    phone_number: str
    email: Optional[str] = None


class AdminPrescriptionResponse(PrescriptionCustomerResponse):
    customer: Optional[AdminCustomerSummary] = None
    reviewed_by_name: Optional[str] = None
    rejected_by_name: Optional[str] = None
    under_review_by_name: Optional[str] = None


class PrescriptionCancelRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)


class PrescriptionApproveRequest(BaseModel):
    pharmacist_notes: Optional[str] = Field(None, max_length=2000)
    valid_until: Optional[date] = None
    verified_items: Optional[List[PrescriptionItemVerifyRequest]] = None


class PrescriptionRejectRequest(BaseModel):
    rejection_reason: str = Field(..., min_length=3, max_length=1000, description="Mandatory statutory reason for rejection")
    pharmacist_notes: Optional[str] = Field(None, max_length=2000)


class PrescriptionClarificationRequest(BaseModel):
    clarification_remarks: str = Field(..., min_length=3, max_length=1000, description="Mandatory details of clarification required from patient")


class PrescriptionSummaryCountsResponse(BaseModel):
    total: int
    pending_review: int
    under_review: int
    approved: int
    rejected: int
    clarification_required: int
    expired: int


class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool

