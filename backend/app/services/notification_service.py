import logging
import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.repositories.device_token_repository import DeviceTokenRepository
from app.repositories.notification_repository import NotificationRepository
from app.services.firebase_service import FirebaseService

logger = logging.getLogger("med24plus.notifications")


class NotificationService:
    """
    Service coordinating transactional user inbox records with
    Firebase Cloud Messaging (FCM) real-time push dispatches.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.notification_repo = NotificationRepository(db)
        self.device_token_repo = DeviceTokenRepository(db)
        self.firebase_service = FirebaseService()

    async def register_device_token(
        self,
        user_id: uuid.UUID,
        fcm_token: str,
        device_type: Optional[str] = "android",
    ):
        """Register or renew FCM device registration token for user."""
        return await self.device_token_repo.register_device_token(
            user_id=user_id,
            fcm_token=fcm_token,
            device_type=device_type,
        )

    async def deactivate_device_token(self, fcm_token: str) -> bool:
        """Deactivate FCM device token on sign out."""
        return await self.device_token_repo.deactivate_token(fcm_token)

    async def send_user_notification(
        self,
        user_id: uuid.UUID,
        title: str,
        message: str,
        notification_type: str = "order_update",
        reference_type: Optional[str] = None,
        reference_id: Optional[uuid.UUID] = None,
        data: Optional[Dict[str, str]] = None,
    ) -> Notification:
        """
        1. Persist notification in database inbox.
        2. Fetch active FCM tokens for the user.
        3. Dispatch push notification to all active user devices.
        """
        # 1. Create DB notification record
        notif_record = await self.notification_repo.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            reference_type=reference_type,
            reference_id=reference_id,
        )

        # 2. Get active tokens
        active_tokens = await self.device_token_repo.get_active_tokens_for_user(user_id)

        # 3. Dispatch FCM push notification
        if active_tokens:
            payload_data = data or {}
            payload_data.update({
                "notification_id": str(notif_record.id),
                "notification_type": notification_type,
                "click_action": "FLUTTER_NOTIFICATION_CLICK",
            })
            if reference_type and reference_id:
                payload_data["reference_type"] = reference_type
                payload_data["reference_id"] = str(reference_id)

            fcm_result = await self.firebase_service.send_multicast_notification(
                device_tokens=active_tokens,
                title=title,
                body=message,
                data=payload_data,
            )

            # Cleanup failed / unregistered tokens automatically
            if fcm_result.get("failed_tokens"):
                for bad_token in fcm_result["failed_tokens"]:
                    await self.device_token_repo.deactivate_token(bad_token)
        else:
            logger.info(f"[PUSH] No active FCM tokens found for user {user_id}. Stored inbox only.")

        return notif_record

    async def broadcast_notification(
        self,
        user_ids: List[uuid.UUID],
        title: str,
        message: str,
        notification_type: str = "announcement",
        data: Optional[Dict[str, str]] = None,
    ) -> int:
        """Broadcast notification to a list of users."""
        count = 0
        for uid in user_ids:
            await self.send_user_notification(
                user_id=uid,
                title=title,
                message=message,
                notification_type=notification_type,
                data=data,
            )
            count += 1
        return count
