from datetime import date, datetime
from typing import Literal

from pydantic import Field
from app.schemas.core import CoreModel


# ═══════════════════════ Waitlist Schemas ═══════════════════════

WaitlistPriority = Literal["standard", "urgent", "emergency"]
WaitlistStatus = Literal["waiting", "assigned", "cancelled", "expired"]


class WaitlistBase(CoreModel):
    patient_id: str
    service_id: str
    provider_id: str | None = None
    requested_date: date | None = None
    priority: WaitlistPriority = "standard"
    notes: str | None = None


class WaitlistCreate(WaitlistBase):
    pass


class WaitlistUpdate(CoreModel):
    provider_id: str | None = None
    requested_date: date | None = None
    priority: WaitlistPriority | None = None
    status: WaitlistStatus | None = None
    queue_position: int | None = Field(None, ge=0)
    notes: str | None = None
    assigned_appointment_id: str | None = None


class WaitlistResponse(WaitlistBase):
    id: str
    queue_position: int | None = None
    status: WaitlistStatus
    assignment_method: str | None = None
    assigned_appointment_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Operational Schemas ──

class WaitlistManualAssign(CoreModel):
    provider_id: str
    appointment_start: datetime


class WaitlistDailyStats(CoreModel):
    waiting_now: int
    assigned_today: int
    cancelled_today: int
    expired_today: int
    avg_wait_minutes_today: float
    emergency_waiting: int


class WaitlistAnalyticsSummary(CoreModel):
    total_added: int
    assigned: int
    cancelled: int
    expired: int
    auto_assigned: int
    manually_assigned: int
    conversion_rate: float


class ServiceAnalytics(CoreModel):
    service_name: str
    count: int


class PriorityAnalytics(CoreModel):
    priority: str
    count: int


class WaitlistAnalyticsResponse(CoreModel):
    summary: WaitlistAnalyticsSummary
    by_service: list[ServiceAnalytics]
    by_priority: list[PriorityAnalytics]


class WaitlistExpireRequest(CoreModel):
    before_date: date
