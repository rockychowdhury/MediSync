from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ═══════════════════════ Notification Schemas ═══════════════════════

NotificationChannel = Literal["email", "sms"]
NotificationType = Literal[
    "confirmation",
    "reminder_24h",
    "reminder_2h",
    "cancellation",
    "waitlist_assigned",
    "no_show_followup",
]
NotificationStatus = Literal["pending", "sent", "failed", "skipped"]


class NotificationBase(BaseModel):
    recipient_type: Literal["patient", "user"]
    recipient_id: str
    appointment_id: str | None = None
    waitlist_id: str | None = None
    channel: NotificationChannel
    type: NotificationType
    subject: str | None = Field(None, max_length=255)
    body_preview: str | None = None


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: str
    status: NotificationStatus
    sent_at: datetime | None = None
    retry_count: int
    error_message: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
