from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ═══════════════════════ Activity Log Schemas ═══════════════════════


class ActivityLogBase(BaseModel):
    action_type: str = Field(..., max_length=60, examples=["create_appointment"])
    entity_type: str = Field(..., max_length=50, examples=["appointment"])
    entity_id: str | None = Field(None, max_length=50)
    description: str | None = None


class ActivityLogCreate(ActivityLogBase):
    user_id: str | None = None
    old_values: dict[str, Any] | None = None
    new_values: dict[str, Any] | None = None
    ip_address: str | None = Field(None, max_length=45)


class ActivityLogResponse(ActivityLogBase):
    """Immutable — no Update schema."""

    id: int
    user_id: str | None = None
    old_values: dict[str, Any] | None = None
    new_values: dict[str, Any] | None = None
    ip_address: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
