from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.crud.crud_provider_time_off import provider_time_off as crud_time_off
from app.models.user import User
from app.schemas.provider_time_off import (
    ProviderTimeOffCreate,
    ProviderTimeOffUpdate,
    ProviderTimeOffResponse,
)
from app.utils.response import APIResponse, ResponseMessages

router = APIRouter()


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_time_off(
    *,
    db: Session = Depends(deps.get_db),
    time_off_in: ProviderTimeOffCreate,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Create a new time-off request.
    Providers can only request for themselves. Staff can create for anyone.
    Requests are unapproved by default unless created by staff (business logic might vary, 
    but keeping it unapproved for all to enforce standard approval workflow).
    """
    if current_user.role.name == "provider" and current_user.id != time_off_in.provider_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Providers can only request time-off for themselves",
        )

    time_off = crud_time_off.create(db, obj_in=time_off_in)
    return APIResponse.success(
        message="Time-off requested successfully",
        data=ProviderTimeOffResponse.model_validate(time_off).model_dump(),
    )


@router.get("/{provider_id}", response_model=dict)
def read_provider_time_offs(
    provider_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get all time-off requests for a provider.
    """
    if current_user.role.name == "provider" and current_user.id != provider_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Providers can only view their own time-off requests",
        )

    requests = crud_time_off.get_by_provider(db, provider_id=provider_id, skip=skip, limit=limit)
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=[ProviderTimeOffResponse.model_validate(req).model_dump() for req in requests],
    )


@router.put("/{id}", response_model=dict)
def update_time_off(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    time_off_in: ProviderTimeOffUpdate,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Update a time-off request.
    Approved requests might require staff to update, or reset approval status.
    """
    pto = crud_time_off.get(db, id=id)
    if not pto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Time-off request not found")

    if current_user.role.name == "provider":
        if current_user.id != pto.provider_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Providers can only modify their own time-off requests",
            )
        if time_off_in.is_approved is not None or time_off_in.approved_by is not None:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Providers cannot approve their own requests",
            )
        if pto.is_approved:
            # Maybe restrict providers from modifying already approved requests without re-approval
            time_off_in.is_approved = False
            time_off_in.approved_by = None

    pto = crud_time_off.update(db, db_obj=pto, obj_in=time_off_in)
    return APIResponse.success(
        message=ResponseMessages.UPDATED_SUCCESS,
        data=ProviderTimeOffResponse.model_validate(pto).model_dump(),
    )


@router.patch("/{id}/approve", response_model=dict)
def approve_time_off(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_staff),
):
    """
    Approve a provider's time-off request. Restricted to staff/admins.
    """
    pto = crud_time_off.get(db, id=id)
    if not pto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Time-off request not found")

    pto = crud_time_off.approve_time_off(db, db_obj=pto, approver_id=current_user.id)
    return APIResponse.success(
        message="Time-off request approved successfully",
        data=ProviderTimeOffResponse.model_validate(pto).model_dump(),
    )


@router.delete("/{id}", response_model=dict)
def delete_time_off(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Delete a time-off request.
    """
    pto = crud_time_off.get(db, id=id)
    if not pto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Time-off request not found")

    if current_user.role.name == "provider" and current_user.id != pto.provider_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Providers can only delete their own time-off requests",
        )

    crud_time_off.delete(db, id=id)
    return APIResponse.success(message=ResponseMessages.DELETED_SUCCESS)
