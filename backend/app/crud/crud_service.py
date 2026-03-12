from typing import Any
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate


class CRUDService(CRUDBase[Service, ServiceCreate, ServiceUpdate]):
    """
    CRUD operations for Service instances.
    """

    def get_multi_filtered(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        category: str | None = None,
        specialization_id: int | None = None,
        search: str | None = None,
        is_active: bool | None = None
    ) -> tuple[list[Service], int]:
        """Fetch services with pagination and filtering."""
        query = db.query(self.model)
        
        if is_active is not None:
            query = query.filter(self.model.is_active == is_active)
        
        if category:
            query = query.filter(self.model.category == category)
            
        if specialization_id:
            query = query.filter(self.model.required_specialization_id == specialization_id)
            
        if search:
            query = query.filter(
                (self.model.name.ilike(f"%{search}%")) |
                (self.model.description.ilike(f"%{search}%"))
            )
            
        total = query.count()
        services = query.offset(skip).limit(limit).all()
        return services, total

    def get_categories(self, db: Session) -> list[str]:
        """Retrieve all unique service categories."""
        categories = db.query(self.model.category).distinct().all()
        return [c[0] for c in categories if c[0] is not None]


service = CRUDService(Service)
