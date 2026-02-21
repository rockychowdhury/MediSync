from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.schemas.role import RoleResponse


# ═══════════════════════ User Schemas ═══════════════════════


class UserBase(BaseModel):
    name: str = Field(..., max_length=150)
    email: EmailStr
    role_id: int


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseModel):
    name: str | None = Field(None, max_length=150)
    email: EmailStr | None = None
    role_id: int | None = None
    is_active: bool | None = None


class UserResponse(UserBase):
    id: str
    is_active: bool
    last_login_at: datetime | None = None
    failed_login_attempts: int = 0
    locked_until: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserWithRole(UserResponse):
    role: RoleResponse
