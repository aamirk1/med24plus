import secrets
import string
import uuid
from datetime import date, datetime
from typing import Dict, List, Optional, Tuple
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.prescription import (
    Prescription,
    PrescriptionFile,
    PrescriptionItem,
    PrescriptionReviewLog,
)
from app.models.user import User


class PrescriptionRepository:
    """Async database operations for prescriptions, files, line items, and audit review logs."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_unique_reference(self) -> str:
        """Generate high-entropy unique clinical reference, e.g. RX-202611-ABCD99."""
        prefix = f"RX-{datetime.now().strftime('%Y%m')}"
        for _ in range(10):
            suffix = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
            candidate = f"{prefix}-{suffix}"
            existing = await self.get_by_reference(candidate)
            if not existing:
                return candidate
        # Fallback with uuid if collision occurs
        return f"{prefix}-{uuid.uuid4().hex[:6].upper()}"

    async def create(self, prescription: Prescription) -> Prescription:
        """Persist a new prescription record."""
        self.db.add(prescription)
        await self.db.flush()
        return prescription

    async def get_by_id(self, prescription_id: uuid.UUID) -> Optional[Prescription]:
        """Fetch prescription by ID."""
        stmt = (
            select(Prescription)
            .where(Prescription.id == prescription_id, Prescription.is_deleted == False)  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_id_for_update(self, prescription_id: uuid.UUID) -> Optional[Prescription]:
        """Fetch prescription with row-level lock (FOR UPDATE) to prevent concurrent race conditions."""
        stmt = (
            select(Prescription)
            .where(Prescription.id == prescription_id, Prescription.is_deleted == False)  # noqa: E712
            .with_for_update()
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_reference(self, reference: str) -> Optional[Prescription]:
        """Fetch prescription by unique reference string."""
        stmt = (
            select(Prescription)
            .where(Prescription.prescription_reference == reference, Prescription.is_deleted == False)  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_id_with_relations(self, prescription_id: uuid.UUID) -> Optional[Prescription]:
        """Fetch prescription by ID with files, items, and review logs eagerly loaded."""
        stmt = (
            select(Prescription)
            .options(
                selectinload(Prescription.customer).selectinload(User.profile),
                selectinload(Prescription.reviewed_by).selectinload(User.profile),
                selectinload(Prescription.rejected_by).selectinload(User.profile),
                selectinload(Prescription.under_review_by).selectinload(User.profile),
                selectinload(Prescription.clarification_requested_by).selectinload(User.profile),
                selectinload(Prescription.files),
                selectinload(Prescription.items).selectinload(PrescriptionItem.product),
                selectinload(Prescription.review_logs).selectinload(PrescriptionReviewLog.pharmacist).selectinload(User.profile),
                selectinload(Prescription.review_logs).selectinload(PrescriptionReviewLog.pharmacist_profile),
            )
            .where(Prescription.id == prescription_id, Prescription.is_deleted == False)  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_for_customer(
        self,
        customer_id: uuid.UUID,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[Prescription], int]:
        """List prescriptions owned by a specific customer with pagination."""
        base_query = select(Prescription).where(
            Prescription.customer_id == customer_id,
            Prescription.is_deleted == False,  # noqa: E712
        )

        if status:
            base_query = base_query.where(Prescription.prescription_status == status)

        # Count total
        count_stmt = select(func.count()).select_from(base_query.subquery())
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar_one()

        # Fetch records
        stmt = (
            base_query
            .options(
                selectinload(Prescription.files),
                selectinload(Prescription.items).selectinload(PrescriptionItem.product),
                selectinload(Prescription.review_logs).selectinload(PrescriptionReviewLog.pharmacist),
                selectinload(Prescription.review_logs).selectinload(PrescriptionReviewLog.pharmacist_profile),
            )
            .order_by(desc(Prescription.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def list_for_admin(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        customer_id: Optional[uuid.UUID] = None,
        pharmacist_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[Prescription], int]:
        """Search and paginate prescriptions for the pharmacist verification dashboard."""
        base_query = select(Prescription).where(Prescription.is_deleted == False)  # noqa: E712

        if status and status.upper() != "ALL":
            base_query = base_query.where(Prescription.prescription_status == status.lower())

        if customer_id:
            base_query = base_query.where(Prescription.customer_id == customer_id)

        if pharmacist_id:
            base_query = base_query.where(
                or_(
                    Prescription.reviewed_by_id == pharmacist_id,
                    Prescription.under_review_by_id == pharmacist_id,
                )
            )

        if date_from:
            base_query = base_query.where(func.date(Prescription.created_at) >= date_from)

        if date_to:
            base_query = base_query.where(func.date(Prescription.created_at) <= date_to)

        if search:
            term = f"%{search.strip()}%"
            base_query = base_query.where(
                or_(
                    Prescription.prescription_reference.ilike(term),
                    Prescription.patient_name.ilike(term),
                    Prescription.doctor_name.ilike(term),
                    Prescription.doctor_registration_no.ilike(term),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(base_query.subquery())
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar_one()

        # Fetch records
        stmt = (
            base_query
            .options(
                selectinload(Prescription.customer).selectinload(User.profile),
                selectinload(Prescription.reviewed_by).selectinload(User.profile),
                selectinload(Prescription.under_review_by).selectinload(User.profile),
                selectinload(Prescription.files),
                selectinload(Prescription.items).selectinload(PrescriptionItem.product),
                selectinload(Prescription.review_logs).selectinload(PrescriptionReviewLog.pharmacist),
                selectinload(Prescription.review_logs).selectinload(PrescriptionReviewLog.pharmacist_profile),
            )
            .order_by(desc(Prescription.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def get_status_counts(self) -> Dict[str, int]:
        """Aggregate KPI summary counts by status."""
        stmt = (
            select(
                Prescription.prescription_status,
                func.count(Prescription.id).label("cnt"),
            )
            .where(Prescription.is_deleted == False)  # noqa: E712
            .group_by(Prescription.prescription_status)
        )
        result = await self.db.execute(stmt)
        counts: Dict[str, int] = {
            "total": 0,
            "pending_review": 0,
            "under_review": 0,
            "approved": 0,
            "rejected": 0,
            "clarification_required": 0,
            "expired": 0,
        }
        for status_val, cnt in result.all():
            counts["total"] += cnt
            if status_val in counts:
                counts[status_val] = cnt
        return counts

    async def add_file(self, file: PrescriptionFile) -> PrescriptionFile:
        """Add a file attachment record."""
        self.db.add(file)
        await self.db.flush()
        return file

    async def get_file(self, file_id: uuid.UUID) -> Optional[PrescriptionFile]:
        """Fetch file record by ID."""
        stmt = (
            select(PrescriptionFile)
            .where(PrescriptionFile.id == file_id, PrescriptionFile.is_active == True)  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_files_for_prescription(self, prescription_id: uuid.UUID) -> List[PrescriptionFile]:
        """Fetch all active files for a prescription."""
        stmt = (
            select(PrescriptionFile)
            .where(
                PrescriptionFile.prescription_id == prescription_id,
                PrescriptionFile.is_active == True,  # noqa: E712
            )
            .order_by(PrescriptionFile.uploaded_at)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def add_review_log(self, log: PrescriptionReviewLog) -> PrescriptionReviewLog:
        """Create an immutable clinical review history entry."""
        self.db.add(log)
        await self.db.flush()
        return log

    async def get_review_logs(self, prescription_id: uuid.UUID) -> List[PrescriptionReviewLog]:
        """Fetch all immutable review logs for a prescription ordered chronologically."""
        stmt = (
            select(PrescriptionReviewLog)
            .options(
                selectinload(PrescriptionReviewLog.pharmacist).selectinload(User.profile),
                selectinload(PrescriptionReviewLog.pharmacist_profile),
            )
            .where(PrescriptionReviewLog.prescription_id == prescription_id)
            .order_by(PrescriptionReviewLog.created_at)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def add_item(self, item: PrescriptionItem) -> PrescriptionItem:
        """Add medicine line item to prescription."""
        self.db.add(item)
        await self.db.flush()
        return item

    async def get_item(self, item_id: uuid.UUID) -> Optional[PrescriptionItem]:
        """Fetch prescription item by ID."""
        stmt = select(PrescriptionItem).where(PrescriptionItem.id == item_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_items(self, prescription_id: uuid.UUID) -> List[PrescriptionItem]:
        """Fetch all items for a prescription."""
        stmt = (
            select(PrescriptionItem)
            .options(selectinload(PrescriptionItem.product))
            .where(PrescriptionItem.prescription_id == prescription_id)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
