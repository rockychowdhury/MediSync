from datetime import date, datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate


class CRUDAppointment(CRUDBase[Appointment, AppointmentCreate, AppointmentUpdate]):
    def get_by_appointment_number(
        self, db: Session, *, appointment_number: str
    ) -> Optional[Appointment]:
        return (
            db.query(Appointment)
            .filter(Appointment.appointment_number == appointment_number)
            .first()
        )

    def get_provider_appointments_for_date(
        self, db: Session, *, provider_id: str, target_date: date
    ) -> list[Appointment]:
        return (
            db.query(Appointment)
            .filter(
                Appointment.provider_id == provider_id,
                func.date(Appointment.appointment_start) == target_date,
                Appointment.status.notin_(["cancelled", "no_show"]),
            )
            .all()
        )

    def get_patient_appointments(
        self, db: Session, *, patient_id: str, skip: int = 0, limit: int = 100
    ) -> list[Appointment]:
        return (
            db.query(Appointment)
            .filter(Appointment.patient_id == patient_id)
            .order_by(Appointment.appointment_start.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_appointments_filtered(
        self,
        db: Session,
        *,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        provider_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[Appointment], int]:
        query = db.query(Appointment)
        if start_date:
            query = query.filter(Appointment.appointment_start >= start_date)
        if end_date:
            query = query.filter(Appointment.appointment_start <= end_date)
        if provider_id:
            query = query.filter(Appointment.provider_id == provider_id)
        if patient_id:
            query = query.filter(Appointment.patient_id == patient_id)
        if status:
            query = query.filter(Appointment.status == status)
            
        total = query.count()
        appointments = (
            query.order_by(Appointment.appointment_start.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return appointments, total

    def get_provider_queue(
        self, db: Session, *, provider_id: str, target_date: date
    ) -> list[Appointment]:
        """
        Retrieves the provider's valid queue for a specific date, ordered by priority and time.
        """
        from sqlalchemy import case

        priority_ordering = case(
            (Appointment.priority == "emergency", 0),
            (Appointment.priority == "urgent", 1),
            (Appointment.priority == "standard", 2),
            else_=3,
        )

        return (
            db.query(Appointment)
            .filter(
                Appointment.provider_id == provider_id,
                func.date(Appointment.appointment_start) == target_date,
                Appointment.status.notin_(["cancelled", "no_show"]),
            )
            .order_by(priority_ordering, Appointment.appointment_start.asc())
            .all()
        )

    def get_provider_capacity_metrics(
        self, db: Session, *, provider_id: str, target_date: date
    ) -> int:
        """
        Returns the number of active appointments for a provider on a specific date.
        """
        return (
            db.query(func.count(Appointment.id))
            .filter(
                Appointment.provider_id == provider_id,
                func.date(Appointment.appointment_start) == target_date,
                Appointment.status.notin_(["cancelled", "no_show"]),
            )
            .scalar() or 0
        )

    def generate_appointment_number(self, db: Session, target_date: date) -> str:
        date_str = target_date.strftime("%Y%m%d")
        prefix = f"APT-{date_str}-"

        last = (
            db.query(func.max(Appointment.appointment_number))
            .filter(Appointment.appointment_number.like(f"{prefix}%"))
            .scalar()
        )

        if last:
            seq = int(last.split("-")[-1]) + 1
        else:
            seq = 1

        return f"{prefix}{seq:03d}"

    def create_with_number(
        self, db: Session, *, obj_in: AppointmentCreate
    ) -> Appointment:
        """
        Create appointment generating the apt number.
        """
        target_date = obj_in.appointment_start.date()
        appointment_number = self.generate_appointment_number(db, target_date)
        
        db_obj = Appointment(
            **obj_in.model_dump(),
            appointment_number=appointment_number,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


appointment = CRUDAppointment(Appointment)
