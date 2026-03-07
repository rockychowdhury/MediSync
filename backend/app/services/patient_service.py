from typing import Any
from sqlalchemy.orm import Session
from app import crud
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate
from app.services.user_service import UserService  # Use shared logging logic


class PatientService:
    @staticmethod
    def log_patient_activity(
        db: Session,
        actor_id: str,
        action: str,
        patient_id: str | None = None,
        description: str | None = None,
        old_val: dict | None = None,
        new_val: dict | None = None
    ):
        """Helper to log patient-related activities using the shared log_activity logic."""
        UserService.log_activity(
            db,
            user_id=actor_id,
            action=action,
            entity_id=patient_id,
            description=description,
            old_val=old_val,
            new_val=new_val,
            entity_type="patient"
        )

    @staticmethod
    def create_patient(db: Session, *, obj_in: PatientCreate, actor_id: str) -> Patient:
        # Deep Duplicate Check: Name + DOB + Email
        existing = crud.patient.get_by_identity(
            db, 
            name=obj_in.name, 
            date_of_birth=obj_in.date_of_birth, 
            email=obj_in.email
        )
        if existing:
            raise ValueError("A patient with this name, date of birth, and email already exists.")

        patient = crud.patient.create(db, obj_in=obj_in)
        PatientService.log_patient_activity(
            db,
            actor_id=actor_id,
            action="CREATE_PATIENT",
            patient_id=str(patient.id),
            description=f"Registered patient {patient.name}",
            new_val=obj_in.model_dump(mode="json")
        )
        return patient

    @staticmethod
    def update_patient(
        db: Session, 
        *, 
        db_obj: Patient, 
        obj_in: PatientUpdate | dict[str, Any], 
        actor_id: str
    ) -> Patient:
        old_data = {
            "name": db_obj.name, 
            "email": db_obj.email, 
            "phone": db_obj.phone,
            "date_of_birth": db_obj.date_of_birth.isoformat() if db_obj.date_of_birth else None,
            "gender": db_obj.gender,
            "is_active": db_obj.is_active
        }
        patient = crud.patient.update(db, db_obj=db_obj, obj_in=obj_in)
        
        if isinstance(obj_in, dict):
            new_data = obj_in
        else:
            new_data = obj_in.model_dump(mode="json", exclude_unset=True)

        PatientService.log_patient_activity(
            db,
            actor_id=actor_id,
            action="UPDATE_PATIENT",
            patient_id=str(patient.id),
            description=f"Updated details for patient {patient.name}",
            old_val=old_data,
            new_val=new_data
        )
        return patient

    @staticmethod
    def soft_delete_patient(db: Session, *, db_obj: Patient, actor_id: str) -> Patient:
        patient = crud.patient.update(db, db_obj=db_obj, obj_in={"is_active": False})
        PatientService.log_patient_activity(
            db,
            actor_id=actor_id,
            action="DEACTIVATE_PATIENT",
            patient_id=str(patient.id),
            description=f"Soft deleted patient {patient.name}"
        )
        return patient

    @staticmethod
    def activate_patient(db: Session, *, db_obj: Patient, actor_id: str) -> Patient:
        patient = crud.patient.update(db, db_obj=db_obj, obj_in={"is_active": True})
        PatientService.log_patient_activity(
            db,
            actor_id=actor_id,
            action="ACTIVATE_PATIENT",
            patient_id=str(patient.id),
            description=f"Restored patient {patient.name}"
        )
        return patient
