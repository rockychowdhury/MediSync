from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status, Path
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import csv
import io

from app.api.deps import get_db, PermissionChecker
from app.crud.crud_appointment import appointment as crud_appointment
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentStatusUpdate,
    BulkAppointmentStatusUpdate,
    AppointmentReschedule,
)
from app.services.appointment_service import appointment_service
from app.utils.response import APIResponse, ResponseMessages

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_appointment(
    *,
    request: Request,
    db: Session = Depends(get_db),
    appointment_in: AppointmentCreate,
    current_user: User = Depends(PermissionChecker(["appointment:create"])),
) -> Any:
    """Create a new appointment."""
    apt = await appointment_service.create_appointment(
        db,
        obj_in=appointment_in,
        actor_id=str(current_user.id),
        ip_address=request.client.host if request.client else None,
    )
    return APIResponse.success(
        message=ResponseMessages.APPOINTMENT_BOOKED,
        data=AppointmentResponse.model_validate(apt).model_dump(mode="json"),
        status_code=status.HTTP_201_CREATED,
    )


@router.get("")
def read_appointments(
    request: Request,
    db: Session = Depends(get_db),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    provider_id: str | None = None,
    patient_id: str | None = None,
    appointment_status: str | None = Query(None, alias="status"),
    priority: str | None = Query(None),
    search: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=500),
    current_user: User = Depends(PermissionChecker(["appointment:list"])),
) -> Any:
    """List appointments with optional filtering and pagination."""
    # Convert alias status to list if it contains commas
    status_filter = appointment_status
    if appointment_status and "," in appointment_status:
        status_filter = appointment_status.split(",")
        
    priority_filter = priority
    if priority and "," in priority:
        priority_filter = priority.split(",")

    appointments, total = crud_appointment.get_appointments_filtered(
        db,
        start_date=start_date,
        end_date=end_date,
        provider_id=provider_id,
        patient_id=patient_id,
        status=status_filter,
        priority=priority_filter,
        search=search,
        skip=skip,
        limit=limit,
    )
    return APIResponse.paginated_success(
        message=ResponseMessages.APPOINTMENT_RETRIEVED,
        data=[AppointmentResponse.model_validate(a).model_dump(mode="json") for a in appointments],
        pagination_data={"total": total, "skip": skip, "limit": limit},
    )


@router.get("/stats/today")
def get_today_stats(
    db: Session = Depends(get_db),
    target_date: date = Query(default_factory=date.today),
    current_user: User = Depends(PermissionChecker(["appointment:list"])),
) -> Any:
    """KPI data for the admin command bar."""
    stats = crud_appointment.get_today_stats(db, target_date=target_date)
    return APIResponse.success(data=stats)


@router.get("/stats/weekly")
def get_weekly_stats(
    db: Session = Depends(get_db),
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(PermissionChecker(["appointment:list"])),
) -> Any:
    """Capacity utilization for the week view."""
    stats = crud_appointment.get_weekly_capacity_stats(db, start_date=start_date, end_date=end_date)
    return APIResponse.success(data={"days": stats})


@router.get("/stats/monthly")
def get_monthly_stats(
    db: Session = Depends(get_db),
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(PermissionChecker(["appointment:list"])),
) -> Any:
    """Volume data for the month view."""
    stats = crud_appointment.get_stats_by_range(db, start_date=start_date, end_date=end_date)
    return APIResponse.success(data={"days": stats})


@router.get("/export")
def export_appointments(
    db: Session = Depends(get_db),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    current_user: User = Depends(PermissionChecker(["appointment:export"])),
) -> Any:
    """Exports appointments to CSV."""
    appointments, _ = crud_appointment.get_appointments_filtered(
        db, start_date=start_date, end_date=end_date, limit=10000
    )
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Number", "Patient", "Provider", "Start", "End", "Status", "Priority"])
    
    for apt in appointments:
        writer.writerow([
            apt.id, 
            apt.appointment_number, 
            apt.patient.name, 
            apt.provider.user.name,
            apt.appointment_start.isoformat(),
            apt.appointment_end.isoformat(),
            apt.status,
            apt.priority
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=appointments_{date.today().isoformat()}.csv"}
    )


@router.get("/providers/{provider_id}/available-slots")
def get_available_slots(
    db: Session = Depends(get_db),
    provider_id: str = Path(...),
    target_date: date = Query(...),
    service_id: str = Query(...),
    current_user: User = Depends(PermissionChecker(["appointment:create"])),
) -> Any:
    """Calculates free time slots for a provider and service on a specific date."""
    slots = appointment_service.get_available_slots(
        db, provider_id=provider_id, target_date=target_date, service_id=service_id
    )
    return APIResponse.success(data={
        "provider_id": provider_id,
        "date": target_date.isoformat(),
        "slots": slots
    })


@router.post("/bulk/status")
async def bulk_update_status(
    *,
    request: Request,
    db: Session = Depends(get_db),
    bulk_update: BulkAppointmentStatusUpdate,
    current_user: User = Depends(PermissionChecker(["appointment:status_update"])),
) -> Any:
    """Updates status for multiple appointments simultaneously."""
    res = await appointment_service.bulk_update_status(
        db,
        appointment_ids=bulk_update.appointment_ids,
        status=bulk_update.status,
        reason=bulk_update.cancellation_reason,
        actor_id=str(current_user.id),
        ip_address=request.client.host if request.client else None
    )
    return APIResponse.success(data=res)


@router.post("/{id}/reschedule")
async def reschedule_appointment(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: str,
    reschedule_in: AppointmentReschedule,
    current_user: User = Depends(PermissionChecker(["appointment:status_update"])),
) -> Any:
    """Performs an atomic reschedule (cancellation of old, creation of new)."""
    apt = await appointment_service.reschedule(
        db,
        appointment_id=id,
        new_start=reschedule_in.appointment_start,
        new_end=reschedule_in.appointment_end,
        new_provider_id=reschedule_in.provider_id,
        actor_id=str(current_user.id),
        ip_address=request.client.host if request.client else None
    )
    return APIResponse.success(
        message="Appointment rescheduled successfully",
        data=AppointmentResponse.model_validate(apt).model_dump(mode="json")
    )


@router.get("/{id}")
def read_appointment(
    *,
    db: Session = Depends(get_db),
    id: str,
    current_user: User = Depends(PermissionChecker(["appointment:read"])),
) -> Any:
    """Get a specific appointment by ID."""
    apt = crud_appointment.get(db, id=id)
    if not apt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ResponseMessages.APPOINTMENT_NOT_FOUND,
        )
    return APIResponse.success(
        message=ResponseMessages.APPOINTMENT_RETRIEVED,
        data=AppointmentResponse.model_validate(apt).model_dump(mode="json"),
    )


@router.patch("/{id}/status")
async def update_appointment_status(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: str,
    status_update: AppointmentStatusUpdate,
    current_user: User = Depends(PermissionChecker(["appointment:status_update"])),
) -> Any:
    """Update appointment status (triggers state machine & waitlist auto-promotion)."""
    apt = await appointment_service.update_status(
        db,
        appointment_id=id,
        new_status=status_update.status,
        reason=status_update.cancellation_reason,
        actor_id=str(current_user.id),
        ip_address=request.client.host if request.client else None,
    )
    return APIResponse.success(
        message=ResponseMessages.APPOINTMENT_UPDATED,
        data=AppointmentResponse.model_validate(apt).model_dump(mode="json"),
    )


@router.get("/providers/{provider_id}/queue")
def get_provider_queue(
    *,
    db: Session = Depends(get_db),
    provider_id: str,
    target_date: date = Query(...),
    current_user: User = Depends(PermissionChecker(["appointment:list"])),
) -> Any:
    """Get the active queue for a provider on a specific date."""
    queue = crud_appointment.get_provider_queue(
        db, provider_id=provider_id, target_date=target_date
    )
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=[AppointmentResponse.model_validate(a).model_dump(mode="json") for a in queue],
    )


@router.get("/providers/{provider_id}/capacity")
def get_provider_capacity(
    *,
    db: Session = Depends(get_db),
    provider_id: str,
    target_date: date = Query(...),
    current_user: User = Depends(PermissionChecker(["appointment:list"])),
) -> Any:
    """Get utilization metrics for a provider on a specific date."""
    from app.crud.crud_provider import provider

    prov = provider.get(db, id=provider_id)
    if not prov:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ResponseMessages.PROVIDER_NOT_FOUND,
        )

    count = crud_appointment.get_provider_capacity_metrics(
        db, provider_id=provider_id, target_date=target_date
    )
    max_cap = prov.max_daily_appointments or 0
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data={
            "active_appointments": count,
            "max_capacity": max_cap,
            "utilization_percentage": round((count / max_cap) * 100, 2) if max_cap else 0,
        },
    )
