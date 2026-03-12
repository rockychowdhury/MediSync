from typing import Any
from sqlalchemy.orm import Session
from datetime import date

from app.crud.base import CRUDBase
from app.models.provider_time_off import ProviderTimeOff
from app.schemas.provider_time_off import ProviderTimeOffCreate, ProviderTimeOffUpdate


class CRUDProviderTimeOff(CRUDBase[ProviderTimeOff, ProviderTimeOffCreate, ProviderTimeOffUpdate]):
    """
    CRUD operations for ProviderTimeOff instances.
    """

    def get_by_provider(
        self, db: Session, *, provider_id: str, skip: int = 0, limit: int = 100
    ) -> list[ProviderTimeOff]:
        """Fetch all time-off requests for a provider."""
        return (
            db.query(self.model)
            .filter(self.model.provider_id == provider_id)
            .order_by(self.model.start_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_active_time_offs(
        self, db: Session, *, provider_id: str, target_date: date
    ) -> list[ProviderTimeOff]:
        """Fetch approved time off periods covering a specific date for a provider."""
        return (
            db.query(self.model)
            .filter(
                self.model.provider_id == provider_id,
                self.model.is_approved == True,
                self.model.start_date <= target_date,
                self.model.end_date >= target_date,
            )
            .all()
        )

    def approve_time_off(
        self, db: Session, *, db_obj: ProviderTimeOff, approver_id: str
    ) -> ProviderTimeOff:
        """Approve a time-off request."""
        db_obj.is_approved = True
        db_obj.approved_by = approver_id
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


provider_time_off = CRUDProviderTimeOff(ProviderTimeOff)
