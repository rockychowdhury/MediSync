from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.specialization import SpecializationResponse


# ═══════════════════════ Provider Schemas ═══════════════════════

ProviderStatus = Literal["available", "on_leave", "busy"]


class ProviderBase(BaseModel):
    specialization_id: int
    consultation_fee: Decimal | None = Field(None, ge=0, max_digits=10, decimal_places=2)
    emergency_enabled: bool = False
    max_daily_appointments: int = Field(default=8, ge=1, le=50)
    status: ProviderStatus = "available"


class ProviderCreate(ProviderBase):
    id: str = Field(..., description="Must match an existing users.id (1:1 extension)")


class ProviderUpdate(BaseModel):
    specialization_id: int | None = None
    consultation_fee: Decimal | None = Field(None, ge=0, max_digits=10, decimal_places=2)
    emergency_enabled: bool | None = None
    max_daily_appointments: int | None = Field(None, ge=1, le=50)
    status: ProviderStatus | None = None


class ProviderResponse(ProviderBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProviderWithDetails(ProviderResponse):
    specialization: SpecializationResponse
