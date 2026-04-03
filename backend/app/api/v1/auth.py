from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud
from app.api.deps import get_db, get_current_user, get_current_active_admin
from app.core.security import verify_password
from app.core.auth import JWTAuthManager
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, ForgotPasswordRequest, ResetPasswordRequest
from app.utils.response import APIResponse, ResponseMessages
from app.services.email_service import EmailService
from app.services.redis_token_service import RedisTokenService
from app.services.user_service import UserService
from fastapi import Response

router = APIRouter()


@router.post("/login")
def login(
    request: Request,
    response: Response,
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, setting access and refresh tokens as HTTPOnly cookies.
    """
    user = crud.user.get_by_email(db, email=form_data.username)
    if not user:
        return APIResponse.error(
            message=ResponseMessages.INVALID_CREDENTIALS,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    # Check if account is locked or deactivated
    from datetime import datetime, timezone, timedelta
    if not user.is_active:
        return APIResponse.error(
            message=ResponseMessages.ACCOUNT_DISABLED,
            status_code=status.HTTP_403_FORBIDDEN,
        )

    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        return APIResponse.error(
            message=f"Account is locked until {user.locked_until.strftime('%Y-%m-%d %H:%M:%S')} UTC",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    if not verify_password(form_data.password, user.password_hash):
        # Update failed attempts
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.add(user)
        db.commit()
        
        UserService.log_activity(
            db,
            user_id=user.id,
            action="login_failed",
            description=f"Failed login attempt for {user.email}",
            ip_address=request.client.host if request.client else None
        )
        
        return APIResponse.error(
            message=ResponseMessages.INVALID_CREDENTIALS,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    
    # Successful login logic
    user.last_login_at = datetime.now(timezone.utc)
    user.failed_login_attempts = 0
    user.locked_until = None
    db.add(user)
    db.commit()
    
    UserService.log_activity(
        db,
        user_id=user.id,
        action="login_success",
        description=f"Successful login for {user.email}",
        ip_address=request.client.host if request.client else None
    )
    
    access_token, refresh_token = JWTAuthManager.generate_token_pair(user.id, user.role_id)
    
    # We want to include role_name in the response data
    response_obj = APIResponse.success(
        message=ResponseMessages.LOGIN_SUCCESS,
        data={
            "user_id": user.id,
            "role_id": user.role_id,
            "role_name": user.role.name if user.role else None,
            "token": access_token
        }
    )
    JWTAuthManager.set_auth_cookies(response_obj, access_token, refresh_token)

    return response_obj

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Clear authentication cookies to log out the user.
    """
    UserService.log_activity(
        db,
        user_id=current_user.id,
        action="logout",
        description=f"User {current_user.email} logged out",
        ip_address=request.client.host if request.client else None
    )
    response_obj = APIResponse.success(message=ResponseMessages.LOGOUT_SUCCESS)
    JWTAuthManager.clear_auth_cookies(response_obj)
    return response_obj


@router.post("/forgot-password")
def forgot_password(
    request: Request,
    req: ForgotPasswordRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> Any:
    """Send password reset link to user's email."""
    user = crud.user.get_by_email(db, email=req.email)
    if not user:
         # Return success anyway to prevent email enumeration
         return APIResponse.success(message="Password reset email sent if account exists")
    
    # Generate a temporary token
    import secrets
    token = secrets.token_urlsafe(32)
    
    # Store token in Redis (5 min TTL)
    RedisTokenService.store_reset_token(token=token, user_id=user.id)
    
    background_tasks.add_task(EmailService.send_password_reset_email, email=user.email, token=token)
    
    UserService.log_activity(
        db,
        user_id=user.id,
        action="FORGOT_PASSWORD_REQUEST",
        entity_id=user.id,
        description=f"Password reset link requested for {user.email}",
        ip_address=request.client.host if request.client else None
    )
    return APIResponse.success(message="Password reset email sent")


@router.post("/reset-password")
def reset_password(
    request: Request,
    req: ResetPasswordRequest, 
    db: Session = Depends(get_db)
) -> Any:
    """Reset password using token from email."""
    # Validate token from Redis
    user_id = RedisTokenService.verify_reset_token(token=req.token)
    if not user_id:
        return APIResponse.error(
            message="Invalid or expired reset token",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # Get user object
    user = crud.user.get(db, id=user_id)
    if not user:
        return APIResponse.error(
            message="User not found",
            status_code=status.HTTP_404_NOT_FOUND
        )

    # Reset password
    UserService.reset_password(
        db, 
        db_obj=user, 
        new_password=req.new_password,
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(message="Password reset successful")
