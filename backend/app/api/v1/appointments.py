from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, PermissionChecker
from app.crud.crud_appointment import appointment as crud_appointment
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentStatusUpdate,
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
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=500),
    current_user: User = Depends(PermissionChecker(["appointment:list"])),
) -> Any:
    """List appointments with optional filtering and pagination."""
    appointments, total = crud_appointment.get_appointments_filtered(
        db,
        start_date=start_date,
        end_date=end_date,
        provider_id=provider_id,
        patient_id=patient_id,
        status=appointment_status,
        skip=skip,
        limit=limit,
    )
    return APIResponse.paginated_success(
        message=ResponseMessages.APPOINTMENT_RETRIEVED,
        data=[AppointmentResponse.model_validate(a).model_dump(mode="json") for a in appointments],
        pagination_data={"total": total, "skip": skip, "limit": limit},
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
