from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool

from app.crud.crud_appointment import appointment as crud_appointment
from app.crud.crud_activity_log import activity_log as crud_activity_log
from app.schemas.appointment import AppointmentCreate
from app.services.scheduling_service import scheduling_service, SchedulingException
from app.services.waitlist_service import waitlist_service
from app.services.websocket_manager import ws_manager
from app.models.appointment import Appointment


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AppointmentService:
    async def create_appointment(
        self,
        db: Session,
        *,
        obj_in: AppointmentCreate,
        actor_id: str,
        ip_address: Optional[str] = None,
    ) -> Appointment:
        """
        Orchestrates appointment booking with scheduling validation and conflict detection.
        Includes emergency capacity override logic for admins.
        """
        # 1. Validation & Conflict Detection
        try:
            await run_in_threadpool(
                scheduling_service.check_conflicts,
                db,
                provider_id=obj_in.provider_id,
                target_start=obj_in.appointment_start,
                target_end=obj_in.appointment_end,
                skip_capacity_check=obj_in.override_capacity,
            )
        except SchedulingException as e:
            raise HTTPException(status_code=400, detail=f"Conflict: {e.message}")

        # 2. Database Insert wrapped in transaction
        new_apt = await run_in_threadpool(crud_appointment.create_with_number, db, obj_in=obj_in)
        
        # Emergency Priority handles status bypass logic
        # If it's an emergency, we immediately check them in
        if obj_in.priority == "emergency":
            new_apt.status = "checked_in"
            new_apt.checked_in_at = utcnow()
            await run_in_threadpool(db.commit)

        # 3. Audit Log
        desc = f"Appointment {new_apt.appointment_number} created for patient {obj_in.patient_id}."
        if obj_in.override_capacity:
            desc += f" [EMERGENCY CAPACITY OVERRIDE - Reason: {obj_in.override_reason}]"
            
        crud_activity_log.create(
            db,
            user_id=actor_id,
            action_type="appointment_created",
            entity_type="appointment",
            entity_id=str(new_apt.id),
            description=desc,
            new_values={
                "appointment_number": new_apt.appointment_number,
                "status": new_apt.status,
                "provider_id": obj_in.provider_id,
                "patient_id": obj_in.patient_id,
                "start": str(obj_in.appointment_start),
                "end": str(obj_in.appointment_end),
                "override_capacity": obj_in.override_capacity,
            },
            ip_address=ip_address,
        )
        await run_in_threadpool(db.commit) # Ensure committed

        # 4. Broadcasting
        await ws_manager.broadcast_multi(
            channels=[
                f"provider:{new_apt.provider_id}",
                f"queue:{new_apt.provider_id}",
                "dashboard:global",
            ],
            event="appointment_created",
            data={
                "id": str(new_apt.id),
                "appointment_number": new_apt.appointment_number,
                "status": new_apt.status,
                "priority": new_apt.priority,
            },
        )
        return new_apt

    async def update_status(
        self,
        db: Session,
        *,
        appointment_id: str,
        new_status: str,
        reason: str | None = None,
        actor_id: str,
        ip_address: Optional[str] = None,
    ) -> Appointment:
        """
        Enforces state machine logic for status transitions.
        """
        db_apt = crud_appointment.get(db, id=appointment_id)
        if not db_apt:
            raise HTTPException(status_code=404, detail="Appointment not found")

        old_status = db_apt.status
        valid_transitions = {
            "scheduled": ["checked_in", "cancelled", "no_show"],
            "checked_in": ["in_progress", "cancelled", "no_show"],
            "in_progress": ["completed", "cancelled"],
            # Admins can force-reset historical statuses if needed? 
            # For now keep it strict but maybe allow admin correction
            "completed": ["cancelled"],
            "cancelled": ["scheduled"], # allow recovery
            "no_show": ["scheduled", "checked_in"]
        }

        if new_status not in valid_transitions.get(old_status, []):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid transition from {old_status} to {new_status}",
            )

        if new_status == "cancelled" and not reason:
            raise HTTPException(
                status_code=400, detail="Cancellation reason is required"
            )

        # Update and Commit status
        db_apt.status = new_status
        if new_status == "checked_in":
            db_apt.checked_in_at = utcnow()
        elif new_status == "completed":
            db_apt.completed_at = utcnow()
        elif new_status == "cancelled":
            db_apt.cancellation_reason = reason

        await run_in_threadpool(db.commit)
        await run_in_threadpool(db.refresh, db_apt)

        # Audit Log
        crud_activity_log.create(
            db,
            user_id=actor_id,
            action_type="appointment_status_changed",
            entity_type="appointment",
            entity_id=str(db_apt.id),
            description=f"Appointment {db_apt.appointment_number} status changed from {old_status} to {new_status}.",
            old_values={"status": old_status},
            new_values={"status": new_status, "reason": reason},
            ip_address=ip_address,
        )

        # Broadcasting event
        await ws_manager.broadcast_multi(
            channels=[f"provider:{db_apt.provider_id}", "dashboard:global"],
            event="appointment_status_changed",
            data={
                "id": str(db_apt.id),
                "appointment_number": db_apt.appointment_number,
                "old_status": old_status,
                "new_status": new_status,
            },
        )

        # Slot freed recovery events
        if new_status in ["cancelled", "no_show"]:
            await waitlist_service.process_slot_freed_event(
                db,
                provider_id=db_apt.provider_id,
                service_id=db_apt.service_id,
                freed_start=db_apt.appointment_start,
                freed_end=db_apt.appointment_end,
            )

        return db_apt

    async def bulk_update_status(
        self,
        db: Session,
        *,
        appointment_ids: list[str],
        status: str,
        reason: str | None = None,
        actor_id: str,
        ip_address: Optional[str] = None,
    ) -> dict:
        """Processes multiple status changes as a batch."""
        count = 0
        failed = []
        for apt_id in appointment_ids:
            try:
                await self.update_status(
                    db,
                    appointment_id=apt_id,
                    new_status=status,
                    reason=reason,
                    actor_id=actor_id,
                    ip_address=ip_address,
                )
                count += 1
            except Exception as e:
                failed.append({"id": apt_id, "error": str(e)})
        
        return {"success_count": count, "failed": failed}

    async def reschedule(
        self,
        db: Session,
        *,
        appointment_id: str,
        new_start: datetime,
        new_end: datetime,
        new_provider_id: str,
        actor_id: str,
        ip_address: Optional[str] = None,
    ) -> Appointment:
        """
        Reschedules an appointment atomically (cancel + rebook).
        """
        db_apt = crud_appointment.get(db, id=appointment_id)
        if not db_apt:
            raise HTTPException(status_code=404, detail="Appointment not found")

        # 1. Validation for new slot
        try:
            scheduling_service.check_conflicts(
                db,
                provider_id=new_provider_id,
                target_start=new_start,
                target_end=new_end,
                exclude_appointment_id=appointment_id,
            )
        except SchedulingException as e:
            raise HTTPException(
                status_code=400, detail=f"Conflict Rescheduling: {e.message}"
            )

        # Cancel current
        old_status = db_apt.status
        old_start = str(db_apt.appointment_start)
        old_end = str(db_apt.appointment_end)
        old_provider = db_apt.provider_id

        db_apt.status = "cancelled"
        db_apt.cancellation_reason = f"Rescheduled to {new_start.isoformat()} with provider {new_provider_id}"

        # Free slot processing
        await waitlist_service.process_slot_freed_event(
            db,
            provider_id=db_apt.provider_id,
            service_id=db_apt.service_id,
            freed_start=db_apt.appointment_start,
            freed_end=db_apt.appointment_end,
        )

        apt_in = AppointmentCreate(
            patient_id=db_apt.patient_id,
            provider_id=new_provider_id,
            service_id=db_apt.service_id,
            appointment_start=new_start,
            appointment_end=new_end,
            notes=db_apt.notes,
            priority=db_apt.priority,
            created_by=actor_id,
        )

        new_apt = crud_appointment.create_with_number(db, obj_in=apt_in)

        # Audit Log
        crud_activity_log.create(
            db,
            user_id=actor_id,
            action_type="appointment_rescheduled",
            entity_type="appointment",
            entity_id=str(db_apt.id),
            description=f"Appointment {db_apt.appointment_number} rescheduled. New appointment: {new_apt.appointment_number}.",
            old_values={
                "provider_id": old_provider,
                "start": old_start,
                "end": old_end,
                "status": old_status,
            },
            new_values={
                "new_appointment_id": str(new_apt.id),
                "new_appointment_number": new_apt.appointment_number,
                "provider_id": new_provider_id,
                "start": str(new_start),
                "end": str(new_end),
            },
            ip_address=ip_address,
        )

        # Broadcast
        await ws_manager.broadcast_multi(
            channels=[f"provider:{db_apt.provider_id}", "dashboard:global"],
            event="appointment_status_changed",
            data={
                "id": str(db_apt.id),
                "appointment_number": db_apt.appointment_number,
                "old_status": old_status,
                "new_status": "cancelled",
            },
        )
        await ws_manager.broadcast_multi(
            channels=[f"provider:{new_apt.provider_id}", "dashboard:global"],
            event="appointment_created",
            data={
                "id": str(new_apt.id),
                "appointment_number": new_apt.appointment_number,
                "status": new_apt.status,
            },
        )

        return new_apt

    def get_available_slots(
        self,
        db: Session,
        *,
        provider_id: str,
        target_date: datetime.date,
        service_id: str,
    ) -> list[dict]:
        """Calculates free time slots based on availability and existing bookings."""
        from app.models.availability import Availability
        from app.models.service import Service
        from datetime import datetime, timedelta

        service = db.query(Service).filter(Service.id == service_id).first()
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")
        
        duration = service.duration_minutes
        buffer = service.buffer_time_minutes or 0
        total_slot_time = duration + buffer

        day_of_week = (target_date.weekday() + 1) % 7
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
            return []

        existing = (
            db.query(Appointment)
            .filter(
                Appointment.provider_id == provider_id,
                func.date(Appointment.appointment_start) == target_date,
                Appointment.status.notin_(["cancelled", "no_show"]),
            )
            .all()
        )

        slots = []
        current_time = datetime.combine(target_date, availability.start_time)
        end_limit = datetime.combine(target_date, availability.end_time)

        while current_time + timedelta(minutes=duration) <= end_limit:
            slot_start = current_time
            slot_end = current_time + timedelta(minutes=duration)
            
            is_available = True
            reason = None

            for appt in existing:
                if slot_start < appt.appointment_end and slot_end > appt.appointment_start:
                    is_available = False
                    reason = "Already booked"
                    break
            
            if is_available and availability.break_start and availability.break_end:
                break_start = datetime.combine(target_date, availability.break_start)
                break_end = datetime.combine(target_date, availability.break_end)
                if slot_start < break_end and slot_end > break_start:
                    is_available = False
                    reason = "Break time"

            slots.append({
                "start": slot_start.isoformat(),
                "end": slot_end.isoformat(),
                "available": is_available,
                "reason": reason
            })
            
            current_time += timedelta(minutes=total_slot_time)

        return slots


appointment_service = AppointmentService()


appointment_service = AppointmentService()
