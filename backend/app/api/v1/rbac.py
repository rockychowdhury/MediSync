from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app import crud
from app.api.deps import get_db, get_current_active_admin
from app.schemas.role import (
    PermissionCreate,
    PermissionUpdate,
    PermissionResponse,
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    RoleWithPermissions,
    RolePermissionUpdate,
    UserSimpleResponse,
)
from app.utils.response import APIResponse, ResponseMessages
from app.services.user_service import UserService

router = APIRouter()

SYSTEM_ROLES = ["admin", "receptionist", "provider"]

# ═══════════════════════ Permission Management ═══════════════════════


@router.get("/permissions", response_model=list[PermissionResponse])
def read_permissions(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Any = Depends(get_current_active_admin),
) -> Any:
    """List all available permissions (Admin only)."""
    permissions = crud.permission.get_multi(db, skip=skip, limit=limit)
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=[PermissionResponse.model_validate(p) for p in permissions]
    )


@router.post("/permissions", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
def create_permission(
    *,
    request: Request,
    db: Session = Depends(get_db),
    permission_in: PermissionCreate,
    current_user: Any = Depends(get_current_active_admin),
) -> Any:
    """Create a new granular permission (Admin only)."""
    existing = crud.permission.get_by_name(db, name=permission_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission already exists"
        )
    permission = crud.permission.create(db, obj_in=permission_in)
    
    UserService.log_activity(
        db,
        user_id=current_user.id,
        action="create_permission",
        entity_type="permission",
        entity_id=str(permission.id),
        description=f"Administrative creation of permission: {permission.name}",
        new_val=permission_in.model_dump(mode="json"),
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(
        message=ResponseMessages.CREATED_SUCCESS,
        data=PermissionResponse.model_validate(permission)
    )


@router.put("/permissions/{id}", response_model=PermissionResponse)
def update_permission(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: int,
    permission_in: PermissionUpdate,
    current_user: Any = Depends(get_current_active_admin),
) -> Any:
    """Update a permission description (Admin only)."""
    permission_obj = crud.permission.get(db, id=id)
    if not permission_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )
    updated_permission = crud.permission.update(db, db_obj=permission_obj, obj_in=permission_in)
    
    UserService.log_activity(
        db,
        user_id=current_user.id,
        action="update_permission",
        entity_type="permission",
        entity_id=str(updated_permission.id),
        description=f"Administrative update of permission: {updated_permission.name}",
        old_val={"description": permission_obj.description},
        new_val=permission_in.model_dump(mode="json"),
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(
        message=ResponseMessages.UPDATED_SUCCESS,
        data=PermissionResponse.model_validate(updated_permission)
    )


@router.delete("/permissions/{id}")
def delete_permission(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: int,
    current_user: Any = Depends(get_current_active_admin),
) -> Any:
    """Delete a permission (Admin only)."""
    permission_obj = crud.permission.get(db, id=id)
    if not permission_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )
    crud.permission.delete(db, id=id)
    
    UserService.log_activity(
        db,
        user_id=current_user.id,
        action="delete_permission",
        entity_type="permission",
        entity_id=str(id),
        description=f"Administrative deletion of permission ID: {id}",
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(message=ResponseMessages.DELETED_SUCCESS)


# ═══════════════════════ Role Management & Policy ═══════════════════════


@router.get("/roles", response_model=list[RoleWithPermissions])
def read_roles(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_admin),
) -> Any:
    """List roles with their mapped permissions (Admin only)."""
    roles = crud.role.get_multi(db)
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=[RoleWithPermissions.model_validate(r) for r in roles]
    )


@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    *,
    request: Request,
    db: Session = Depends(get_db),
    role_in: RoleCreate,
    current_user: Any = Depends(get_current_active_admin),
) -> Any:
    """Create a new role (Admin only)."""
    existing = crud.role.get_by_name(db, name=role_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role already exists"
        )
    role = crud.role.create(db, obj_in=role_in)
    
    UserService.log_activity(
        db,
        user_id=current_user.id,
        action="create_role",
        entity_type="role",
        entity_id=str(role.id),
        description=f"Administrative creation of role: {role.name}",
        new_val=role_in.model_dump(mode="json"),
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(
        message=ResponseMessages.CREATED_SUCCESS,
        data=RoleResponse.model_validate(role)
    )


@router.put("/roles/{id}", response_model=RoleResponse)
def update_role(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: int,
    role_in: RoleUpdate,
    current_user: Any = Depends(get_current_active_admin),
) -> Any:
    """Update a role description (Admin only)."""
    role_obj = crud.role.get(db, id=id)
    if not role_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    updated_role = crud.role.update(db, db_obj=role_obj, obj_in=role_in)
    
    UserService.log_activity(
        db,
        user_id=current_user.id,
        action="update_role",
        entity_type="role",
        entity_id=str(updated_role.id),
        description=f"Administrative update of role: {updated_role.name}",
        new_val=role_in.model_dump(mode="json"),
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(
        message=ResponseMessages.UPDATED_SUCCESS,
        data=RoleResponse.model_validate(updated_role)
    )


@router.delete("/roles/{id}")
def delete_role(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: int,
    current_user: Any = Depends(get_current_active_admin),
) -> Any:
    """Delete a role (Admin only)."""
    role_obj = crud.role.get(db, id=id)
    if not role_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    if role_obj.name in SYSTEM_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete system roles"
        )
        
    if role_obj.user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete role with {role_obj.user_count} active users"
        )
        
    crud.role.delete(db, id=id)
    
    UserService.log_activity(
        db,
        user_id=current_user.id,
        action="delete_role",
        entity_type="role",
        entity_id=str(id),
        description=f"Administrative deletion of role ID: {id}",
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(message=ResponseMessages.DELETED_SUCCESS)


@router.get("/roles/{id}/users", response_model=list[UserSimpleResponse])
def read_role_users(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: Any = Depends(get_current_active_admin),
) -> Any:
    """List users assigned to a specific role (Admin only)."""
    role_obj = crud.role.get(db, id=id)
    if not role_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=[UserSimpleResponse.model_validate(u) for u in role_obj.users]
    )


@router.post("/roles/{id}/permissions", response_model=RoleWithPermissions)
def assign_role_permissions(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: int,
    perm_in: RolePermissionUpdate,
    current_user: Any = Depends(get_current_active_admin),
) -> Any:
    """Assign a list of permissions to a role (Admin only)."""
    role_obj = crud.role.get(db, id=id)
    if not role_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    updated_role = crud.role.assign_permissions(db, db_obj=role_obj, permission_ids=perm_in.permission_ids)
    
    UserService.log_activity(
        db,
        user_id=current_user.id,
        action="assign_role_permissions",
        entity_type="role",
        entity_id=str(role_obj.id),
        description=f"Assigned permissions to role {role_obj.name}",
        new_val=perm_in.model_dump(mode="json"),
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(
        message="Permissions assigned successfully",
        data=RoleWithPermissions.model_validate(updated_role)
    )


@router.delete("/roles/{id}/permissions/{permission_id}", response_model=RoleWithPermissions)
def revoke_role_permission(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: int,
    permission_id: int,
    current_user: Any = Depends(get_current_active_admin),
) -> Any:
    """Revoke a specific permission from a role (Admin only)."""
    role_obj = crud.role.get(db, id=id)
    if not role_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    updated_role = crud.role.revoke_permission(db, db_obj=role_obj, permission_id=permission_id)
    
    UserService.log_activity(
        db,
        user_id=current_user.id,
        action="revoke_role_permission",
        entity_type="role",
        entity_id=str(role_obj.id),
        description=f"Revoked permission ID {permission_id} from role {role_obj.name}",
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(
        message="Permission revoked successfully",
        data=RoleWithPermissions.model_validate(updated_role)
    )
