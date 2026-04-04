from datetime import datetime
from typing import Literal

from pydantic import Field
from app.schemas.core import CoreModel


# ═══════════════════════ Appointment Schemas ═══════════════════════

AppointmentStatus = Literal[
    "scheduled", "checked_in", "in_progress", "completed", "cancelled", "no_show"
]
AppointmentPriority = Literal["standard", "urgent", "emergency"]


class AppointmentBase(CoreModel):
    patient_id: str
    provider_id: str
    service_id: str
    appointment_start: datetime
    appointment_end: datetime
    notes: str | None = None
    priority: AppointmentPriority = "standard"


class AppointmentCreate(AppointmentBase):
    created_by: str
    override_capacity: bool = False
    override_reason: str | None = Field(
        None,
        description="Required when override_capacity is true",
    )


class AppointmentReschedule(CoreModel):
    provider_id: str
    service_id: str
    appointment_start: datetime
    appointment_end: datetime
    notes: str | None = None


class AppointmentUpdate(CoreModel):
    provider_id: str | None = None
    appointment_start: datetime | None = None
    appointment_end: datetime | None = None
    status: AppointmentStatus | None = None
    notes: str | None = None
    priority: AppointmentPriority | None = None
    cancellation_reason: str | None = None


class AppointmentStatusUpdate(CoreModel):
    """Lightweight schema for status-only transitions."""
    status: AppointmentStatus
    cancellation_reason: str | None = Field(
        None,
        description="Required when status is 'cancelled'",
    )


class BulkAppointmentStatusUpdate(CoreModel):
    appointment_ids: list[str]
    status: AppointmentStatus
    cancellation_reason: str | None = None


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


# Stats Schemas
class DailyStats(CoreModel):
    date: str
    counts: dict[str, int]
    total: int
    no_show_rate_percent: float
    active_providers: int


class MonthlyDayStats(CoreModel):
    date: str
    total: int
    completed: int
    cancelled: int
    no_show: int
    scheduled: int
    checked_in: int
    in_progress: int


class MonthlyStats(CoreModel):
    year: int
    month: int
    days: list[MonthlyDayStats]


class WeeklyProviderStats(CoreModel):
    provider_id: str
    provider_name: str
    booked: int
    max: int


class WeeklyDayStats(CoreModel):
    date: str
    providers: list[WeeklyProviderStats]
    total_booked: int
    total_capacity: int


class WeeklyStats(CoreModel):
    days: list[WeeklyDayStats]


class Slot(CoreModel):
    start: str
    end: str
    available: bool
    reason: str | None = None


class AvailableSlotsResponse(CoreModel):
    provider_id: str
    date: str
    service_duration_minutes: int
    slots: list[Slot]
