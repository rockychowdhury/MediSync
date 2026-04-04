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

    def get_active_by_email(self, db: Session, *, email: str) -> User | None:
        """Fetch an active User by their unique email."""
        return db.query(self.model).filter(
            self.model.email == email, 
            self.model.is_active == True
        ).first()

    def get_multi_filtered(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        role_id: int | None = None,
        is_active: bool | None = None,
        search: str | None = None
    ) -> tuple[list[User], int]:
        """Fetch users with pagination and filtering."""
        query = db.query(self.model)
        
        if role_id is not None:
            query = query.filter(self.model.role_id == role_id)
        if is_active is not None:
            query = query.filter(self.model.is_active == is_active)
        
        # By default, exclude soft-deleted records unless search is specific
        from app.models.base_model import BaseModel
        if hasattr(self.model, "deleted_at") and not search:
            query = query.filter(self.model.deleted_at == None)
        
        if search:
            query = query.filter(
                (self.model.email.ilike(f"%{search}%")) | 
                (self.model.name.ilike(f"%{search}%"))
            )
            
        total = query.count()
        users = query.offset(skip).limit(limit).all()
        return users, total

    def get_non_providers(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None
    ) -> tuple[list[User], int]:
        """Fetch users who do NOT have an associated provider profile."""
        from app.models.provider import Provider
        
        query = db.query(self.model).outerjoin(Provider).filter(Provider.id == None)
        query = query.filter(self.model.is_active == True)
        
        if search:
            query = query.filter(
                (self.model.email.ilike(f"%{search}%")) |
                (self.model.name.ilike(f"%{search}%"))
            )
            
        total = query.count()
        users = query.offset(skip).limit(limit).all()
        return users, total

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        """Create a user with a securely hashed password."""
        # Data cleaning
        email = obj_in.email.lower().strip()
        name = obj_in.name.strip()
        
        db_obj = User(
            name=name,
            email=email,
            role_id=obj_in.role_id,
            password_hash=get_password_hash(obj_in.password),
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
            update_data["password_hash"] = hashed_password

        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def create_superuser(self, db: Session, *, obj_in: UserCreate) -> User:
        """Create a superuser with the admin role."""
        from app.models.role import Role
        
        # Ensure role exists or fetch admin role
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            raise Exception("Admin role not found during superuser creation.")
            
        obj_in.role_id = admin_role.id
        return self.create(db, obj_in=obj_in)

    def assign_role(self, db: Session, *, user: User, role_id: int) -> User:
        """Update a user's role."""
        return self.update(db, db_obj=user, obj_in={"role_id": role_id})


user = CRUDUser(User)
