from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, PermissionChecker
from app.crud.crud_waitlist import waitlist as crud_waitlist
from app.models.user import User
from app.schemas.waitlist import WaitlistCreate, WaitlistResponse
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
    service_id: str = Query(...),
    provider_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(PermissionChecker(["waitlist:list"])),
) -> Any:
    """Get ordered waitlist for a specific service with pagination."""
    entries = crud_waitlist.get_ordered_waitlist_for_service(
        db, service_id=service_id, provider_id=provider_id
    )
    total = len(entries)
    paginated = entries[skip : skip + limit]
    return APIResponse.paginated_success(
        message=ResponseMessages.WAITLIST_RETRIEVED,
        data=[WaitlistResponse.model_validate(e).model_dump(mode="json") for e in paginated],
        pagination_data={"total": total, "skip": skip, "limit": limit},
    )


@router.delete("/{id}")
async def cancel_waitlist_entry(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: str,
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
