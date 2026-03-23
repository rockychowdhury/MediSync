from datetime import date, datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.crud.crud_waitlist import waitlist as crud_waitlist
from app.crud.crud_appointment import appointment as crud_appointment
from app.crud.crud_activity_log import activity_log as crud_activity_log
from app.schemas.waitlist import WaitlistCreate
from app.schemas.appointment import AppointmentCreate
from app.services.websocket_manager import ws_manager
from app.models.waitlist import Waitlist
from app.models.service import Service
from app.models.provider import Provider


class WaitlistService:
    async def add_to_waitlist(
        self,
        db: Session,
        *,
        patient_id: str,
        service_id: str,
        priority: str = "standard",
        provider_id: Optional[str] = None,
        requested_date: Optional[date] = None,
        notes: Optional[str] = None,
        actor_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Waitlist:

        obj_in = WaitlistCreate(
            patient_id=patient_id,
            service_id=service_id,
            provider_id=provider_id,
            priority=priority,
            requested_date=requested_date,
            notes=notes,
        )

        entry = crud_waitlist.create(db, obj_in=obj_in)

        # Audit Log
        crud_activity_log.create(
            db,
            user_id=actor_id,
            action_type="waitlist_entry_added",
            entity_type="waitlist",
            entity_id=str(entry.id),
            description=f"Patient {patient_id} added to waitlist for service {service_id}. Priority: {priority}. Position: {entry.queue_position}.",
            new_values={
                "patient_id": patient_id,
                "service_id": service_id,
                "priority": priority,
                "queue_position": entry.queue_position,
            },
            ip_address=ip_address,
        )

        # Broadcast the new waitlist entry
        await ws_manager.broadcast_multi(
            channels=[f"waitlist:{service_id}", "dashboard:global"],
            event="waitlist_entry_added",
            data={
                "id": str(entry.id),
                "service_id": service_id,
                "queue_position": entry.queue_position,
                "priority": priority,
            },
        )
        return entry

    async def cancel_waitlist_entry(
        self,
        db: Session,
        *,
        entry_id: str,
        actor_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ):
        entry = crud_waitlist.get(db, id=entry_id)
        if not entry or entry.status != "waiting":
            return

        old_position = entry.queue_position
        crud_waitlist.update(db, db_obj=entry, obj_in={"status": "cancelled"})
        crud_waitlist.recalculate_queue_positions(db, service_id=entry.service_id)

        # Audit Log
        crud_activity_log.create(
            db,
            user_id=actor_id,
            action_type="waitlist_entry_cancelled",
            entity_type="waitlist",
            entity_id=str(entry.id),
            description=f"Waitlist entry for patient {entry.patient_id} cancelled. Was at position {old_position}.",
            old_values={"status": "waiting", "queue_position": old_position},
            new_values={"status": "cancelled"},
            ip_address=ip_address,
        )

        await ws_manager.broadcast(
            channel=f"waitlist:{entry.service_id}",
            event="queue_positions_updated",
            data={"service_id": entry.service_id},
        )

    async def process_slot_freed_event(
        self,
        db: Session,
        *,
        provider_id: str,
        service_id: str,
        freed_start: datetime,
        freed_end: datetime,
    ) -> Optional[str]:
        """
        Auto-promotes the best waitlist entry to an appointment if the provider can take them.
        Returns the new appointment ID if successful, otherwise None.
        """
        target_date = freed_start.date()

        from app.services.scheduling_service import (
            scheduling_service,
            SchedulingException,
        )

        provider = db.query(Provider).filter(Provider.id == provider_id).first()
        if not provider:
            return None

        entries = crud_waitlist.get_ordered_waitlist_for_service(
            db, service_id=service_id, provider_id=provider_id
        )

        if not entries:
            return None

        for entry in entries:
            # Check target date preference
            if entry.requested_date and entry.requested_date != target_date:
                continue

            # Attempt to validate conflict
            try:
                scheduling_service.check_conflicts(
                    db,
                    provider_id=provider_id,
                    target_start=freed_start,
                    target_end=freed_end,
                )

                # If we get here, the slot is valid for this entry. Promote it!
                apt_in = AppointmentCreate(
                    patient_id=entry.patient_id,
                    provider_id=provider_id,
                    service_id=service_id,
                    appointment_start=freed_start,
                    appointment_end=freed_end,
                    notes=f"Auto-assigned from waitlist. Original notes: {entry.notes or ''}",
                    priority=entry.priority,
                    created_by="system",
                )

                new_apt = crud_appointment.create_with_number(db, obj_in=apt_in)
                new_apt.assigned_from_waitlist = True
                db.commit()

                # Update Waitlist Entry
                crud_waitlist.update(
                    db,
                    db_obj=entry,
                    obj_in={
                        "status": "assigned",
                        "assigned_appointment_id": str(new_apt.id),
                    },
                )

                # Recalculate positions
                crud_waitlist.recalculate_queue_positions(db, service_id=service_id)

                # Audit Log for auto-promotion
                crud_activity_log.create(
                    db,
                    user_id=None,  # System action
                    action_type="waitlist_auto_promoted",
                    entity_type="waitlist",
                    entity_id=str(entry.id),
                    description=f"Waitlist entry auto-promoted to appointment {new_apt.appointment_number} for patient {entry.patient_id}.",
                    old_values={"status": "waiting"},
                    new_values={
                        "status": "assigned",
                        "appointment_id": str(new_apt.id),
                        "appointment_number": new_apt.appointment_number,
                    },
                )

                # Broadcast events
                await ws_manager.broadcast_multi(
                    channels=[f"waitlist:{service_id}", "dashboard:global"],
                    event="waitlist_assigned",
                    data={
                        "waitlist_id": str(entry.id),
                        "appointment_id": str(new_apt.id),
                        "appointment_number": new_apt.appointment_number,
                    },
                )

                await ws_manager.broadcast_multi(
                    channels=[
                        f"provider:{provider_id}",
                        f"queue:{provider_id}",
                        "dashboard:global",
                    ],
                    event="appointment_created",
                    data={
                        "id": str(new_apt.id),
                        "appointment_number": new_apt.appointment_number,
                    },
                )

                return str(new_apt.id)

            except SchedulingException:
                continue

        return None

    def estimate_wait_time(
        self, db: Session, queue_position: int, service_id: str
    ) -> Optional[int]:
        service = db.query(Service).filter(Service.id == service_id).first()
        if not service:
            return None

        avg_duration = service.duration_minutes + service.buffer_time_minutes

        # Count available providers for this service
        active_provider_count = (
            db.query(func.count(Provider.id))
            .filter(Provider.services.any(id=service_id), Provider.status == "available")
            .scalar()
            or 0
        )

        if active_provider_count == 0:
            return None

        return int((queue_position / active_provider_count) * avg_duration)


waitlist_service = WaitlistService()
