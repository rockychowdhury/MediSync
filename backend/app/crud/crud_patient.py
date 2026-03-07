from typing import Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.crud.base import CRUDBase
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate


class CRUDPatient(CRUDBase[Patient, PatientCreate, PatientUpdate]):
    """
    CRUD operations for Patient instances.
    """

    def get_by_email(self, db: Session, *, email: str) -> Patient | None:
        """Fetch a Patient by their unique email."""
        return db.query(self.model).filter(self.model.email == email).first()

    def get_by_identity(self, db: Session, *, name: str, date_of_birth: Any, email: str | None = None) -> Patient | None:
        """Fetch a Patient by their core identity (Name, DOB, and optional Email)."""
        query = db.query(self.model).filter(
            self.model.name == name,
            self.model.date_of_birth == date_of_birth
        )
        if email:
            query = query.filter(self.model.email == email)
        return query.first()

    def get_multi_filtered(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        is_active: bool | None = None,
        search: str | None = None
    ) -> tuple[list[Patient], int]:
        """Fetch patients with pagination and filtering."""
        query = db.query(self.model)
        
        if is_active is not None:
            query = query.filter(self.model.is_active == is_active)
        
        if search:
            query = query.filter(
                or_(
                    self.model.email.ilike(f"%{search}%"),
                    self.model.name.ilike(f"%{search}%"),
                    self.model.phone.ilike(f"%{search}%")
                )
            )
            
        total = query.count()
        patients = query.offset(skip).limit(limit).all()
        return patients, total


patient = CRUDPatient(Patient)
