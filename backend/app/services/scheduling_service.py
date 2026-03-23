from datetime import date, datetime
from typing import Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.availability import Availability
from app.models.provider import Provider
from app.models.provider_time_off import ProviderTimeOff
from app.models.service import Service
from app.crud.crud_appointment import appointment as crud_appointment


class SchedulingException(Exception):
    def __init__(self, message: str, conflict_type: str = "general"):
        self.message = message
        self.conflict_type = conflict_type
        super().__init__(self.message)


class SchedulingService:
    @staticmethod
    def check_conflicts(
        db: Session,
        *,
        provider_id: str,
        target_start: datetime,
        target_end: datetime,
        exclude_appointment_id: Optional[str] = None,
    ) -> None:
        """
        Validates whether a slot is completely free of conflicts for a provider.
        Raises SchedulingException if a conflict is found.
        """
        target_date = target_start.date()
        target_start_time = target_start.time()
        target_end_time = target_end.time()

        # 1. Check Daily Capacity
        provider = db.query(Provider).filter(Provider.id == provider_id).first()
        if not provider:
            raise SchedulingException("Provider not found", "general")
            
        current_count = crud_appointment.get_provider_capacity_metrics(
            db, provider_id=provider_id, target_date=target_date
        )
        if current_count >= provider.max_daily_appointments:
            raise SchedulingException("Provider daily capacity exceeded", "capacity_exceeded")

        # 2. Check Overlapping Appointments
        # We include buffer_time in `appointment_end` so this query works perfectly.
        overlap_query = db.query(Appointment).filter(
            Appointment.provider_id == provider_id,
            Appointment.status.notin_(["cancelled", "no_show"]),
            Appointment.appointment_start < target_end,
            Appointment.appointment_end > target_start,
        )
        if exclude_appointment_id:
            overlap_query = overlap_query.filter(Appointment.id != exclude_appointment_id)
            
        # Lock for update to prevent concurrent booking conflicts
        overlap = overlap_query.with_for_update().first()
        if overlap:
            raise SchedulingException("Time overlap with existing appointment", "time_overlap")

        # 3. Check Provider Time-Off
        time_off_conflict = (
            db.query(ProviderTimeOff)
            .filter(
                ProviderTimeOff.provider_id == provider_id,
                ProviderTimeOff.is_approved == True,
                ProviderTimeOff.start_date <= target_date,
                ProviderTimeOff.end_date >= target_date,
            )
            .first()
        )
        if time_off_conflict:
            # Partial day check
            if not time_off_conflict.start_time and not time_off_conflict.end_time: # full day
                raise SchedulingException("Provider is on leave for this day", "on_leave")
                
            leave_start = time_off_conflict.start_time or target_start_time
            leave_end = time_off_conflict.end_time or target_end_time
            
            if leave_start < target_end_time and leave_end > target_start_time:
                raise SchedulingException("Provider is on leave during this slot", "on_leave")

        # 4. Check Working Hours / Availability
        day_of_week = (target_date.weekday() + 1) % 7 # Python Monday=0, availability Sunday=0
        availability = (
            db.query(Availability)
            .filter(
                Availability.provider_id == provider_id,
                Availability.day_of_week == day_of_week,
                Availability.is_working_day == True,
            )
            .first()
        )
        
        if not availability:
            raise SchedulingException("Provider does not work on this day", "outside_hours")
            
        if target_start_time < availability.start_time or target_end_time > availability.end_time:
            raise SchedulingException("Time slot is outside provider working hours", "outside_hours")
            
        # Break time check
        if availability.break_start and availability.break_end:
            if target_start_time < availability.break_end and target_end_time > availability.break_start:
                raise SchedulingException("Time slot overlaps with provider break", "outside_hours")

    @staticmethod
    def get_eligible_providers(
        db: Session, *, service_id: str, target_date: date, priority: str = "standard"
    ) -> list[Provider]:
        """
        Returns a list of providers who can perform the service on the given date,
        filtered by status, time-off, and daily capacity.
        """
        service = db.query(Service).filter(Service.id == service_id).first()
        if not service:
            return []

        # Start with providers linked to the service
        query = db.query(Provider).filter(
            Provider.services.any(id=service_id),
            Provider.status == "available"
        )
        
        if priority == "emergency":
            query = query.filter(Provider.emergency_enabled == True)
            
        providers = query.all()
        eligible = []
        
        for provider in providers:
            # Skip if at daily capacity (unless emergency override explicitly requested - 
            # we'll exclude by default, emergency overbookings must be forced via manual API skip)
            current_count = crud_appointment.get_provider_capacity_metrics(
                db, provider_id=provider.id, target_date=target_date
            )
            if current_count >= provider.max_daily_appointments and priority != "emergency":
                continue # for emergency, we allow considering them if we must overhead them
            
            # Skip full day approved time_off
            time_off = (
                db.query(ProviderTimeOff)
                .filter(
                    ProviderTimeOff.provider_id == provider.id,
                    ProviderTimeOff.is_approved == True,
                    ProviderTimeOff.start_date <= target_date,
                    ProviderTimeOff.end_date >= target_date,
                    ProviderTimeOff.start_time.is_(None),
                    ProviderTimeOff.end_time.is_(None),
                )
                .first()
            )
            if time_off:
                continue
                
            # Attach an ephemeral property for round-robin sorting
            provider._today_count = current_count
            eligible.append(provider)
            
        return eligible

    @staticmethod
    def select_provider_round_robin(providers: list[Provider]) -> Optional[Provider]:
        """
        Least-loaded provider selection.
        """
        if not providers:
            return None
            
        # Sort by today's appointment count ascending
        sorted_providers = sorted(providers, key=lambda p: getattr(p, '_today_count', 0))
        return sorted_providers[0]

    @staticmethod
    def select_provider_eta(db: Session, providers: list[Provider]) -> Optional[Provider]:
        """
        For emergencies: soonest available.
        Basically, who has the smallest queue right now.
        For simplicity, we use the round_robin strategy as an effective proxy,
        but we can look at the latest appointment end time.
        """
        if not providers:
            return None
            
        def get_eta(provider):
            # The latest active appointment end time for today
            latest = (
                db.query(func.max(Appointment.appointment_end))
                .filter(
                    Appointment.provider_id == provider.id,
                    func.date(Appointment.appointment_start) == datetime.utcnow().date(),
                    Appointment.status.notin_(["cancelled", "no_show", "completed"])
                )
                .scalar()
            )
            return latest or datetime.min

        return sorted(providers, key=get_eta)[0]


scheduling_service = SchedulingService()
