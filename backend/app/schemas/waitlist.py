from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


# ═══════════════════════ Waitlist Schemas ═══════════════════════

WaitlistPriority = Literal["standard", "urgent", "emergency"]
WaitlistStatus = Literal["waiting", "assigned", "cancelled", "expired"]


class WaitlistBase(BaseModel):
    patient_id: str
    service_id: str
    provider_id: str | None = None
    requested_date: date | None = None
    priority: WaitlistPriority = "standard"
    notes: str | None = None


class WaitlistCreate(WaitlistBase):
    pass


class WaitlistUpdate(BaseModel):
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
    assigned_appointment_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
