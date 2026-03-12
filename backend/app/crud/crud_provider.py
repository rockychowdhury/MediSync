from typing import Any
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.provider import Provider
from app.schemas.provider import ProviderCreate, ProviderUpdate
from app.models.user import User


class CRUDProvider(CRUDBase[Provider, ProviderCreate, ProviderUpdate]):
    """
    CRUD operations for Provider instances.
    """

    def get_multi_filtered(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        specialization_id: int | None = None,
        status: str | None = None,
        search: str | None = None
    ) -> tuple[list[Provider], int]:
        """Fetch providers with pagination and filtering."""
        query = db.query(self.model).join(User)
        
        if specialization_id:
            query = query.filter(self.model.specialization_id == specialization_id)
            
        if status:
            query = query.filter(self.model.status == status)
            
        if search:
            query = query.filter(
                (User.name.ilike(f"%{search}%")) |
                (User.email.ilike(f"%{search}%"))
            )
            
        total = query.count()
        providers = query.offset(skip).limit(limit).all()
        return providers, total

    def get_by_user_id(self, db: Session, user_id: str) -> Provider | None:
        """Fetch a provider profile by associated User ID."""
        return db.query(self.model).filter(self.model.id == user_id).first()


provider = CRUDProvider(Provider)
