from typing import Any
from fastapi import APIRouter, Depends, Query, status, Request
from sqlalchemy.orm import Session

from app import crud
from app.api.deps import get_db, get_current_user, PermissionChecker, get_current_active_admin
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.schemas.activity_log import ActivityLogListResponse
from app.services.patient_service import PatientService
from app.utils.response import APIResponse, ResponseMessages

router = APIRouter()

@router.get("", response_model=list[PatientResponse])
def read_patients(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    is_active: bool | None = Query(None),
    search: str | None = Query(None),
    current_user: User = Depends(PermissionChecker(["patient:list"])),
) -> Any:
    """Retrieve all patients with filtering and pagination."""
    patients, total = crud.patient.get_multi_filtered(
        db, skip=skip, limit=limit, is_active=is_active, search=search
    )
    return APIResponse.paginated_success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=[PatientResponse.model_validate(p) for p in patients],
        pagination_data={"total": total, "skip": skip, "limit": limit}
    )

@router.post("", status_code=status.HTTP_201_CREATED)
def create_patient(
    *,
    request: Request,
    db: Session = Depends(get_db),
    patient_in: PatientCreate,
    current_user: User = Depends(PermissionChecker(["patient:create"])),
) -> Any:
    """Register a new patient."""
    try:
        patient = PatientService.create_patient(
            db, 
            obj_in=patient_in, 
            actor_id=current_user.id,
            ip_address=request.client.host if request.client else None
        )
    except ValueError as e:
        return APIResponse.error(
            message=str(e),
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    return APIResponse.success(
        message=ResponseMessages.CREATED_SUCCESS,
        data=PatientResponse.model_validate(patient),
        status_code=status.HTTP_201_CREATED
    )

@router.get("/{id}", response_model=PatientResponse)
def read_patient_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["patient:read"])),
) -> Any:
    """Get a specific patient by ID."""
    patient = crud.patient.get(db, id=id)
    if not patient:
        return APIResponse.error(
            message="Patient not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=PatientResponse.model_validate(patient)
    )

@router.put("/{id}", response_model=PatientResponse)
def update_patient(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: str,
    patient_in: PatientUpdate,
    current_user: User = Depends(PermissionChecker(["patient:update"])),
) -> Any:
    """Update a patient's information."""
    patient = crud.patient.get(db, id=id)
    if not patient:
        return APIResponse.error(
            message="Patient not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    updated_patient = PatientService.update_patient(
        db, 
        db_obj=patient, 
        obj_in=patient_in, 
        actor_id=current_user.id,
        ip_address=request.client.host if request.client else None
    )
    return APIResponse.success(
        message=ResponseMessages.UPDATED_SUCCESS,
        data=PatientResponse.model_validate(updated_patient)
    )

@router.delete("/{id}")
def delete_patient(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: str,
    current_user: User = Depends(PermissionChecker(["patient:delete"])),
) -> Any:
    """Soft delete a patient."""
    patient = crud.patient.get(db, id=id)
    if not patient:
        return APIResponse.error(
            message="Patient not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    PatientService.soft_delete_patient(
        db, 
        db_obj=patient, 
        actor_id=current_user.id,
        ip_address=request.client.host if request.client else None
    )
    return APIResponse.success(message=ResponseMessages.DELETED_SUCCESS)

@router.patch("/{id}/activate")
def activate_patient(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: str,
    current_user: User = Depends(PermissionChecker(["patient:activate"])),
) -> Any:
    """Re-activate a patient record."""
    patient = crud.patient.get(db, id=id)
    if not patient:
        return APIResponse.error(
            message="Patient not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    PatientService.activate_patient(
        db, 
        db_obj=patient, 
        actor_id=current_user.id,
        ip_address=request.client.host if request.client else None
    )
    return APIResponse.success(message="Patient activated successfully")
@router.get("/{id}/audit", response_model=ActivityLogListResponse)
def read_patient_audit(
    id: str,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """
    Retrieve clinical audit trail for a specific patient (Admin only).
    """
    patient = crud.patient.get(db, id=id)
    if not patient:
        return APIResponse.error(
            message="Patient not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    logs, total = crud.activity_log.get_multi_filtered(
        db, skip=skip, limit=limit, entity_type="patient", entity_id=id
    )
    
    data = []
    for log in logs:
        data.append({
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
        })

    return APIResponse.paginated_success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=data,
        pagination_data={"total": total, "skip": skip, "limit": limit}
    )
