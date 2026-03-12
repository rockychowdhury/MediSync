from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.crud.crud_availability import availability as crud_availability
from app.models.user import User
from app.schemas.availability import (
    AvailabilityCreate,
    AvailabilityUpdate,
    AvailabilityResponse,
)
from app.utils.response import APIResponse, ResponseMessages

router = APIRouter()


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_availability(
    *,
    db: Session = Depends(deps.get_db),
    availability_in: AvailabilityCreate,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Create a new availability slot for a provider.
    Providers can create their own availability, staff can create for anyone.
    """
    if current_user.role.name == "provider" and current_user.id != availability_in.provider_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Providers can only manage their own availability",
        )

    if crud_availability.check_overlap(
        db,
        provider_id=availability_in.provider_id,
        day_of_week=availability_in.day_of_week,
        start_time=availability_in.start_time,
        end_time=availability_in.end_time,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Availability time overlaps with existing slot",
        )

    av = crud_availability.create(db, obj_in=availability_in)
    return APIResponse.success(
        message="Availability created successfully",
        data=AvailabilityResponse.model_validate(av).model_dump(),
    )


@router.get("/{provider_id}", response_model=dict)
def read_provider_availability(
    provider_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get all availability slots for a specific provider.
    """
    slots = crud_availability.get_by_provider(db, provider_id=provider_id, skip=skip, limit=limit)
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=[AvailabilityResponse.model_validate(slot).model_dump() for slot in slots],
    )


@router.put("/{id}", response_model=dict)
def update_availability(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    availability_in: AvailabilityUpdate,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Update an existing availability slot.
    """
    av = crud_availability.get(db, id=id)
    if not av:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Availability not found")

    if current_user.role.name == "provider" and current_user.id != av.provider_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Providers can only modify their own availability",
        )
        
    start_time = availability_in.start_time or av.start_time
    end_time = availability_in.end_time or av.end_time
    
    if start_time and end_time and start_time >= end_time:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start_time must be before end_time")

    if crud_availability.check_overlap(
        db,
        provider_id=av.provider_id,
        day_of_week=av.day_of_week,
        start_time=start_time, # type: ignore
        end_time=end_time, # type: ignore
        exclude_id=id,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Updated availability time overlaps with existing slot",
        )

    av = crud_availability.update(db, db_obj=av, obj_in=availability_in)
    return APIResponse.success(
        message=ResponseMessages.UPDATED_SUCCESS,
        data=AvailabilityResponse.model_validate(av).model_dump(),
    )


@router.delete("/{id}", response_model=dict)
def delete_availability(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Delete an availability slot.
    """
    av = crud_availability.get(db, id=id)
    if not av:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Availability not found")

    if current_user.role.name == "provider" and current_user.id != av.provider_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Providers can only delete their own availability",
        )

    crud_availability.delete(db, id=id)
    return APIResponse.success(message=ResponseMessages.DELETED_SUCCESS)
