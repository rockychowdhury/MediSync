from datetime import date, datetime

from pydantic import EmailStr, Field
from app.schemas.core import CoreModel


# ═══════════════════════ Patient Schemas ═══════════════════════


class PatientBase(CoreModel):
    name: str = Field(..., max_length=150)
    phone: str | None = Field(None, max_length=20)
    email: EmailStr | None = None
    date_of_birth: date | None = None
    gender: str | None = Field(None, max_length=20)
    notification_opt_out: bool = False


class PatientCreate(PatientBase):
    pass


class PatientUpdate(CoreModel):
    name: str | None = Field(None, max_length=150)
    phone: str | None = Field(None, max_length=20)
    email: EmailStr | None = None
    date_of_birth: date | None = None
    gender: str | None = Field(None, max_length=20)
    notification_opt_out: bool | None = None
    is_active: bool | None = None


class PatientResponse(PatientBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
