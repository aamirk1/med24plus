from datetime import datetime, timezone
from typing import Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import RoleEnum
from app.models.order import Order, OrderCancellation
from app.models.user import User
from app.modules.orders.services.order_state_machine import OrderStateMachine
from app.repositories.order_repository import OrderRepository


class OrderCancellationService:
    """Domain service managing the statutory cancellation workflow and reservation reversal."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.state_machine = OrderStateMachine(db)

    async def cancel_order(
        self,
        order_id: uuid.UUID,
        reason: str,
        acting_user: User,
        cancellation_type: Optional[str] = None,
    ) -> Order:
        """
        Cancel an order with validation, status transition, inventory release, and cancellation record.
        """
        if not reason or not reason.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Cancellation reason is mandatory.", "error": {"code": "REASON_REQUIRED"}},
            )

        order = await self.order_repo.get_by_id(order_id, load_relations=True, lock_for_update=True)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Order not found.", "error": {"code": "ORDER_NOT_FOUND"}},
            )

        # Check existing cancellation
        if order.status == "cancelled" or order.cancellation is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "Order is already cancelled.", "error": {"code": "ORDER_ALREADY_CANCELLED"}},
            )

        user_roles = getattr(acting_user, "_cached_roles", [])
        is_admin = RoleEnum.SUPER_ADMIN.value in user_roles or RoleEnum.ADMIN.value in user_roles
        is_pharmacist = RoleEnum.PHARMACIST.value in user_roles
        is_customer = acting_user.id == order.customer_id

        if not is_customer and not is_admin and not is_pharmacist:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"success": False, "message": "Unauthorized to cancel this order.", "error": {"code": "UNAUTHORIZED_CANCELLATION"}},
            )

        # Determine cancellation type
        if not cancellation_type:
            if is_customer:
                cancellation_type = "customer_requested"
            elif is_pharmacist:
                cancellation_type = "pharmacist_rejected"
            else:
                cancellation_type = "admin_cancelled"

        # Check post-dispatch rule: After dispatch, automatic cancellation is barred
        if order.status in {"dispatched", "delivered"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "message": f"Order cannot be cancelled because it has already been {order.status}. Returns/refunds must follow post-delivery procedures.",
                    "error": {"code": "CANNOT_CANCEL_DISPATCHED_ORDER"},
                },
            )

        # Transition order to cancelled through state machine (which releases reservations)
        order = await self.state_machine.transition_order(
            order=order,
            new_status="cancelled",
            acting_user=acting_user,
            reason=reason.strip(),
            notes=f"Order cancelled by {cancellation_type}: {reason.strip()}",
        )

        now_utc = datetime.now(timezone.utc)

        # Create cancellation record
        cancellation = OrderCancellation(
            order_id=order.id,
            requested_by_id=acting_user.id,
            cancellation_reason=reason.strip(),
            cancellation_type=cancellation_type,
            approved_by_id=acting_user.id if is_admin else None,
            cancellation_status="completed",
            created_at=now_utc,
        )
        self.db.add(cancellation)
        await self.db.flush()

        return order
