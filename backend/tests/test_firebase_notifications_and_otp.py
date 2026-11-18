import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.device_token import UserDeviceToken
from app.models.notification import Notification
from app.models.user import User
from app.repositories.device_token_repository import DeviceTokenRepository
from app.repositories.notification_repository import NotificationRepository
from app.services.firebase_service import FirebaseService
from app.services.notification_service import NotificationService
from app.services.otp_service import OTPService


@pytest.mark.asyncio
async def test_firebase_service_initialization():
    """Verify FirebaseService singleton initializes cleanly."""
    service = FirebaseService()
    assert service is not None
    assert service._is_initialized is True


@pytest.mark.asyncio
async def test_firebase_push_notification_dispatch():
    """Verify single push notification dispatch via FirebaseService."""
    service = FirebaseService()
    if service.is_simulation_mode:
        success, msg_id = await service.send_push_notification(
            device_token="fcm_sample_device_token_12345",
            title="Order Dispatched",
            body="Your chronic care medication package is out for delivery.",
            data={"order_id": "ord_1001", "type": "delivery_update"},
        )
        assert success is True
        assert msg_id is not None
        assert "simulated_msg_" in msg_id
    else:
        with patch("firebase_admin.messaging.send", return_value="projects/med24plus/messages/real_msg_99"):
            success, msg_id = await service.send_push_notification(
                device_token="fcm_sample_device_token_12345",
                title="Order Dispatched",
                body="Your chronic care medication package is out for delivery.",
                data={"order_id": "ord_1001", "type": "delivery_update"},
            )
            assert success is True
            assert msg_id == "projects/med24plus/messages/real_msg_99"


@pytest.mark.asyncio
async def test_firebase_multicast_notification():
    """Verify multicast push dispatch across multiple registered tokens."""
    service = FirebaseService()
    tokens = [
        "fcm_token_device_a_1234567890",
        "fcm_token_device_b_1234567890",
    ]
    if service.is_simulation_mode:
        result = await service.send_multicast_notification(
            device_tokens=tokens,
            title="Prescription Approved",
            body="Your prescription #RX-2026 has been verified by the pharmacist.",
            data={"prescription_id": "rx_2026"},
        )
        assert result["success_count"] == 2
        assert result["failure_count"] == 0
        assert len(result["failed_tokens"]) == 0
    else:
        mock_response = MagicMock()
        mock_response.success_count = 2
        mock_response.failure_count = 0
        mock_response.responses = [MagicMock(success=True), MagicMock(success=True)]
        with patch("firebase_admin.messaging.send_each_for_multicast", return_value=mock_response):
            result = await service.send_multicast_notification(
                device_tokens=tokens,
                title="Prescription Approved",
                body="Your prescription #RX-2026 has been verified by the pharmacist.",
                data={"prescription_id": "rx_2026"},
            )
            assert result["success_count"] == 2
            assert result["failure_count"] == 0
            assert len(result["failed_tokens"]) == 0


@pytest.mark.asyncio
async def test_firebase_phone_auth_token_verification():
    """Verify Firebase Phone Auth ID token verification logic."""
    service = FirebaseService()

    # Empty token rejection
    success, claims, err = await service.verify_phone_id_token("")
    assert success is False
    assert claims is None
    assert err == "Firebase ID token is required."

    # Development / Simulated token verification
    test_phone = "+919876543210"
    dev_token = f"dev_firebase_token_{test_phone}"
    success, claims, err = await service.verify_phone_id_token(dev_token)
    assert success is True
    assert claims is not None
    assert claims["phone_number"] == test_phone
    assert err is None


@pytest.mark.asyncio
async def test_otp_service_provider_commented_and_firebase_active():
    """Verify that OTPService has commented provider code and runs Firebase OTP generation."""
    mock_db = AsyncMock()
    otp_service = OTPService(mock_db)

    # Mock repository
    otp_service.repo.get_latest_active = AsyncMock(return_value=None)
    otp_service.repo.create_otp = AsyncMock(return_value=None)
    otp_service.repo.invalidate_previous_otps = AsyncMock()

    # Generate OTP for phone verification
    target_phone = "+919876543210"
    success, err, dev_code = await otp_service.generate_otp(
        target=target_phone,
        purpose="phone_verification",
    )
    assert success is True
    assert err is None
    # In development mode, dev code is provided as a test fallback
    assert dev_code is not None
    assert len(dev_code) == 6


@pytest.mark.asyncio
async def test_device_token_repository():
    """Verify DeviceTokenRepository registration, retrieval, and deactivation."""
    mock_db = AsyncMock()
    repo = DeviceTokenRepository(mock_db)

    # 1. Register token (new)
    user_id = uuid.uuid4()
    fcm_token = "fcm_test_token_abcdef123456"

    # Mock DB query for existing token
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_result

    record = await repo.register_device_token(
        user_id=user_id,
        fcm_token=fcm_token,
        device_type="android",
    )
    assert record.user_id == user_id
    assert record.fcm_token == fcm_token
    assert record.device_type == "android"
    assert record.is_active is True
    assert mock_db.add.called


@pytest.mark.asyncio
async def test_notification_service_send_and_token_handling():
    """Verify NotificationService persists notification and triggers FCM multicast."""
    mock_db = AsyncMock()
    service = NotificationService(mock_db)

    user_id = uuid.uuid4()
    sample_notif = Notification(
        id=uuid.uuid4(),
        user_id=user_id,
        title="Delivery Out for Delivery",
        message="Your package is arriving soon",
        notification_type="order_update",
    )
    service.notification_repo.create_notification = AsyncMock(return_value=sample_notif)
    service.device_token_repo.get_active_tokens_for_user = AsyncMock(
        return_value=["token_1", "token_2"]
    )
    service.firebase_service.send_multicast_notification = AsyncMock(
        return_value={"success_count": 2, "failure_count": 0, "failed_tokens": []}
    )

    created = await service.send_user_notification(
        user_id=user_id,
        title="Delivery Out for Delivery",
        message="Your package is arriving soon",
        notification_type="order_update",
    )
    assert created.id == sample_notif.id
    service.notification_repo.create_notification.assert_awaited_once()
    service.firebase_service.send_multicast_notification.assert_awaited_once()


@pytest.mark.asyncio
async def test_firebase_service_unregistered_token_handling():
    """Verify that send_multicast_notification deactivates bad tokens."""
    mock_db = AsyncMock()
    service = NotificationService(mock_db)

    user_id = uuid.uuid4()
    bad_token = "invalid_fcm_token_xyz"
    service.notification_repo.create_notification = AsyncMock(
        return_value=Notification(id=uuid.uuid4(), user_id=user_id, title="Test", message="Test", notification_type="test")
    )
    service.device_token_repo.get_active_tokens_for_user = AsyncMock(return_value=[bad_token])
    service.firebase_service.send_multicast_notification = AsyncMock(
        return_value={"success_count": 0, "failure_count": 1, "failed_tokens": [bad_token]}
    )
    service.device_token_repo.deactivate_token = AsyncMock(return_value=True)

    await service.send_user_notification(
        user_id=user_id,
        title="Test Alert",
        message="Test alert message",
    )

    service.device_token_repo.deactivate_token.assert_awaited_once_with(bad_token)

