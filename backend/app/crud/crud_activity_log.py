from typing import Any
from datetime import datetime, timezone
from sqlalchemy import desc, func
from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog
from app.models.user import User

class CRUDActivityLog:
    @property
    def model(self):
        return ActivityLog

    def get(self, db: Session, id: Any) -> ActivityLog | None:
        return db.query(ActivityLog).filter(ActivityLog.id == id).first()

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

    def get_multi_filtered(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        user_id: str | None = None,
        action_type: str | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
        start_date: Any = None,
        end_date: Any = None,
    ) -> tuple[list[ActivityLog], int]:
        query = db.query(ActivityLog)
        
        if user_id:
            query = query.filter(ActivityLog.user_id == user_id)
        if action_type:
            query = query.filter(ActivityLog.action_type == action_type)
        if entity_type:
            query = query.filter(ActivityLog.entity_type == entity_type)
        if entity_id:
            query = query.filter(ActivityLog.entity_id == entity_id)
        if start_date:
            query = query.filter(ActivityLog.created_at >= start_date)
        if end_date:
            query = query.filter(ActivityLog.created_at <= end_date)
            
        total = query.count()
        logs = query.order_by(desc(ActivityLog.created_at)).offset(skip).limit(limit).all()
        return logs, total
    def get_stats(self, db: Session) -> dict[str, Any]:
        from datetime import timedelta
        now = datetime.now(timezone.utc)
        last_24h = now - timedelta(hours=24)
        
        # Total actions in last 24h
        total_24h = db.query(ActivityLog).filter(ActivityLog.created_at >= last_24h).count()
        
        # Failed login attempts in last 24h
        failed_logins_24h = db.query(ActivityLog).filter(
            ActivityLog.created_at >= last_24h,
            ActivityLog.action_type == "login_failed"
        ).count()
        
        # Top 5 most active users in last 24h
        top_users = db.query(
            ActivityLog.user_id,
            func.count(ActivityLog.id).label("action_count")
        ).filter(
            ActivityLog.created_at >= last_24h,
            ActivityLog.user_id.isnot(None)
        ).group_by(ActivityLog.user_id).order_by(desc("action_count")).limit(5).all()
        
        # Map user IDs to names for the response
        top_users_data = []
        for user_id, count in top_users:
            user = db.query(User).filter(User.id == user_id).first()
            top_users_data.append({
                "user_id": user_id,
                "user_name": user.name if user else "Unknown",
                "count": count
            })

        return {
            "total_actions_24h": total_24h,
            "failed_logins_24h": failed_logins_24h,
            "top_active_users_24h": top_users_data
        }

activity_log = CRUDActivityLog()
