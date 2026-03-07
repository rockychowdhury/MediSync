from pydantic import BaseModel, Field


# ═══════════════════════ Role Schemas ═══════════════════════


class RoleBase(BaseModel):
    name: str = Field(..., max_length=50, examples=["admin"])
    description: str | None = None


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: str | None = Field(None, max_length=50)
    description: str | None = None


class RoleResponse(RoleBase):
    id: int

    model_config = {"from_attributes": True}


# ═══════════════════════ Permission Schemas ═══════════════════════


class PermissionBase(BaseModel):
    name: str = Field(..., max_length=100, examples=["appointments.create"])
    description: str | None = None


class PermissionCreate(PermissionBase):
    pass


class PermissionUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    description: str | None = None


class PermissionResponse(PermissionBase):
    id: int

    model_config = {"from_attributes": True}


# ═══════════════════════ Role with Permissions ═══════════════════════


class RoleWithPermissions(RoleResponse):
    permissions: list[PermissionResponse] = []


class RolePermissionUpdate(BaseModel):
    permission_ids: list[int]
