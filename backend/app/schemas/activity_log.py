from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Any


class ActivityLogBase(BaseModel):
    action_type: str
    entity_type: str
    entity_id: str | None = None
    description: str | None = None
    old_values: dict[str, Any] | None = None
    new_values: dict[str, Any] | None = None
    ip_address: str | None = None

class ActivityLogCreate(ActivityLogBase):
    pass


class ActivityLogResponse(ActivityLogBase):
    id: int
    user_id: str | None = None
    user_name: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityLogListResponse(BaseModel):
    items: list[ActivityLogResponse]
    total: int
