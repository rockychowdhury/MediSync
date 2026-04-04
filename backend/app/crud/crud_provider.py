from typing import Any
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.provider import Provider
from app.schemas.provider import ProviderCreate, ProviderUpdate
from app.models.user import User
from app.models.specialization import Specialization
from app.models.appointment import Appointment
from sqlalchemy import func
from datetime import date
from sqlalchemy.orm import selectinload


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
        query = db.query(self.model).join(User).options(
            selectinload(self.model.user),
            selectinload(self.model.specialization)
        )
        
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

    def get_stats(self, db: Session, *, provider_id: str, date_from: date, date_to: date) -> dict[str, Any]:
        """Calculate performance stats for a provider over a date range."""
        from datetime import datetime, time
        
        start_dt = datetime.combine(date_from, time.min)
        end_dt = datetime.combine(date_to, time.max)
        
        # Aggregate status counts
        stats_query = (
            db.query(Appointment.status, func.count(Appointment.id))
            .filter(
                Appointment.provider_id == provider_id,
                Appointment.appointment_start >= start_dt,
                Appointment.appointment_start <= end_dt
            )
            .group_by(Appointment.status)
            .all()
        )
        
        status_counts = {s: count for s, count in stats_query}
        
        total = sum(status_counts.values())
        completed = status_counts.get("completed", 0)
        cancelled = status_counts.get("cancelled", 0)
        no_show = status_counts.get("no_show", 0)
        scheduled = status_counts.get("scheduled", 0)
        
        # Calculate daily volumes
        daily_volumes = (
            db.query(func.date(Appointment.appointment_start), func.count(Appointment.id))
            .filter(
                Appointment.provider_id == provider_id,
                Appointment.appointment_start >= start_dt,
                Appointment.appointment_start <= end_dt
            )
            .group_by(func.date(Appointment.appointment_start))
            .order_by(func.date(Appointment.appointment_start))
            .all()
        )
        
        # Calculate average duration for completed appointments
        avg_duration = db.query(
            func.avg(
                func.extract('epoch', Appointment.appointment_end) - 
                func.extract('epoch', Appointment.appointment_start)
            ) / 60
        ).filter(
            Appointment.provider_id == provider_id,
            Appointment.status == "completed",
            Appointment.appointment_start >= start_dt,
            Appointment.appointment_start <= end_dt
        ).scalar() or 0

        # Unique working days (days with at least one appointment)
        working_days = len(daily_volumes)

        return {
            "period": {"date_from": date_from, "date_to": date_to},
            "totals": {
                "scheduled": total,
                "completed": completed,
                "cancelled": cancelled,
                "no_show": no_show,
            },
            "rates": {
                "no_show_percent": round((no_show / total * 100), 1) if total > 0 else 0,
                "cancellation_percent": round((cancelled / total * 100), 1) if total > 0 else 0,
                # Utilisation calculation would require availability data; for simplicity here:
                "utilisation_percent": 0 
            },
            "averages": {
                "appointment_duration_minutes": int(avg_duration)
            },
            "working_days": working_days,
            "daily_volumes": [{"date": d.isoformat(), "count": c} for d, c in daily_volumes]
        }

    def get_by_user_id(self, db: Session, user_id: str) -> Provider | None:
        """Fetch a provider profile by associated User ID."""
        return db.query(self.model).filter(self.model.id == user_id).first()


provider = CRUDProvider(Provider)
