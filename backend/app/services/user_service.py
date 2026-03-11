from typing import Any
from sqlalchemy.orm import Session
from app import crud
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash
from app.crud.crud_activity_log import activity_log as log_crud
from app.services.email_service import EmailService

class UserService:
    @staticmethod
    def log_activity(
        db: Session,
        user_id: str | None,
        action: str,
        entity_id: str | None = None,
        description: str | None = None,
        old_val: dict | None = None,
        new_val: dict | None = None,
        entity_type: str = "user",
        ip_address: str | None = None
    ):
        return log_crud.create(
            db,
            user_id=user_id,
            action_type=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            old_values=old_val,
            new_values=new_val,
            ip_address=ip_address
        )

    @staticmethod
    def create_user(db: Session, *, obj_in: UserCreate, actor_id: str, ip_address: str | None = None) -> User:
        user = crud.user.create(db, obj_in=obj_in)
        UserService.log_activity(
            db, 
            user_id=actor_id, 
            action="CREATE_USER", 
            entity_id=user.id,
            description=f"Created user {user.email}",
            new_val={"email": user.email, "role_id": user.role_id},
            ip_address=ip_address
        )
        return user

    @staticmethod
    def update_user(
        db: Session, 
        *, 
        db_obj: User, 
        obj_in: UserUpdate | dict[str, Any], 
        actor_id: str,
        ip_address: str | None = None
    ) -> User:
        old_data = {"name": db_obj.name, "email": db_obj.email, "role_id": db_obj.role_id, "is_active": db_obj.is_active}
        user = crud.user.update(db, db_obj=db_obj, obj_in=obj_in)
        new_data = {"name": user.name, "email": user.email, "role_id": user.role_id, "is_active": user.is_active}
        
        UserService.log_activity(
            db,
            user_id=actor_id,
            action="UPDATE_USER",
            entity_id=user.id,
            old_val=old_data,
            new_val=new_data,
            ip_address=ip_address
        )
        return user

    @staticmethod
    def deactivate_user(db: Session, *, db_obj: User, actor_id: str, ip_address: str | None = None) -> User:
        user = crud.user.update(db, db_obj=db_obj, obj_in={"is_active": False})
        UserService.log_activity(
            db,
            user_id=actor_id,
            action="DEACTIVATE_USER",
            entity_id=user.id,
            description=f"Deactivated user {user.email}",
            ip_address=ip_address
        )
        return user

    @staticmethod
    def soft_delete_user(db: Session, *, db_obj: User, actor_id: str, ip_address: str | None = None) -> User:
        from datetime import datetime, timezone
        user = crud.user.update(
            db, 
            db_obj=db_obj, 
            obj_in={"is_active": False, "deleted_at": datetime.now(timezone.utc)}
        )
        UserService.log_activity(
            db,
            user_id=actor_id,
            action="SOFT_DELETE_USER",
            entity_id=user.id,
            description=f"Soft deleted user {user.email}",
            ip_address=ip_address
        )
        return user

    @staticmethod
    async def activate_user(db: Session, *, db_obj: User, actor_id: str, ip_address: str | None = None) -> User:
        user = crud.user.update(db, db_obj=db_obj, obj_in={"is_active": True, "deleted_at": None})
        UserService.log_activity(
            db,
            user_id=actor_id,
            action="ACTIVATE_USER",
            entity_id=user.id,
            description=f"Activated/Restored user {user.email}",
            ip_address=ip_address
        )
        await EmailService.send_account_activation_email(email=user.email, name=user.name)
        return user

    @staticmethod
    def change_password(db: Session, *, db_obj: User, new_password: str, actor_id: str, ip_address: str | None = None) -> User:
        user = crud.user.update(db, db_obj=db_obj, obj_in={"password": new_password})
        UserService.log_activity(
            db,
            user_id=actor_id,
            action="CHANGE_PASSWORD",
            entity_id=user.id,
            description="Changed user password",
            ip_address=ip_address
        )
        return user

    @staticmethod
    def reset_password(db: Session, *, db_obj: User, new_password: str, ip_address: str | None = None) -> User:
        # Update user password
        user = crud.user.update(db, db_obj=db_obj, obj_in={"password": new_password})
        
        UserService.log_activity(
            db,
            user_id=user.id,
            action="RESET_PASSWORD",
            entity_id=user.id,
            description="Reset password via secure token",
            ip_address=ip_address
        )
        return user
