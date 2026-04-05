from datetime import date, datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from app.services.websocket_manager import ws_manager


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
        status: Optional[str | list[str]] = None,
        priority: Optional[str | list[str]] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[Appointment], int]:
        from app.models.patient import Patient
        
        query = db.query(Appointment).join(Patient, Appointment.patient_id == Patient.id)
        
        if start_date:
            query = query.filter(Appointment.appointment_start >= start_date)
        if end_date:
            query = query.filter(Appointment.appointment_start <= end_date)
        if provider_id:
            query = query.filter(Appointment.provider_id == provider_id)
        if patient_id:
            query = query.filter(Appointment.patient_id == patient_id)
            
        if status:
            if isinstance(status, list):
                query = query.filter(Appointment.status.in_(status))
            else:
                query = query.filter(Appointment.status == status)
                
        if priority:
            if isinstance(priority, list):
                query = query.filter(Appointment.priority.in_(priority))
            else:
                query = query.filter(Appointment.priority == priority)
                
        if search:
            search_filter = func.replace(Patient.name, ' ', '').ilike(f"%{search.replace(' ', '')}%") | \
                           Patient.phone.ilike(f"%{search}%") | \
                           Appointment.appointment_number.ilike(f"%{search}%")
            query = query.filter(search_filter)
            
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

    def _broadcast_change(self, event: str, data: dict):
        ws_manager.broadcast_sync(channel="dashboard:global", event=event, data=data)

    def create(self, db: Session, *, obj_in: AppointmentCreate | dict) -> Appointment:
        db_obj = super().create(db, obj_in=obj_in)
        self._broadcast_change("appointment_created", {"id": str(db_obj.id)})
        return db_obj

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
        self._broadcast_change("appointment_created", {"id": str(db_obj.id)})
        return db_obj

    def update(
        self, db: Session, *, db_obj: Appointment, obj_in: AppointmentUpdate | dict
    ) -> Appointment:
        db_obj = super().update(db, db_obj=db_obj, obj_in=obj_in)
        self._broadcast_change("appointment_updated", {"id": str(db_obj.id), "status": db_obj.status})
        return db_obj

    def delete(self, db: Session, *, id: str) -> Appointment | None:
        db_obj = super().delete(db, id=id)
        if db_obj:
            self._broadcast_change("appointment_deleted", {"id": id})
        return db_obj

    def get_today_stats(self, db: Session, target_date: date) -> dict:
        """
        Calculates counts of appointments for a single day, grouped by status.
        """
        # Default all statuses to 0
        all_statuses = ["scheduled", "checked_in", "in_progress", "completed", "cancelled", "no_show"]
        counts = {s: 0 for s in all_statuses}
        
        results = (
            db.query(Appointment.status, func.count(Appointment.id))
            .filter(func.date(Appointment.appointment_start) == target_date)
            .group_by(Appointment.status)
            .all()
        )
        
        for status, count in results:
            counts[status] = count
            
        total = sum(counts.values())
        
        active_providers_count = (
            db.query(func.count(func.distinct(Appointment.provider_id)))
            .filter(
                func.date(Appointment.appointment_start) == target_date,
                Appointment.status.notin_(["cancelled", "no_show"])
            )
            .scalar() or 0
        )
        
        no_shows = counts.get("no_show", 0)
        no_show_rate = round((no_shows / total * 100), 2) if total > 0 else 0
        
        return {
            "date": target_date.isoformat(),
            "counts": counts,
            "total": total,
            "no_show_rate_percent": no_show_rate,
            "active_providers": active_providers_count,
        }

    def get_hourly_stats(self, db: Session, target_date: date) -> list[dict]:
        """
        Calculates hourly status counts for a specific date.
        """
        results = (
            db.query(
                func.extract('hour', Appointment.appointment_start).label('hour'),
                Appointment.status,
                func.count(Appointment.id)
            )
            .filter(func.date(Appointment.appointment_start) == target_date)
            .group_by('hour', Appointment.status)
            .all()
        )
        
        hourly_data = {h: {"hour": h, "scheduled": 0, "completed": 0, "in_progress": 0, "cancelled": 0, "no_show": 0, "checked_in": 0} for h in range(8, 19)}
        
        for hour, status, count in results:
            h_int = int(hour)
            if h_int in hourly_data:
                hourly_data[h_int][status] = count
                
        return sorted(list(hourly_data.values()), key=lambda x: x["hour"])

    def get_stats_by_range(self, db: Session, start_date: date, end_date: date) -> list[dict]:
        """
        Calculates daily stats for a range of dates.
        """
        results = (
            db.query(
                func.date(Appointment.appointment_start).label("date"),
                Appointment.status,
                func.count(Appointment.id)
            )
            .filter(
                func.date(Appointment.appointment_start) >= start_date,
                func.date(Appointment.appointment_start) <= end_date
            )
            .group_by(func.date(Appointment.appointment_start), Appointment.status)
            .all()
        )
        
        days_data = {}
        for d, s, c in results:
            d_str = d.isoformat()
            if d_str not in days_data:
                days_data[d_str] = {
                    "date": d_str, 
                    "total": 0,
                    "completed": 0, "cancelled": 0, "no_show": 0, "scheduled": 0, "checked_in": 0, "in_progress": 0
                }
            
            days_data[d_str][s] = c
            days_data[d_str]["total"] += c
            
        return sorted(list(days_data.values()), key=lambda x: x["date"])

    def get_weekly_capacity_stats(self, db: Session, start_date: date, end_date: date) -> list[dict]:
        """
        Calculates daily capacity utilization per provider for a given range.
        Used for the Week View.
        """
        from app.models.provider import Provider
        from app.models.user import User

        # 1. Get booked counts per provider per day
        results = (
            db.query(
                func.date(Appointment.appointment_start).label("date"),
                Appointment.provider_id,
                func.count(Appointment.id).label("booked_count")
            )
            .filter(
                func.date(Appointment.appointment_start) >= start_date,
                func.date(Appointment.appointment_start) <= end_date,
                Appointment.status.notin_(["cancelled", "no_show"])
            )
            .group_by(func.date(Appointment.appointment_start), Appointment.provider_id)
            .all()
        )
        
        # 2. Get all active providers to ensure we show them even if 0 appts
        all_providers = db.query(Provider).join(User).filter(User.is_active == True).all()
        
        # 3. Process into structure
        data_by_date = {}
        # Pre-fill all dates in range
        from datetime import timedelta
        curr = start_date
        while curr <= end_date:
            d_str = curr.isoformat()
            data_by_date[d_str] = {
                "date": d_str,
                "providers": [
                    {
                        "provider_id": p.id,
                        "provider_name": p.user.name,
                        "booked": 0,
                        "max": p.max_daily_appointments or 0
                    } for p in all_providers
                ],
                "total_booked": 0,
                "total_capacity": sum(p.max_daily_appointments or 0 for p in all_providers)
            }
            curr += timedelta(days=1)

        # Apply actual counts
        for d, pid, count in results:
            d_str = d.isoformat()
            if d_str in data_by_date:
                day = data_by_date[d_str]
                for p_entry in day["providers"]:
                    if p_entry["provider_id"] == pid:
                        p_entry["booked"] = count
                day["total_booked"] += count
            
        return sorted(list(data_by_date.values()), key=lambda x: x["date"])


appointment = CRUDAppointment(Appointment)
