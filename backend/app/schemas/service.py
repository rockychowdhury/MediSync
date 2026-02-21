from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.specialization import SpecializationResponse


# ═══════════════════════ Service Schemas ═══════════════════════


class ServiceBase(BaseModel):
    name: str = Field(..., max_length=150)
    description: str | None = None
    category: str | None = Field(None, max_length=100)
    duration_minutes: int = Field(..., gt=0, le=480)
    buffer_time_minutes: int = Field(default=0, ge=0, le=120)
    required_specialization_id: int | None = None
    fee: Decimal | None = Field(None, ge=0, max_digits=10, decimal_places=2)
    billing_code: str | None = Field(None, max_length=50)


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: str | None = Field(None, max_length=150)
    description: str | None = None
    category: str | None = Field(None, max_length=100)
    duration_minutes: int | None = Field(None, gt=0, le=480)
    buffer_time_minutes: int | None = Field(None, ge=0, le=120)
    required_specialization_id: int | None = None
    fee: Decimal | None = Field(None, ge=0, max_digits=10, decimal_places=2)
    billing_code: str | None = Field(None, max_length=50)
    is_active: bool | None = None


class ServiceResponse(ServiceBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ServiceWithSpecialization(ServiceResponse):
    required_specialization: SpecializationResponse | None = None
