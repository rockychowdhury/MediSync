from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session
from fastapi import HTTPException

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
        """
        # 1. Validation & Conflict Detection
        try:
            scheduling_service.check_conflicts(
                db,
                provider_id=obj_in.provider_id,
                target_start=obj_in.appointment_start,
                target_end=obj_in.appointment_end,
            )
        except SchedulingException as e:
            raise HTTPException(status_code=400, detail=f"Conflict: {e.message}")

        # Emergency Priority handles status bypass logic
        status_override = "checked_in" if obj_in.priority == "emergency" else "scheduled"

        # 2. Database Insert wrapped in transaction
        new_apt = crud_appointment.create_with_number(db, obj_in=obj_in)
        if obj_in.priority == "emergency":
            new_apt.status = status_override
            new_apt.checked_in_at = utcnow()
            db.commit()

        # 3. Audit Log
        crud_activity_log.create(
            db,
            user_id=actor_id,
            action_type="appointment_created",
            entity_type="appointment",
            entity_id=str(new_apt.id),
            description=f"Appointment {new_apt.appointment_number} created for patient {obj_in.patient_id} with provider {obj_in.provider_id}. Priority: {obj_in.priority}.",
            new_values={
                "appointment_number": new_apt.appointment_number,
                "status": new_apt.status,
                "provider_id": obj_in.provider_id,
                "patient_id": obj_in.patient_id,
                "start": str(obj_in.appointment_start),
                "end": str(obj_in.appointment_end),
            },
            ip_address=ip_address,
        )

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

        db.commit()
        db.refresh(db_apt)

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
        if new_status in ["cancelled", "no_show", "completed"]:
            await waitlist_service.process_slot_freed_event(
                db,
                provider_id=db_apt.provider_id,
                service_id=db_apt.service_id,
                freed_start=db_apt.appointment_start,
                freed_end=db_apt.appointment_end,
            )

        return db_apt

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
        db_apt.cancellation_reason = "Rescheduled"

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


appointment_service = AppointmentService()
