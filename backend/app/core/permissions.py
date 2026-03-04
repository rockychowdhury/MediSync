from typing import List, Callable
from fastapi import Request, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.models.user import User

class Permissions:
    """System-wide permission definitions corresponding to database seeded values."""
    
    # Provider permissions
    VIEW_PROVIDER = "view_provider"
    CREATE_PROVIDER = "create_provider"
    UPDATE_PROVIDER = "update_provider"
    DELETE_PROVIDER = "delete_provider"

    # Appointment permissions
    VIEW_APPOINTMENT = "view_appointment"
    CREATE_APPOINTMENT = "create_appointment"
    UPDATE_APPOINTMENT = "update_appointment"
    DELETE_APPOINTMENT = "delete_appointment"
    
    # User / System permissions
    MANAGE_USERS = "manage_users"
    MANAGE_SETTINGS = "manage_settings"


def require_permissions(required_permissions: List[str]) -> Callable:
    """
    Dependency factory that checks if the current user has all required permissions.
    Expects the token payload to have already been parsed by the middleware,
    which provides the user's role. For fine-grained checks, we fetch the 
    user and their roles from the DB.
    """
    def check_permissions(current_user: User = Depends(get_current_user)) -> User:
        user_permissions = {perm.name for perm in current_user.role.permissions}
        
        missing_permissions = [
            perm for perm in required_permissions if perm not in user_permissions
        ]
        
        if missing_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. Missing: {', '.join(missing_permissions)}"
            )
            
        return current_user
        
    return check_permissions
