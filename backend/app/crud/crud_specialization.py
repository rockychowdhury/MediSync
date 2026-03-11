from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.specialization import Specialization
from app.schemas.specialization import SpecializationCreate, SpecializationBase


class CRUDSpecialization(CRUDBase[Specialization, SpecializationCreate, SpecializationBase]):
    def get_by_name(self, db: Session, *, name: str) -> Specialization | None:
        return db.query(self.model).filter(self.model.name == name).first()

    def get_multi_filtered(
        self, db: Session, *, skip: int = 0, limit: int = 100, search: str | None = None
    ) -> tuple[list[Specialization], int]:
        query = db.query(self.model)
        if search:
            query = query.filter(self.model.name.ilike(f"%{search}%"))
        
        total = query.count()
        specializations = query.offset(skip).limit(limit).all()
        return specializations, total


specialization = CRUDSpecialization(Specialization)
