from datetime import date, timedelta
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple
from fastapi import HTTPException, status

from app.models.product import Product


class PrescriptionStatusEnum(str, Enum):
    PENDING_REVIEW = "pending_review"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    CLARIFICATION_REQUIRED = "clarification_required"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


# Allowed state transitions: source_status -> set of allowed destination statuses
VALID_TRANSITIONS: Dict[str, Set[str]] = {
    PrescriptionStatusEnum.PENDING_REVIEW.value: {
        PrescriptionStatusEnum.UNDER_REVIEW.value,
        PrescriptionStatusEnum.APPROVED.value,
        PrescriptionStatusEnum.REJECTED.value,
        PrescriptionStatusEnum.CLARIFICATION_REQUIRED.value,
        PrescriptionStatusEnum.CANCELLED.value,
        PrescriptionStatusEnum.EXPIRED.value,
    },
    PrescriptionStatusEnum.UNDER_REVIEW.value: {
        PrescriptionStatusEnum.APPROVED.value,
        PrescriptionStatusEnum.REJECTED.value,
        PrescriptionStatusEnum.CLARIFICATION_REQUIRED.value,
        PrescriptionStatusEnum.PENDING_REVIEW.value,
        PrescriptionStatusEnum.EXPIRED.value,
    },
    PrescriptionStatusEnum.CLARIFICATION_REQUIRED.value: {
        # Customer uploading additional clarification docs returns it to pending_review
        PrescriptionStatusEnum.PENDING_REVIEW.value,
        PrescriptionStatusEnum.CANCELLED.value,
        PrescriptionStatusEnum.EXPIRED.value,
    },
    # Terminal states
    PrescriptionStatusEnum.APPROVED.value: {
        PrescriptionStatusEnum.EXPIRED.value,
    },
    PrescriptionStatusEnum.REJECTED.value: set(),  # Terminal: rejected prescriptions cannot silently become approved
    PrescriptionStatusEnum.CANCELLED.value: set(),  # Terminal
    PrescriptionStatusEnum.EXPIRED.value: set(),    # Terminal
}


def validate_status_transition(current_status: str, target_status: str) -> None:
    """
    Strictly enforce permitted state machine transitions.
    Raises HTTPException 400 if an invalid transition is attempted.
    """
    allowed = VALID_TRANSITIONS.get(current_status, set())
    if target_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": (
                    f"Illegal prescription status transition from '{current_status}' to '{target_status}'. "
                    f"Allowed transitions: {list(allowed) if allowed else 'None (terminal state)'}."
                ),
                "error": {
                    "code": "INVALID_STATUS_TRANSITION",
                    "current_status": current_status,
                    "target_status": target_status,
                    "allowed_transitions": list(allowed),
                },
            },
        )


class PrescriptionValidityPolicy:
    """
    Statutory validity and schedule compliance evaluator for India under
    the Drugs and Cosmetics Rules, 1945 (Rule 65, Schedules H, H1, X).
    """

    # Statutory prescription validity maximums (configurable)
    SCHEDULE_X_MAX_DAYS = 30       # Psychotropics/narcotics: strictly 30 days, single fill
    SCHEDULE_H1_MAX_DAYS = 60      # 3rd/4th gen antibiotics, restricted habit-forming
    SCHEDULE_H_MAX_DAYS = 180      # General prescription drugs: 6 months
    DEFAULT_GENERAL_MAX_DAYS = 180 # Standard non-scheduled prescription

    @classmethod
    def calculate_default_valid_until(
        cls,
        prescription_date: Optional[date] = None,
        associated_products: Optional[List[Product]] = None,
    ) -> date:
        """
        Calculate statutory expiry date based on the most restrictive medicine schedule present.
        """
        ref_date = prescription_date or date.today()
        days_limit = cls.DEFAULT_GENERAL_MAX_DAYS

        if associated_products:
            for p in associated_products:
                sched = (p.schedule_classification or "").upper()
                if "SCHEDULE X" in sched or sched == "X":
                    days_limit = min(days_limit, cls.SCHEDULE_X_MAX_DAYS)
                elif "SCHEDULE H1" in sched or sched == "H1":
                    days_limit = min(days_limit, cls.SCHEDULE_H1_MAX_DAYS)
                elif "SCHEDULE H" in sched or sched == "H":
                    days_limit = min(days_limit, cls.SCHEDULE_H_MAX_DAYS)

        return ref_date + timedelta(days=days_limit)

    @classmethod
    def evaluate_prescription_validity(
        cls,
        prescription_date: Optional[date],
        valid_until: Optional[date],
        associated_products: Optional[List[Product]] = None,
    ) -> Tuple[bool, Optional[str]]:
        """
        Evaluate if a prescription remains legally valid or has lapsed.
        Returns: (is_valid: bool, invalidity_reason: Optional[str])
        """
        today = date.today()

        if prescription_date and prescription_date > today:
            return False, "Prescription date is in the future. Statutory verification requires actual consultation date."

        if valid_until and today > valid_until:
            return False, f"Prescription validity period expired on {valid_until.isoformat()}."

        if prescription_date:
            # Check maximum statutory lapse even if valid_until wasn't explicitly populated
            max_expiry = cls.calculate_default_valid_until(prescription_date, associated_products)
            if today > max_expiry:
                return False, f"Prescription exceeds statutory validity limit ({max_expiry.isoformat()}) under Rule 65."

        return True, None

