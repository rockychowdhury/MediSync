from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog
from typing import Any

class CRUDActivityLog:
    def create(
        self, 
        db: Session, 
        *, 
        user_id: str | None = None,
        action_type: str,
        entity_type: str,
        entity_id: str | None = None,
        description: str | None = None,
        old_values: dict | None = None,
        new_values: dict | None = None,
        ip_address: str | None = None
    ) -> ActivityLog:
        db_obj = ActivityLog(
            user_id=user_id,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

activity_log = CRUDActivityLog()
