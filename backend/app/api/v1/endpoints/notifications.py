import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_authenticated_user
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.notification import (
    DeviceTokenRegisterRequest,
    DeviceTokenResponse,
    NotificationListResponse,
    NotificationResponse,
    TestPushRequest,
)
from app.services.notification_service import NotificationService

router = APIRouter()


@router.post(
    "/device-token",
    response_model=APIResponse[DeviceTokenResponse],
    status_code=status.HTTP_200_OK,
)
async def register_device_token(
    payload: DeviceTokenRegisterRequest,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Register or renew a Firebase Cloud Messaging (FCM) device token
    for push notifications.
    """
    service = NotificationService(db)
    token_record = await service.register_device_token(
        user_id=current_user.id,
        fcm_token=payload.fcm_token,
        device_type=payload.device_type,
    )
    await db.commit()

    return APIResponse(
        success=True,
        message="Device FCM token registered successfully.",
        data=DeviceTokenResponse.model_validate(token_record),
    )


@router.delete(
    "/device-token",
    response_model=APIResponse[Dict[str, bool]],
)
async def unregister_device_token(
    fcm_token: str = Query(..., description="FCM device token to deactivate"),
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate an FCM device token upon user sign-out."""
    service = NotificationService(db)
    deactivated = await service.deactivate_device_token(fcm_token)
    await db.commit()

    return APIResponse(
        success=True,
        message="Device token unregistered.",
        data={"deactivated": deactivated},
    )


@router.get(
    "",
    response_model=APIResponse[NotificationListResponse],
)
async def get_notifications(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    unread_only: bool = Query(False, description="Filter unread only"),
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve paginated notifications history and unread count for current user."""
    service = NotificationService(db)
    items, total = await service.notification_repo.get_user_notifications(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        unread_only=unread_only,
    )
    unread_count = await service.notification_repo.count_unread(current_user.id)

    res_items = [NotificationResponse.model_validate(item) for item in items]
    data = NotificationListResponse(
        items=res_items,
        unread_count=unread_count,
        total=total,
        page=page,
        page_size=page_size,
    )

    return APIResponse(
        success=True,
        message="Notifications retrieved successfully.",
        data=data,
    )


@router.get(
    "/unread-count",
    response_model=APIResponse[Dict[str, int]],
)
async def get_unread_count(
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Get number of unread notifications for badge indicators."""
    service = NotificationService(db)
    unread = await service.notification_repo.count_unread(current_user.id)
    return APIResponse(
        success=True,
        message="Unread count retrieved.",
        data={"unread_count": unread},
    )


@router.put(
    "/{notification_id}/read",
    response_model=APIResponse[Dict[str, bool]],
)
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a notification as read."""
    service = NotificationService(db)
    updated = await service.notification_repo.mark_as_read(
        notification_id=notification_id,
        user_id=current_user.id,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Notification not found."},
        )
    await db.commit()
    return APIResponse(
        success=True,
        message="Notification marked as read.",
        data={"updated": True},
    )


@router.put(
    "/mark-all-read",
    response_model=APIResponse[Dict[str, int]],
)
async def mark_all_read(
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all unread notifications as read."""
    service = NotificationService(db)
    count = await service.notification_repo.mark_all_as_read(current_user.id)
    await db.commit()
    return APIResponse(
        success=True,
        message=f"{count} notifications marked as read.",
        data={"marked_count": count},
    )


@router.post(
    "/test-push",
    response_model=APIResponse[Dict[str, Any]],
)
async def send_test_push_notification(
    payload: TestPushRequest,
    current_user: User = Depends(require_authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a test push notification to all active devices registered by the current user.
    """
    service = NotificationService(db)
    notif = await service.send_user_notification(
        user_id=current_user.id,
        title=payload.title,
        message=payload.body,
        notification_type="system_test",
        data=payload.data,
    )
    await db.commit()

    return APIResponse(
        success=True,
        message="Test push notification dispatched.",
        data={
            "notification_id": str(notif.id),
            "title": notif.title,
            "dispatched": True,
        },
    )
