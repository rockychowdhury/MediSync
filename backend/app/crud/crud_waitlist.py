from datetime import date
from typing import Optional

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.waitlist import Waitlist
from app.schemas.waitlist import WaitlistCreate, WaitlistUpdate


class CRUDWaitlist(CRUDBase[Waitlist, WaitlistCreate, WaitlistUpdate]):
    def get_highest_queue_position(
        self, db: Session, *, service_id: str, priority: str
    ) -> int:
        """Get the highest queue position for a service and priority."""
        max_pos = (
            db.query(func.max(Waitlist.queue_position))
            .filter(
                Waitlist.service_id == service_id,
                Waitlist.priority == priority,
                Waitlist.status == "waiting",
            )
            .scalar()
        )
        return max_pos or 0

    def create(self, db: Session, *, obj_in: WaitlistCreate) -> Waitlist:
        """Create waitlist entry ensuring proper queue position."""
        position = self.get_highest_queue_position(
            db, service_id=obj_in.service_id, priority=obj_in.priority
        )
        db_obj = Waitlist(
            **obj_in.model_dump(),
            queue_position=position + 1,
            status="waiting",
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_ordered_waitlist_for_service(
        self, db: Session, *, service_id: str, provider_id: Optional[str] = None
    ) -> list[Waitlist]:
        """
        Get the waiting entries ordered by priority, position, and creation time.
        Optionally filter by provider_id matching or NULL (no preference).
        """
        priority_ordering = case(
            (Waitlist.priority == "emergency", 0),
            (Waitlist.priority == "urgent", 1),
            (Waitlist.priority == "standard", 2),
            else_=3,
        )

        query = db.query(Waitlist).filter(
            Waitlist.service_id == service_id,
            Waitlist.status == "waiting",
        )

        if provider_id:
            query = query.filter(
                (Waitlist.provider_id == provider_id) | (Waitlist.provider_id == None)
            )

        return query.order_by(
            priority_ordering, Waitlist.queue_position.asc(), Waitlist.created_at.asc()
        ).all()

    def recalculate_queue_positions(self, db: Session, *, service_id: str) -> None:
        """Recalculate queue positions sequentially per priority tier."""
        # Update queue position across all priorities doesn't make sense since they are relative to priority.
        # Wait, the spec says "Queue ordering: priority DESC, queue_position ASC, created_at ASC"
        # It's better to recalculate queue_position sequentially across the ENTIRE waiting list for the service,
        # OR keep it sequential within the priority. Let's recalculate across the whole service to maintain absolute order.
        
        priority_ordering = case(
            (Waitlist.priority == "emergency", 0),
            (Waitlist.priority == "urgent", 1),
            (Waitlist.priority == "standard", 2),
            else_=3,
        )

        entries = (
            db.query(Waitlist)
            .filter(
                Waitlist.service_id == service_id,
                Waitlist.status == "waiting"
            )
            .order_by(priority_ordering, Waitlist.created_at.asc())
            .all()
        )

        for i, entry in enumerate(entries, start=1):
            if entry.queue_position != i:
                entry.queue_position = i
                db.add(entry)

        db.commit()


waitlist = CRUDWaitlist(Waitlist)
