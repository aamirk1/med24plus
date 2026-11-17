from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import RoleEnum
from app.models.notification import Notification
from app.models.order import Order, OrderCancellation, OrderStatusHistory
from app.models.user import User
from app.modules.orders.services.order_state_machine import OrderStateMachine
from app.repositories.order_repository import OrderRepository


class PharmacistReviewService:
    """Domain service for licensed pharmacist clinical review and dispensing authorization under Rule 65."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.state_machine = OrderStateMachine(db)

    def _verify_pharmacist_authorization(self, acting_user: User) -> None:
        """Enforce verified pharmacist credential checks (Phase 4 / Rule 65)."""
        roles = getattr(acting_user, "_cached_roles", [])
        if RoleEnum.SUPER_ADMIN.value in roles or RoleEnum.ADMIN.value in roles:
            return

        if RoleEnum.PHARMACIST.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"success": False, "message": "Restricted to licensed pharmacists.", "error": {"code": "NOT_A_PHARMACIST"}},
            )

        profile = acting_user.pharmacist_profile
        if not profile or not profile.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "message": "Pharmacist account is pending statutory council verification under Rule 65.",
                    "error": {"code": "PHARMACIST_NOT_VERIFIED"},
                },
            )

    async def get_review_queue(self, page: int = 1, page_size: int = 20) -> Tuple[List[Order], int]:
        return await self.order_repo.get_orders_for_pharmacist_review(page=page, page_size=page_size)

    async def get_order_review_details(self, order_id: uuid.UUID) -> Order:
        order = await self.order_repo.get_by_id(order_id, load_relations=True)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Order not found.", "error": {"code": "ORDER_NOT_FOUND"}},
            )
        return order

    async def approve_order(
        self,
        order_id: uuid.UUID,
        pharmacist_user: User,
        notes: Optional[str] = None,
    ) -> Order:
        """Statutory clinical approval of prescription order by registered pharmacist."""
        self._verify_pharmacist_authorization(pharmacist_user)

        order = await self.order_repo.get_by_id(order_id, load_relations=True, lock_for_update=True)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Order not found.", "error": {"code": "ORDER_NOT_FOUND"}},
            )

        if order.status != "pharmacist_review":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Order is in '{order.status}' status, not awaiting pharmacist review.",
                    "error": {"code": "ORDER_NOT_IN_REVIEW"},
                },
            )

        profile = pharmacist_user.pharmacist_profile
        reg_info = f" (PCI Reg: {profile.registration_number})" if profile else ""
        approval_note = f"Approved for dispensing by Registered Pharmacist {pharmacist_user.full_name}{reg_info}."
        if notes:
            approval_note += f" Notes: {notes}"

        # Transition order to processing
        order = await self.state_machine.transition_order(
            order=order,
            new_status="processing",
            acting_user=pharmacist_user,
            notes=approval_note,
            reason="Clinical prescription verified and approved under Rule 65",
        )
        return order

    async def reject_order(
        self,
        order_id: uuid.UUID,
        pharmacist_user: User,
        reason: str,
    ) -> Order:
        """Statutory clinical rejection of prescription order by registered pharmacist."""
        self._verify_pharmacist_authorization(pharmacist_user)

        if not reason or not reason.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Rejection reason is mandatory.", "error": {"code": "REASON_REQUIRED"}},
            )

        order = await self.order_repo.get_by_id(order_id, load_relations=True, lock_for_update=True)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Order not found.", "error": {"code": "ORDER_NOT_FOUND"}},
            )

        if order.status != "pharmacist_review":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Order is in '{order.status}' status, not awaiting pharmacist review.",
                    "error": {"code": "ORDER_NOT_IN_REVIEW"},
                },
            )

        profile = pharmacist_user.pharmacist_profile
        reg_info = f" (PCI Reg: {profile.registration_number})" if profile else ""
        reject_note = f"Dispensing rejected by Registered Pharmacist {pharmacist_user.full_name}{reg_info}: {reason.strip()}"

        # Transition order to rejected (releases reservations)
        order = await self.state_machine.transition_order(
            order=order,
            new_status="rejected",
            acting_user=pharmacist_user,
            notes=reject_note,
            reason=reason.strip(),
        )

        now_utc = datetime.now(timezone.utc)
        cancellation = OrderCancellation(
            order_id=order.id,
            requested_by_id=pharmacist_user.id,
            cancellation_reason=reason.strip(),
            cancellation_type="pharmacist_rejected",
            approved_by_id=pharmacist_user.id,
            cancellation_status="completed",
            created_at=now_utc,
        )
        self.db.add(cancellation)
        await self.db.flush()

        return order

    async def request_clarification(
        self,
        order_id: uuid.UUID,
        pharmacist_user: User,
        clarification_notes: str,
    ) -> Order:
        """Pharmacist requests clarification regarding clinical prescription."""
        self._verify_pharmacist_authorization(pharmacist_user)

        order = await self.order_repo.get_by_id(order_id, load_relations=True, lock_for_update=True)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Order not found.", "error": {"code": "ORDER_NOT_FOUND"}},
            )

        now_utc = datetime.now(timezone.utc)
        order.admin_notes = f"{order.admin_notes or ''}\n[Clarification Requested]: {clarification_notes}".strip()

        history = OrderStatusHistory(
            order_id=order.id,
            previous_status=order.status,
            new_status=order.status,
            changed_by_id=pharmacist_user.id,
            actor_role="pharmacist",
            reason="Prescription Clarification Requested",
            notes=clarification_notes,
            created_at=now_utc,
        )
        self.db.add(history)

        notification = Notification(
            user_id=order.customer_id,
            title="Prescription Clarification Needed",
            message=f"Our pharmacist requested clarification for Order {order.order_number}: {clarification_notes}",
            notification_type="ORDER_CLARIFICATION_REQUESTED",
            reference_type="order",
            reference_id=order.id,
            is_read=False,
        )
        self.db.add(notification)
        await self.db.flush()

        return order
