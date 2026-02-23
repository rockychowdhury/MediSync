from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud
from app.api.deps import get_db, get_current_user
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.utils.response import APIResponse, ResponseMessages

router = APIRouter()


@router.post("/login")
def login(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, getting an access token for future requests.
    """
    user = crud.user.get_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        return APIResponse.error(
            message=ResponseMessages.INVALID_CREDENTIALS,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    elif not user.is_active:
        return APIResponse.error(
            message=ResponseMessages.ACCOUNT_DISABLED,
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # JWT generation is STUBBED Out exactly as specified by the user.
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user.id,
    }


@router.post("/register", response_model=UserResponse)
def register(
    *, db: Session = Depends(get_db), user_in: UserCreate
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

    user = crud.user.create(db, obj_in=user_in)
    
    # Use standard response dict matching UserResponse schema
    return user


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)) -> Any:
    """
    Fetch the currently authenticated user's profile details.
    """
    return current_user
