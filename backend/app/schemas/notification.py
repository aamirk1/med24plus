import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DeviceTokenRegisterRequest(BaseModel):
    fcm_token: str = Field(..., min_length=10, max_length=500, description="Firebase Cloud Messaging device token")
    device_type: Optional[str] = Field("android", description="Device platform: android, ios, or web")


class DeviceTokenResponse(BaseModel):
    id: uuid.UUID
    fcm_token: str
    device_type: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    notification_type: str
    reference_type: Optional[str] = None
    reference_id: Optional[uuid.UUID] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    unread_count: int
    total: int
    page: int
    page_size: int


class TestPushRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="Push notification title")
    body: str = Field(..., min_length=1, max_length=300, description="Push notification body")
    data: Optional[Dict[str, str]] = Field(default_factory=dict, description="Arbitrary custom payload data")
