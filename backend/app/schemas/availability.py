from datetime import time as time_type
from typing import Literal

from pydantic import BaseModel, Field, model_validator


# ═══════════════════════ Availability Schemas ═══════════════════════


class AvailabilityBase(BaseModel):
    provider_id: str
    day_of_week: int = Field(..., ge=0, le=6, description="0=Sunday … 6=Saturday")
    start_time: time_type
    end_time: time_type
    break_start: time_type | None = None
    break_end: time_type | None = None
    is_working_day: bool = True
    notes: str | None = Field(None, max_length=200)

    @model_validator(mode="after")
    def validate_times(self):
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValueError("start_time must be before end_time")
        if self.break_start and not self.break_end:
            raise ValueError("break_end required when break_start is set")
        if self.break_end and not self.break_start:
            raise ValueError("break_start required when break_end is set")
        return self


class AvailabilityCreate(AvailabilityBase):
    pass


class AvailabilityUpdate(BaseModel):
    start_time: time_type | None = None
    end_time: time_type | None = None
    break_start: time_type | None = None
    break_end: time_type | None = None
    is_working_day: bool | None = None
    notes: str | None = Field(None, max_length=200)


class AvailabilityResponse(AvailabilityBase):
    id: int

    model_config = {"from_attributes": True}
