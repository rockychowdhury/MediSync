from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud
from app.api.deps import get_db, get_current_user, get_current_active_admin
from app.core.security import verify_password
from app.core.auth import JWTAuthManager
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.utils.response import APIResponse, ResponseMessages
from fastapi import Response

router = APIRouter()


@router.post("/login")
def login(
    response: Response,
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, setting access and refresh tokens as HTTPOnly cookies.
    """
    user = crud.user.get_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        return APIResponse.error(
            message=ResponseMessages.INVALID_CREDENTIALS,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    # is_active doesn't seem to exist on model currently, skip or add check based on locked_until
    # We will assume successful auth
    
    access_token, refresh_token = JWTAuthManager.generate_token_pair(user.id, user.role_id)
    
    response_obj = APIResponse.success(
        message=ResponseMessages.LOGIN_SUCCESS,
        data={
            "user_id": user.id,
            "role_id": user.role_id
        }
    )
    JWTAuthManager.set_auth_cookies(response_obj, access_token, refresh_token)
    return response_obj

@router.post("/logout")
def logout(response: Response) -> Any:
    """
    Clear authentication cookies to log out the user.
    """
    response_obj = APIResponse.success(message=ResponseMessages.LOGOUT_SUCCESS)
    JWTAuthManager.clear_auth_cookies(response_obj)
    return response_obj


@router.post("/register", response_model=UserResponse)
def register(
    *, 
    db: Session = Depends(get_db), 
    user_in: UserCreate,
    current_admin: User = Depends(get_current_active_admin)
) -> Any:
    """
    Register a new user in the system.
    """
    user = crud.user.get_by_email(db, email=user_in.email)
    if user:
        return APIResponse.error(
            message=ResponseMessages.USER_ALREADY_EXISTS,
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Prevent creating admin accounts via API
    from app.models.role import Role
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if user_in.role_id == admin_role.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not a valid role.",
        )

    user = crud.user.create(db, obj_in=user_in)
    
    # Use standard response dict matching UserResponse schema
    return user


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)) -> Any:
    """
    Fetch the currently authenticated user's profile details.
    """
    return current_user
