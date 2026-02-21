from datetime import date, datetime
from datetime import time as time_type

from pydantic import BaseModel, Field, model_validator


# ═══════════════════════ Provider Time Off Schemas ═══════════════════════


class ProviderTimeOffBase(BaseModel):
    provider_id: str
    start_date: date
    end_date: date
    start_time: time_type | None = None
    end_time: time_type | None = None
    reason: str | None = Field(None, max_length=255)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date > self.end_date:
            raise ValueError("start_date must be on or before end_date")
        return self


class ProviderTimeOffCreate(ProviderTimeOffBase):
    pass


class ProviderTimeOffUpdate(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    start_time: time_type | None = None
    end_time: time_type | None = None
    reason: str | None = Field(None, max_length=255)
    is_approved: bool | None = None
    approved_by: str | None = None


class ProviderTimeOffResponse(ProviderTimeOffBase):
    id: int
    approved_by: str | None = None
    is_approved: bool
    created_at: datetime

    model_config = {"from_attributes": True}
