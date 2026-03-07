"""
Application-wide FastAPI dependencies.

Provides database session management and user authentication logic.
"""

from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Annotated

from app.db.session import get_db
from app.models.user import User

__all__ = ["get_db", "get_current_user", "get_current_active_admin", "get_current_active_staff", "get_current_active_provider", "PermissionChecker"]

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """
    Fetches the current user from the database based on the authentication middleware context.
    The middleware validates the token and sets request.state.user_payload.
    """
    payload = getattr(request.state, "user_payload", None) #From Middleware
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    from app.crud.crud_user import user as user_crud
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # We might want to check if account is disabled depending on User model
    # (Optional based on business logic)
    
    return user


def get_current_active_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensures the current user is an active admin.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user account",
        )
    if current_user.role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user
def get_current_active_receptionist(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensures the current user is an active receptionist."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user account",
        )
    if current_user.role.name != "receptionist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user


def get_current_active_staff(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensures the current user is either an admin or a receptionist."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user account",
        )
    if current_user.role.name not in ["admin", "receptionist"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user


def get_current_active_provider(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensures the current user is an active provider."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user account",
        )
    if current_user.role.name != "provider":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user


class PermissionChecker:
    """
    A class-based dependency to check for granular permissions in the database.
    Example: Depends(PermissionChecker(["patient:create"]))
    """
    def __init__(self, required_permissions: list[str]):
        self.required_permissions = required_permissions

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        user_permissions = {p.name for p in current_user.role.permissions}
        
        # Check if the user has any of the required permissions
        if not any(perm in user_permissions for perm in self.required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have the required permissions to perform this action",
            )
        
        return current_user
