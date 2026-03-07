from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.schemas.role import RoleResponse


# ═══════════════════════ User Schemas ═══════════════════════


class UserBase(BaseModel):
    name: str = Field(..., max_length=150)
    email: EmailStr
    role_id: int


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=72)
    
    model_config = {"extra": "forbid"}


class UserUpdate(BaseModel):
    name: str | None = Field(None, max_length=150)
    email: EmailStr | None = None
    role_id: int | None = None
    is_active: bool | None = None
    
    model_config = {"extra": "forbid"}


class ProfileUpdate(BaseModel):
    name: str | None = Field(None, max_length=150)
    email: EmailStr | None = None

    model_config = {"extra": "forbid"}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    model_config = {"extra": "forbid"}


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=72)

    model_config = {"extra": "forbid"}


class UserResponse(UserBase):
    id: str
    is_active: bool
    role_name: str | None = None
    last_login_at: datetime | None = None
    failed_login_attempts: int = 0
    locked_until: datetime | None = None
    created_at: datetime
    updated_at: datetime
    
    # Internal field to capture the relationship from ORM, excluded from response
    role: Any = Field(None, exclude=True)

    @model_validator(mode="after")
    def set_role_name(self) -> "UserResponse":
        # Pull role name from the internal role field if it exists
        if self.role and hasattr(self.role, "name"):
             self.role_name = self.role.name
        return self

    model_config = {"from_attributes": True}


class UserWithRole(UserResponse):
    role: RoleResponse
