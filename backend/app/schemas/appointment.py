from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ═══════════════════════ Appointment Schemas ═══════════════════════

AppointmentStatus = Literal[
    "scheduled", "checked_in", "in_progress", "completed", "cancelled", "no_show"
]
AppointmentPriority = Literal["standard", "urgent", "emergency"]


class AppointmentBase(BaseModel):
    patient_id: str
    provider_id: str
    service_id: str
    appointment_start: datetime
    appointment_end: datetime
    notes: str | None = None
    priority: AppointmentPriority = "standard"


class AppointmentCreate(AppointmentBase):
    created_by: str


class AppointmentUpdate(BaseModel):
    provider_id: str | None = None
    appointment_start: datetime | None = None
    appointment_end: datetime | None = None
    status: AppointmentStatus | None = None
    notes: str | None = None
    priority: AppointmentPriority | None = None
    cancellation_reason: str | None = None


class AppointmentStatusUpdate(BaseModel):
    """Lightweight schema for status-only transitions."""
    status: AppointmentStatus
    cancellation_reason: str | None = Field(
        None,
        description="Required when status is 'cancelled'",
    )


class AppointmentResponse(AppointmentBase):
    id: str
    appointment_number: str
    status: AppointmentStatus
    cancellation_reason: str | None = None
    checked_in_at: datetime | None = None
    completed_at: datetime | None = None
    reminder_24h_sent_at: datetime | None = None
    reminder_2h_sent_at: datetime | None = None
    assigned_from_waitlist: bool
    created_by: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
