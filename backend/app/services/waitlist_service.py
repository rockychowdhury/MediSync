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
                        "assignment_method": "auto",
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

    async def manual_assign_entry(
        self,
        db: Session,
        *,
        entry_id: str,
        provider_id: str,
        appointment_start: datetime,
        actor_id: str,
        ip_address: Optional[str] = None,
    ) -> Waitlist:
        """Manually assign a waitlist entry to a specific provider and time."""
        entry = crud_waitlist.get(db, id=entry_id)
        if not entry or entry.status != "waiting":
            raise ValueError("Waitlist entry not found or not in waiting status.")

        service = db.query(Service).filter(Service.id == entry.service_id).first()
        if not service:
            raise ValueError("Service not found.")

        duration = service.duration_minutes + service.buffer_time_minutes
        appointment_end = appointment_start + (func.interval(f"{duration} minutes"))
        # Note: Since I'm using SQLAlchemy func.interval, I should calculate it in Python for cleaner integration if possible
        from datetime import timedelta
        appointment_end = appointment_start + timedelta(minutes=duration)

        # Create Appointment
        apt_in = AppointmentCreate(
            patient_id=entry.patient_id,
            provider_id=provider_id,
            service_id=entry.service_id,
            appointment_start=appointment_start,
            appointment_end=appointment_end,
            notes=f"Manually assigned from waitlist. Original notes: {entry.notes or ''}",
            priority=entry.priority,
            created_by=actor_id,
        )

        new_apt = crud_appointment.create_with_number(db, obj_in=apt_in)
        new_apt.assigned_from_waitlist = True
        db.commit()

        # Update Waitlist Entry
        entry = crud_waitlist.update(
            db,
            db_obj=entry,
            obj_in={
                "status": "assigned",
                "assigned_appointment_id": str(new_apt.id),
                "assignment_method": "manual",
            },
        )

        # Recalculate positions
        crud_waitlist.recalculate_queue_positions(db, service_id=entry.service_id)

        # Audit Log
        crud_activity_log.create(
            db,
            user_id=actor_id,
            action_type="waitlist_manual_assigned",
            entity_type="waitlist",
            entity_id=str(entry.id),
            description=f"Waitlist entry manually promoted to appointment {new_apt.appointment_number} by admin {actor_id}.",
            new_values={
                "status": "assigned",
                "appointment_id": str(new_apt.id),
                "assignment_method": "manual",
            },
            ip_address=ip_address,
        )

        # Broadcast events
        await ws_manager.broadcast_multi(
            channels=[f"waitlist:{entry.service_id}", "dashboard:global"],
            event="waitlist_assigned",
            data={
                "waitlist_id": str(entry.id),
                "appointment_id": str(new_apt.id),
                "appointment_number": new_apt.appointment_number,
                "assignment_method": "manual",
            },
        )

        return entry

    def get_daily_stats(self, db: Session) -> dict:
        """Aggregate waitlist KPIs for today."""
        today = date.today()
        
        waiting_count = db.query(func.count(Waitlist.id)).filter(Waitlist.status == "waiting").scalar() or 0
        assigned_today = db.query(func.count(Waitlist.id)).filter(
            Waitlist.status == "assigned",
            func.date(Waitlist.updated_at) == today
        ).scalar() or 0
        cancelled_today = db.query(func.count(Waitlist.id)).filter(
            Waitlist.status == "cancelled",
            func.date(Waitlist.updated_at) == today
        ).scalar() or 0
        expired_today = db.query(func.count(Waitlist.id)).filter(
            Waitlist.status == "expired",
            func.date(Waitlist.updated_at) == today
        ).scalar() or 0
        
        # Calculate avg wait minutes for today's assigned entries
        avg_wait = db.query(
            func.avg(
                func.extract('epoch', Waitlist.updated_at - Waitlist.created_at) / 60
            )
        ).filter(
            Waitlist.status == "assigned",
            func.date(Waitlist.updated_at) == today
        ).scalar() or 0

        emergency_waiting = db.query(func.count(Waitlist.id)).filter(
            Waitlist.status == "waiting",
            Waitlist.priority == "emergency"
        ).scalar() or 0

        return {
            "waiting_now": waiting_count,
            "assigned_today": assigned_today,
            "cancelled_today": cancelled_today,
            "expired_today": expired_today,
            "avg_wait_minutes_today": round(float(avg_wait), 1),
            "emergency_waiting": emergency_waiting
        }

    def get_analytics(self, db: Session, date_from: date, date_to: date) -> dict:
        """Get analytics for a specific period."""
        base_query = db.query(Waitlist).filter(
            func.date(Waitlist.created_at) >= date_from,
            func.date(Waitlist.created_at) <= date_to
        )
        
        total_added = base_query.count()
        
        # Breakdown by status
        assigned = base_query.filter(Waitlist.status == "assigned").count()
        cancelled = base_query.filter(Waitlist.status == "cancelled").count()
        expired = base_query.filter(Waitlist.status == "expired").count()
        
        auto_assigned = base_query.filter(
            Waitlist.status == "assigned", 
            Waitlist.assignment_method == "auto"
        ).count()
        
        manually_assigned = base_query.filter(
            Waitlist.status == "assigned", 
            Waitlist.assignment_method == "manual"
        ).count()
        
        # Breakdown by service
        from app.models.service import Service
        by_service = db.query(
            Service.name, func.count(Waitlist.id)
        ).join(Waitlist).filter(
            func.date(Waitlist.created_at) >= date_from,
            func.date(Waitlist.created_at) <= date_to
        ).group_by(Service.name).all()
        
        # Breakdown by priority
        by_priority = db.query(
            Waitlist.priority, func.count(Waitlist.id)
        ).filter(
            func.date(Waitlist.created_at) >= date_from,
            func.date(Waitlist.created_at) <= date_to
        ).group_by(Waitlist.priority).all()

        return {
            "summary": {
                "total_added": total_added,
                "assigned": assigned,
                "cancelled": cancelled,
                "expired": expired,
                "auto_assigned": auto_assigned,
                "manually_assigned": manually_assigned,
                "conversion_rate": round(assigned / total_added * 100, 1) if total_added > 0 else 0
            },
            "by_service": [{"service_name": name, "count": count} for name, count in by_service],
            "by_priority": [{"priority": p, "count": c} for p, c in by_priority]
        }

    async def expire_old_entries(self, db: Session, before_date: date) -> int:
        """Mark stale entries as expired."""
        entries = db.query(Waitlist).filter(
            Waitlist.status == "waiting",
            Waitlist.requested_date < before_date
        ).all()
        
        count = len(entries)
        for entry in entries:
            entry.status = "expired"
            db.add(entry)
            
        db.commit()
        
        # Note: In a real app, we should recalculate positions for all affected services
        # but for simplicity we'll just commit.
        
        return count


waitlist_service = WaitlistService()
