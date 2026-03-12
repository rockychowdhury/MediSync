from typing import Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import time as time_type

from app.crud.base import CRUDBase
from app.models.availability import Availability
from app.schemas.availability import AvailabilityCreate, AvailabilityUpdate


class CRUDAvailability(CRUDBase[Availability, AvailabilityCreate, AvailabilityUpdate]):
    """
    CRUD operations for Availability instances.
    """

    def get_by_provider(
        self, db: Session, *, provider_id: str, skip: int = 0, limit: int = 100
    ) -> list[Availability]:
        """Fetch all availability rules for a specific provider."""
        return (
            db.query(self.model)
            .filter(self.model.provider_id == provider_id)
            .order_by(self.model.day_of_week)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def check_overlap(
        self,
        db: Session,
        *,
        provider_id: str,
        day_of_week: int,
        start_time: time_type,
        end_time: time_type,
        exclude_id: int | None = None
    ) -> bool:
        """Check if a given time range overlaps with existing availability for the provider."""
        query = db.query(self.model).filter(
            self.model.provider_id == provider_id,
            self.model.day_of_week == day_of_week,
            self.model.start_time < end_time,
            self.model.end_time > start_time
        )
        if exclude_id:
            query = query.filter(self.model.id != exclude_id)
        return query.first() is not None


availability = CRUDAvailability(Availability)
