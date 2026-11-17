from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, List, Optional, Set
import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import RoleEnum
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.models.order import Order, OrderCancellation, OrderStatusHistory
from app.models.user import User
from app.modules.orders.services.inventory_reservation_service import InventoryReservationService
from app.repositories.order_repository import OrderRepository


class InvalidOrderStateTransition(HTTPException):
    def __init__(self, current_status: str, target_status: str, detail_message: Optional[str] = None):
        msg = detail_message or f"Invalid order status transition from '{current_status}' to '{target_status}'."
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": msg,
                "error": {
                    "code": "INVALID_STATE_TRANSITION",
                    "current_status": current_status,
                    "target_status": target_status,
                },
            },
        )


class OrderStateMachine:
    """
    Centralized statutory Order Status State Machine enforcing lifecycle rules,
    actor permissions, payment guards, inventory consumption/release, and audit trails.
    """

    VALID_TRANSITIONS: Dict[str, Set[str]] = {
        "placed": {"pending_payment", "payment_confirmed", "pharmacist_review", "cancelled", "failed"},
        "pending_payment": {"payment_confirmed", "pharmacist_review", "cancelled", "failed"},
        "payment_confirmed": {"pharmacist_review", "processing", "cancelled"},
        "pharmacist_review": {"processing", "rejected", "cancelled"},
        "processing": {"ready_for_dispatch", "cancelled"},
        "ready_for_dispatch": {"dispatched", "cancelled"},
        "dispatched": {"delivered"},
        "delivered": set(),   # Terminal
        "cancelled": set(),   # Terminal
        "rejected": set(),    # Terminal
        "failed": set(),      # Terminal
    }

    CANCELLABLE_BY_CUSTOMER: Set[str] = {
        "placed",
        "pending_payment",
        "payment_confirmed",
        "pharmacist_review",
        "processing",
        "ready_for_dispatch",
    }

    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.res_service = InventoryReservationService(db)

    async def transition_order(
        self,
        order: Order,
        new_status: str,
        acting_user: User,
        notes: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> Order:
        """
        Execute state transition through validated state machine.
        Validates actor permissions, releases or consumes inventory, records status history and notifications.
        """
        current_status = order.status
        user_roles: List[str] = getattr(acting_user, "_cached_roles", [])
        is_super_or_admin = RoleEnum.SUPER_ADMIN.value in user_roles or RoleEnum.ADMIN.value in user_roles
        is_pharmacist = RoleEnum.PHARMACIST.value in user_roles
        is_customer = RoleEnum.CUSTOMER.value in user_roles and not is_super_or_admin and not is_pharmacist

        # 1. State Machine Graph Validation
        allowed = self.VALID_TRANSITIONS.get(current_status, set())
        if new_status not in allowed:
            raise InvalidOrderStateTransition(
                current_status,
                new_status,
                f"Cannot transition order from '{current_status}' to '{new_status}'. Allowed: {sorted(list(allowed)) or 'None (Terminal state)'}.",
            )

        # 2. Actor Role & Permission Validation
        actor_role = "system"
        if is_super_or_admin:
            actor_role = "admin"
        elif is_pharmacist:
            actor_role = "pharmacist"
        elif is_customer:
            actor_role = "customer"

        if is_customer:
            # Customers can only cancel their own orders while in cancellable status
            if new_status != "cancelled":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "success": False,
                        "message": "Customers are not authorized to update order operational status.",
                        "error": {"code": "CUSTOMER_STATUS_UPDATE_FORBIDDEN"},
                    },
                )
            if current_status not in self.CANCELLABLE_BY_CUSTOMER:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": f"Order cannot be cancelled in '{current_status}' state.",
                        "error": {"code": "ORDER_NOT_CANCELLABLE"},
                    },
                )

        # 3. Pharmacist Clinical Review Gates
        if current_status == "pharmacist_review":
            if new_status in {"processing", "rejected"}:
                if not is_pharmacist and not is_super_or_admin:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail={
                            "success": False,
                            "message": "Only licensed registered pharmacists can review and approve/reject clinical orders.",
                            "error": {"code": "PHARMACIST_ACTION_REQUIRED"},
                        },
                    )
                if is_pharmacist and not is_super_or_admin:
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

        # 4. Payment Gating for Dispatched/Delivered (Section 10)
        if new_status in {"dispatched", "delivered"}:
            if order.payment_status not in {"paid", "authorized", "cod_authorized"}:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "success": False,
                        "message": (
                            f"Order cannot be marked '{new_status}' with unverified payment status '{order.payment_status}'. "
                            "Verified payment evidence is required before dispatch."
                        ),
                        "error": {"code": "PAYMENT_NOT_VERIFIED"},
                    },
                )

        # 5. Inventory Lifecycle Coordination
        now_utc = datetime.now(timezone.utc)

        if new_status == "dispatched":
            # Consumes reserved inventory
            await self.res_service.consume_reservations_for_order(order.id, acting_user_id=acting_user.id)
        elif new_status in {"cancelled", "rejected"}:
            # Releases active inventory reservations
            await self.res_service.release_reservations_for_order(
                order.id,
                acting_user_id=acting_user.id,
                reason=reason or notes or f"Status changed to {new_status}",
            )
            order.cancelled_at = now_utc
        elif new_status == "delivered":
            order.completed_at = now_utc
        elif new_status == "payment_confirmed":
            order.confirmed_at = now_utc

        # 6. Apply status update
        order.status = new_status
        order.updated_at = now_utc

        # 7. Record Immutable Order Status History
        history_entry = OrderStatusHistory(
            order_id=order.id,
            previous_status=current_status,
            new_status=new_status,
            changed_by_id=acting_user.id,
            actor_role=actor_role,
            reason=reason,
            notes=notes,
            created_at=now_utc,
        )
        self.db.add(history_entry)

        # 8. Record Compliance Audit Log
        audit_log = AuditLog(
            actor_id=acting_user.id,
            actor_role=actor_role,
            action=f"ORDER_STATUS_CHANGED_{new_status.upper()}",
            entity_type="order",
            entity_id=str(order.id),
            before_state={"status": current_status, "payment_status": order.payment_status},
            after_state={"status": new_status, "payment_status": order.payment_status, "reason": reason},
        )
        self.db.add(audit_log)

        # 9. Create Customer Notification
        status_messages = {
            "pending_payment": ("Order Awaiting Payment", f"Your order {order.order_number} is awaiting payment."),
            "payment_confirmed": ("Payment Confirmed", f"Payment for order {order.order_number} has been received."),
            "pharmacist_review": ("Under Clinical Review", f"Order {order.order_number} is being verified by our registered pharmacist."),
            "processing": ("Order in Dispensing", f"Order {order.order_number} has been approved and is being packed."),
            "ready_for_dispatch": ("Packed & Ready", f"Order {order.order_number} is packed in temperature-controlled packaging."),
            "dispatched": ("Out for Delivery", f"Order {order.order_number} has been dispatched with our courier partner."),
            "delivered": ("Order Delivered", f"Order {order.order_number} has been successfully delivered."),
            "cancelled": ("Order Cancelled", f"Order {order.order_number} has been cancelled. Reason: {reason or 'Requested'}"),
            "rejected": ("Order Rejected by Pharmacist", f"Order {order.order_number} could not be dispensed. Reason: {reason or 'Clinical safety'}"),
        }

        if new_status in status_messages:
            title, msg = status_messages[new_status]
            notification = Notification(
                user_id=order.customer_id,
                title=title,
                message=msg,
                notification_type=f"ORDER_{new_status.upper()}",
                reference_type="order",
                reference_id=order.id,
                is_read=False,
            )
            self.db.add(notification)

        await self.db.flush()
        return order
