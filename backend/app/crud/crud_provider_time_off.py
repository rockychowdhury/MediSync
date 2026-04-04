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
                self.model.status == "approved",
                self.model.start_date <= target_date,
                self.model.end_date >= target_date,
            )
            .all()
        )

    def approve_time_off(
        self, db: Session, *, db_obj: ProviderTimeOff, approver_id: str
    ) -> ProviderTimeOff:
        """Approve a time-off request."""
        from datetime import datetime, timezone
        db_obj.is_approved = True
        db_obj.status = "approved"
        db_obj.approved_by = approver_id
        db_obj.reviewed_at = datetime.now(timezone.utc)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def reject_time_off(
        self, db: Session, *, db_obj: ProviderTimeOff, rejector_id: str, reason: str | None = None
    ) -> ProviderTimeOff:
        """Reject a time-off request."""
        from datetime import datetime, timezone
        db_obj.is_approved = False
        db_obj.status = "rejected"
        db_obj.rejected_by = rejector_id
        db_obj.rejection_reason = reason
        db_obj.reviewed_at = datetime.now(timezone.utc)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


provider_time_off = CRUDProviderTimeOff(ProviderTimeOff)
