from pydantic import Field, EmailStr
from app.schemas.core import CoreModel


# ═══════════════════════ User Simple Response ═══════════════════════


class UserSimpleResponse(CoreModel):
    id: str
    name: str
    email: EmailStr

    model_config = {"from_attributes": True}


# ═══════════════════════ Role Schemas ═══════════════════════


class RoleBase(CoreModel):
    name: str = Field(..., max_length=50, examples=["admin"])
    description: str | None = None


class RoleCreate(RoleBase):
    pass


class RoleUpdate(CoreModel):
    name: str | None = Field(None, max_length=50)
    description: str | None = None


class RoleResponse(RoleBase):
    id: int
    user_count: int = 0
    permission_count: int = 0

    model_config = {"from_attributes": True}


# ═══════════════════════ Permission Schemas ═══════════════════════


class PermissionBase(CoreModel):
    name: str = Field(..., max_length=100, examples=["appointments.create"])
    description: str | None = None


class PermissionCreate(PermissionBase):
    pass


class PermissionUpdate(CoreModel):
    name: str | None = Field(None, max_length=100)
    description: str | None = None


class PermissionResponse(PermissionBase):
    id: int

    model_config = {"from_attributes": True}


# ═══════════════════════ Role with Permissions ═══════════════════════


class RoleWithPermissions(RoleResponse):
    permissions: list[PermissionResponse] = []


class RolePermissionUpdate(CoreModel):
    permission_ids: list[int]
