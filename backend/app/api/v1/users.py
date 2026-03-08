from typing import Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app import crud
from app.api.deps import get_db, get_current_active_admin
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.user_service import UserService
from app.utils.response import APIResponse, ResponseMessages

router = APIRouter()

@router.get("/", response_model=list[UserResponse])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    role_id: int | None = Query(None),
    is_active: bool | None = Query(None),
    search: str | None = Query(None),
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """Retrieve all users with filtering and pagination."""
    users, total = crud.user.get_multi_filtered(
        db, skip=skip, limit=limit, role_id=role_id, is_active=is_active, search=search
    )
    return APIResponse.paginated_success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=[UserResponse.model_validate(u) for u in users],
        pagination_data={"total": total, "skip": skip, "limit": limit}
    )

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """Create a new user (Admin only)."""
    user = crud.user.get_by_email(db, email=user_in.email)
    if user:
        return APIResponse.error(
            message=ResponseMessages.USER_ALREADY_EXISTS,
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    # Prevent creating admin accounts unless explicitly allowed (but requirement says no admin creation via api)
    from app.models.role import Role
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if admin_role and user_in.role_id == admin_role.id:
         return APIResponse.error(
            message="Cannot create admin accounts via this endpoint",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    user = UserService.create_user(db, obj_in=user_in, actor_id=current_admin.id)
    return APIResponse.success(
        message=ResponseMessages.CREATED_SUCCESS,
        data=UserResponse.model_validate(user),
        status_code=status.HTTP_201_CREATED
    )


@router.get("/{id}", response_model=UserResponse)
def read_user_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """Get a specific user by ID."""
    user = crud.user.get(db, id=id)
    if not user:
        return APIResponse.error(
            message=ResponseMessages.USER_NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=UserResponse.model_validate(user)
    )

@router.put("/{id}", response_model=UserResponse)
def update_user(
    *,
    db: Session = Depends(get_db),
    id: str,
    user_in: UserUpdate,
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """Update a user's information or role."""
    user = crud.user.get(db, id=id)
    if not user:
        return APIResponse.error(
            message=ResponseMessages.USER_NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    # Logic for role update: user allows updating role too
    updated_user = UserService.update_user(db, db_obj=user, obj_in=user_in, actor_id=current_admin.id)
    return APIResponse.success(
        message=ResponseMessages.UPDATED_SUCCESS,
        data=UserResponse.model_validate(updated_user)
    )

@router.delete("/{id}")
def delete_user(
    *,
    db: Session = Depends(get_db),
    id: str,
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """Soft delete a user."""
    user = crud.user.get(db, id=id)
    if not user:
        return APIResponse.error(
            message=ResponseMessages.USER_NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND,
        )
    updated_user = UserService.soft_delete_user(db, db_obj=user, actor_id=current_admin.id)
    return APIResponse.success(message=ResponseMessages.DELETED_SUCCESS)

@router.patch("/{id}/activate")
async def activate_user(
    *,
    db: Session = Depends(get_db),
    id: str,
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """Re-activate a user account."""
    user = crud.user.get(db, id=id)
    if not user:
        return APIResponse.error(
            message=ResponseMessages.USER_NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND,
        )
    updated_user = await UserService.activate_user(db, db_obj=user, actor_id=current_admin.id)
    return APIResponse.success(message="Account activated successfully")

@router.patch("/{id}/deactivate")
def deactivate_user(
    *,
    db: Session = Depends(get_db),
    id: str,
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """Deactivate a user account."""
    user = crud.user.get(db, id=id)
    if not user:
        return APIResponse.error(
            message=ResponseMessages.USER_NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND,
        )
    updated_user = UserService.deactivate_user(db, db_obj=user, actor_id=current_admin.id)
    return APIResponse.success(message="Account deactivated successfully")
