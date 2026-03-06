from typing import Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import crud
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserUpdate, UserResponse, ProfileUpdate
from app.services.user_service import UserService
from app.utils.response import APIResponse, ResponseMessages
from pydantic import BaseModel, Field

router = APIRouter()

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)

@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)) -> Any:
    """Fetch the currently authenticated user's profile."""
    from app.schemas.user import UserResponse
    user_data = UserResponse.model_validate(current_user)
    if not user_data.role_name and current_user.role:
        user_data.role_name = current_user.role.name
        
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=user_data.model_dump()
    )

@router.put("/me")
def update_current_user(
    *,
    db: Session = Depends(get_db),
    user_in: ProfileUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update basic profile information for the current user."""
    update_data = user_in.model_dump(exclude_unset=True)
    updated_user = UserService.update_user(db, db_obj=current_user, obj_in=update_data, actor_id=current_user.id)
    
    from app.schemas.user import UserResponse
    return APIResponse.success(
        message=ResponseMessages.UPDATED_SUCCESS,
        data=UserResponse.model_validate(updated_user).model_dump()
    )

@router.put("/change-password")
def change_password(
    *,
    db: Session = Depends(get_db),
    pass_in: PasswordChangeRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Change the current user's password."""
    from app.core.security import verify_password
    if not verify_password(pass_in.old_password, current_user.password_hash):
        return APIResponse.error(
            message=ResponseMessages.OLD_PASSWORD_INCORRECT,
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    UserService.change_password(db, db_obj=current_user, new_password=pass_in.new_password, actor_id=current_user.id)
    return APIResponse.success(message=ResponseMessages.PASSWORD_CHANGED)
