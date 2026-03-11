from typing import Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from datetime import datetime

from app import crud
from app.api.deps import get_db, get_current_active_admin
from app.schemas.activity_log import ActivityLogResponse, ActivityLogListResponse
from app.utils.response import APIResponse, ResponseMessages

router = APIRouter()

@router.get("/", response_model=ActivityLogListResponse)
def read_activity_logs(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    user_id: str | None = Query(None),
    action_type: str | None = Query(None),
    entity_type: str | None = Query(None),
    entity_id: str | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    current_admin: Any = Depends(get_current_active_admin),
) -> Any:
    """
    Retrieve all activity logs with advanced filtering (Admin only).
    """
    logs, total = crud.activity_log.get_multi_filtered(
        db,
        skip=skip,
        limit=limit,
        user_id=user_id,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        start_date=start_date,
        end_date=end_date
    )
    
    # Pre-populate user_name for the schema validator if needed, 
    # but the model has a relationship so pydantic's from_attributes=True 
    # might handle it if we adjust the schema.
    # Currently, ActivityLogResponse has user_name. Let's make sure it works.
    
    data = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "user_name": log.user.name if log.user else "System",
            "action_type": log.action_type,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "description": log.description,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
        }
        data.append(log_dict)

    return APIResponse.paginated_success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=data,
        pagination_data={"total": total, "skip": skip, "limit": limit}
    )

@router.get("/stats")
def read_activity_stats(
    db: Session = Depends(get_db),
    current_admin: Any = Depends(get_current_active_admin),
) -> Any:
    """
    Get summary statistics for activity logs (Admin only).
    """
    stats = crud.activity_log.get_stats(db)
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=stats
    )

@router.get("/{id}", response_model=ActivityLogResponse)
def read_activity_log(
    id: int,
    db: Session = Depends(get_db),
    current_admin: Any = Depends(get_current_active_admin),
) -> Any:
    """
    Retrieve technical details of a specific log entry (Admin only).
    """
    log = crud.activity_log.get(db, id=id)
    if not log:
        return APIResponse.error(
            message="Activity log not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    log_data = {
        "id": log.id,
        "user_id": log.user_id,
        "user_name": log.user.name if log.user else "System",
        "action_type": log.action_type,
        "entity_type": log.entity_type,
        "entity_id": log.entity_id,
        "description": log.description,
        "old_values": log.old_values,
        "new_values": log.new_values,
        "ip_address": log.ip_address,
        "created_at": log.created_at,
    }
    
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=log_data
    )
