from typing import Any

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    """
    CRUD operations for User instances.
    Overrides `create` and `update` to handle secure password hashing.
    """

    def get_by_email(self, db: Session, *, email: str) -> User | None:
        """Fetch a User by their unique email."""
        return db.query(self.model).filter(self.model.email == email).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        """Create a user with a securely hashed password."""
        db_obj = User(
            name=obj_in.name,
            email=obj_in.email,
            role_id=obj_in.role_id,
            hashed_password=get_password_hash(obj_in.password),
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: User, obj_in: UserUpdate | dict[str, Any]
    ) -> User:
        """
        Update user profile.
        If a password is provided in the dict (e.g. via dedicated password reset route),
        ensure it is hashed before saving.
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        if "password" in update_data:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password

        return super().update(db, db_obj=db_obj, obj_in=update_data)


user = CRUDUser(User)
