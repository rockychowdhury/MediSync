from datetime import date
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, PermissionChecker
from app.crud.crud_waitlist import waitlist as crud_waitlist
from app.models.user import User
from app.schemas.waitlist import (
    WaitlistCreate, 
    WaitlistResponse, 
    WaitlistUpdate,
    WaitlistManualAssign,
    WaitlistDailyStats,
    WaitlistAnalyticsResponse,
    WaitlistExpireRequest
)
from app.services.waitlist_service import waitlist_service
from app.utils.response import APIResponse, ResponseMessages

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_waitlist_entry(
    *,
    request: Request,
    db: Session = Depends(get_db),
    waitlist_in: WaitlistCreate,
    current_user: User = Depends(PermissionChecker(["waitlist:create"])),
) -> Any:
    """Add a patient to the waitlist."""
    entry = await waitlist_service.add_to_waitlist(
        db,
        patient_id=waitlist_in.patient_id,
        service_id=waitlist_in.service_id,
        priority=waitlist_in.priority,
        provider_id=waitlist_in.provider_id,
        requested_date=waitlist_in.requested_date,
        notes=waitlist_in.notes,
        actor_id=str(current_user.id),
        ip_address=request.client.host if request.client else None,
    )
    return APIResponse.success(
        message=ResponseMessages.ADDED_TO_WAITLIST,
        data=WaitlistResponse.model_validate(entry).model_dump(mode="json"),
        status_code=status.HTTP_201_CREATED,
    )


@router.get("/")
def get_waitlist(
    db: Session = Depends(get_db),
    service_id: str | None = None,
    provider_id: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    patient_id: str | None = None,
    requested_date: date | None = None,
    search: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(PermissionChecker(["waitlist:list"])),
) -> Any:
    """Get waitlist entries with advanced filtering."""
    # Convert comma-separated strings to lists if provided
    status_list = status.split(",") if status else None
    priority_list = priority.split(",") if priority else None

    # Note: We should ideally have a crud_waitlist method that handles all these filters
    # For now, we'll build a query here or update crud_waitlist
    query = db.query(crud_waitlist.model)
    
    if service_id:
        query = query.filter(crud_waitlist.model.service_id == service_id)
    if provider_id:
        query = query.filter(
            (crud_waitlist.model.provider_id == provider_id) | 
            (crud_waitlist.model.provider_id == None)
        )
    if status_list:
        query = query.filter(crud_waitlist.model.status.in_(status_list))
    else:
        # Default to waiting if not specified in some views
        pass
    if priority_list:
        query = query.filter(crud_waitlist.model.priority.in_(priority_list))
    if patient_id:
        query = query.filter(crud_waitlist.model.patient_id == patient_id)
    if requested_date:
        query = query.filter(crud_waitlist.model.requested_date == requested_date)
    
    if search:
        from app.models.patient import Patient
        query = query.join(Patient).filter(
            Patient.name.ilike(f"%{search}%") | 
            Patient.phone.ilike(f"%{search}%")
        )

    # Sorting
    from sqlalchemy import case
    priority_ordering = case(
        (crud_waitlist.model.priority == "emergency", 0),
        (crud_waitlist.model.priority == "urgent", 1),
        (crud_waitlist.model.priority == "standard", 2),
        else_=3,
    )
    
    query = query.order_by(
        priority_ordering, 
        crud_waitlist.model.queue_position.asc(), 
        crud_waitlist.model.created_at.asc()
    )

    total = query.count()
    paginated = query.offset(skip).limit(limit).all()
    
    return APIResponse.paginated_success(
        message=ResponseMessages.WAITLIST_RETRIEVED,
        data=[WaitlistResponse.model_validate(e).model_dump(mode="json") for e in paginated],
        pagination_data={"total": total, "skip": skip, "limit": limit},
    )


@router.get("/stats/today")
def get_waitlist_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["waitlist:list"])),
) -> Any:
    """Get live waitlist KPIs for today."""
    stats = waitlist_service.get_daily_stats(db)
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=WaitlistDailyStats(**stats).model_dump(),
    )


@router.get("/analytics")
def get_waitlist_analytics(
    db: Session = Depends(get_db),
    date_from: date = Query(...),
    date_to: date = Query(...),
    current_user: User = Depends(PermissionChecker(["waitlist:list"])),
) -> Any:
    """Get comprehensive waitlist analytics for the period."""
    analytics = waitlist_service.get_analytics(db, date_from, date_to)
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=WaitlistAnalyticsResponse(**analytics).model_dump(),
    )


@router.delete("/{id}")
async def cancel_waitlist_entry(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: UUID,
    current_user: User = Depends(PermissionChecker(["waitlist:delete"])),
) -> Any:
    """Remove someone from waitlist and recalculate queues."""
    await waitlist_service.cancel_waitlist_entry(
        db,
        entry_id=id,
        actor_id=str(current_user.id),
        ip_address=request.client.host if request.client else None,
    )
    return APIResponse.success(message=ResponseMessages.REMOVED_FROM_WAITLIST)


@router.get("/estimated-wait/{service_id}")
def get_estimated_wait_time(
    *,
    db: Session = Depends(get_db),
    service_id: str,
    queue_position: int = Query(..., ge=1),
    current_user: User = Depends(PermissionChecker(["waitlist:list"])),
) -> Any:
    """Get rough estimate of wait time in minutes."""
    est = waitlist_service.estimate_wait_time(
        db, queue_position=queue_position, service_id=service_id
    )
    if est is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot estimate wait time — no active providers for this service.",
        )
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data={"estimated_minutes": est},
    )


@router.post("/{id}/assign")
async def manually_assign_waitlist_entry(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: UUID,
    assignment_in: WaitlistManualAssign,
    current_user: User = Depends(PermissionChecker(["waitlist:edit"])),
) -> Any:
    """Manually assign a waitlist entry to an appointment slot."""
    try:
        entry = await waitlist_service.manual_assign_entry(
            db,
            entry_id=id,
            provider_id=assignment_in.provider_id,
            appointment_start=assignment_in.appointment_start,
            actor_id=str(current_user.id),
            ip_address=request.client.host if request.client else None,
        )
        return APIResponse.success(
            message=ResponseMessages.UPDATED_SUCCESS,
            data=WaitlistResponse.model_validate(entry).model_dump(mode="json"),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{id}")
async def update_waitlist_entry(
    *,
    db: Session = Depends(get_db),
    id: UUID,
    waitlist_in: WaitlistUpdate,
    current_user: User = Depends(PermissionChecker(["waitlist:edit"])),
) -> Any:
    """Update waitlist entry metadata (priority, provider pref, etc)."""
    db_obj = crud_waitlist.get(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")
    
    priority_changed = waitlist_in.priority is not None and waitlist_in.priority != db_obj.priority
    
    entry = crud_waitlist.update(db, db_obj=db_obj, obj_in=waitlist_in)
    
    if priority_changed:
        crud_waitlist.recalculate_queue_positions(db, service_id=entry.service_id)
        # Broadcast queue update
        await ws_manager.broadcast(
            channel=f"waitlist:{entry.service_id}",
            event="queue_positions_updated",
            data={"service_id": entry.service_id},
        )
    
    return APIResponse.success(
        message=ResponseMessages.UPDATED_SUCCESS,
        data=WaitlistResponse.model_validate(entry).model_dump(mode="json"),
    )


@router.post("/expire")
async def expire_old_waitlist_entries(
    *,
    db: Session = Depends(get_db),
    expire_in: WaitlistExpireRequest,
    current_user: User = Depends(PermissionChecker(["waitlist:edit"])),
) -> Any:
    """Batch expire old waitlist entries."""
    count = await waitlist_service.expire_old_entries(db, expire_in.before_date)
    return APIResponse.success(
        message=f"Successfully expired {count} stale waitlist entries.",
        data={"expired_count": count},
    )
