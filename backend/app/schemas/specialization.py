from pydantic import BaseModel, Field


# ═══════════════════════ Specialization Schemas ═══════════════════════


class SpecializationBase(BaseModel):
    name: str = Field(..., max_length=100, examples=["Cardiology"])
    description: str | None = None


class SpecializationCreate(SpecializationBase):
    pass


class SpecializationResponse(SpecializationBase):
    id: int

    model_config = {"from_attributes": True}
