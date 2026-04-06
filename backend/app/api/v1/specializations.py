from typing import Any
from fastapi import APIRouter, Depends, Query, status, Request
from sqlalchemy.orm import Session

from app import crud
from app.api.deps import get_db, get_current_active_admin
from app.schemas.specialization import SpecializationCreate, SpecializationResponse
from app.services.user_service import UserService
from app.utils.response import APIResponse, ResponseMessages

router = APIRouter()

@router.get("", response_model=list[SpecializationResponse])
def read_specializations(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: str | None = Query(None),
) -> Any:
    """
    Retrieve all specializations with pagination and search.
    """
    specializations, total = crud.specialization.get_multi_filtered(
        db, skip=skip, limit=limit, search=search
    )
    return APIResponse.paginated_success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=[SpecializationResponse.model_validate(s) for s in specializations],
        pagination_data={"total": total, "skip": skip, "limit": limit}
    )

@router.get("/{id}", response_model=SpecializationResponse)
def read_specialization(
    id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Get a specific specialization by ID.
    """
    specialization = crud.specialization.get(db, id=id)
    if not specialization:
        return APIResponse.error(
            message="Specialization not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=SpecializationResponse.model_validate(specialization)
    )

@router.post("", status_code=status.HTTP_201_CREATED)
def create_specialization(
    *,
    request: Request,
    db: Session = Depends(get_db),
    spec_in: SpecializationCreate,
    current_admin: Any = Depends(get_current_active_admin),
) -> Any:
    """
    Create a new clinical specialization (Admin only).
    """
    existing = crud.specialization.get_by_name(db, name=spec_in.name)
    if existing:
        return APIResponse.error(
            message=f"Specialization '{spec_in.name}' already exists",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    specialization = crud.specialization.create(db, obj_in=spec_in)
    
    UserService.log_activity(
        db,
        user_id=current_admin.id,
        action="create_specialization",
        entity_type="specialization",
        entity_id=str(specialization.id),
        description=f"Created specialization: {specialization.name}",
        new_val=spec_in.model_dump(mode="json"),
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(
        message=ResponseMessages.CREATED_SUCCESS,
        data=SpecializationResponse.model_validate(specialization)
    )

@router.put("/{id}", response_model=SpecializationResponse)
def update_specialization(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: int,
    spec_in: SpecializationCreate, # Reuse create schema since it has the same fields
    current_admin: Any = Depends(get_current_active_admin),
) -> Any:
    """
    Update an existing specialization (Admin only).
    """
    specialization = crud.specialization.get(db, id=id)
    if not specialization:
        return APIResponse.error(
            message="Specialization not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    old_data = {"name": specialization.name, "description": specialization.description}
    updated_specialization = crud.specialization.update(db, db_obj=specialization, obj_in=spec_in)
    
    UserService.log_activity(
        db,
        user_id=current_admin.id,
        action="update_specialization",
        entity_type="specialization",
        entity_id=str(id),
        description=f"Updated specialization: {specialization.name}",
        old_val=old_data,
        new_val=spec_in.model_dump(mode="json"),
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(
        message=ResponseMessages.UPDATED_SUCCESS,
        data=SpecializationResponse.model_validate(updated_specialization)
    )

@router.delete("/{id}")
def delete_specialization(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: int,
    current_admin: Any = Depends(get_current_active_admin),
) -> Any:
    """
    Delete a specialization (Admin only).
    """
    specialization = crud.specialization.get(db, id=id)
    if not specialization:
        return APIResponse.error(
            message="Specialization not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    # Check for linked providers or services (simulating foreign key constraint check)
    if specialization.providers:
        return APIResponse.error(
            message="Cannot delete specialization: linked to active providers",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    if specialization.services:
        return APIResponse.error(
            message="Cannot delete specialization: linked to active services",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    crud.specialization.delete(db, id=id)
    
    UserService.log_activity(
        db,
        user_id=current_admin.id,
        action="delete_specialization",
        entity_type="specialization",
        entity_id=str(id),
        description=f"Deleted specialization ID: {id}",
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(message=ResponseMessages.DELETED_SUCCESS)
