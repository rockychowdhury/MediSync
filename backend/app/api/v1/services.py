from typing import Any
from fastapi import APIRouter, Depends, Query, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app import crud
from app.api.deps import get_db, get_current_active_admin, get_current_user
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse, ServiceWithSpecialization
from app.services.user_service import UserService
from app.utils.response import APIResponse, ResponseMessages

router = APIRouter()

@router.get("", response_model=list[ServiceWithSpecialization])
def read_services(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: str | None = Query(None),
    specialization_id: int | None = Query(None),
    search: str | None = Query(None),
    is_active: bool | None = Query(None, description="Filter by active status. Defaults to all for admins, active only for users."),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve all clinical services with optional filtering.
    - **Admins** can see all services.
    - **Regular users** only see active services by default.
    """
    # If not admin and is_active not specified, force True
    effective_is_active = is_active
    from app.models.role import Role
    is_admin = current_user.role and current_user.role.name == "admin"
    
    if not is_admin and effective_is_active is None:
        effective_is_active = True

    services, total = crud.service.get_multi_filtered(
        db, 
        skip=skip, 
        limit=limit, 
        category=category, 
        specialization_id=specialization_id, 
        search=search,
        is_active=effective_is_active
    )
    
    return APIResponse.paginated_success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=[ServiceWithSpecialization.model_validate(s) for s in services],
        pagination_data={"total": total, "skip": skip, "limit": limit}
    )

@router.get("/categories", response_model=list[str])
def read_service_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve a unique list of all clinical service categories."""
    categories = crud.service.get_categories(db)
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=categories
    )

@router.get("/{id}", response_model=ServiceWithSpecialization)
def read_service(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get detailed information for a specific service."""
    service = crud.service.get(db, id=id)
    if not service:
        return APIResponse.error(
            message="Service not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=ServiceWithSpecialization.model_validate(service)
    )

@router.post("", status_code=status.HTTP_201_CREATED)
def create_service(
    *,
    request: Request,
    db: Session = Depends(get_db),
    service_in: ServiceCreate,
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """Create a new clinical service (Admin only)."""
    try:
        service = crud.service.create(db, obj_in=service_in)
    except IntegrityError:
        db.rollback()
        return APIResponse.error(
            message="Invalid data: Required specialization does not exist or valid constraints failed.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    # Audit Logging
    UserService.log_activity(
        db,
        user_id=current_admin.id,
        action="CREATE_SERVICE",
        entity_id=service.id,
        entity_type="service",
        description=f"Created service: {service.name}",
        new_val=service_in.model_dump(mode="json"),
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(
        message=ResponseMessages.CREATED_SUCCESS,
        data=ServiceResponse.model_validate(service),
        status_code=status.HTTP_201_CREATED
    )

@router.put("/{id}", response_model=ServiceResponse)
def update_service(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: str,
    service_in: ServiceUpdate,
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """Update an existing service (Admin only)."""
    service_db = crud.service.get(db, id=id)
    if not service_db:
        return APIResponse.error(
            message="Service not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    old_data = ServiceResponse.model_validate(service_db).model_dump(mode="json")
    try:
        updated_service = crud.service.update(db, db_obj=service_db, obj_in=service_in)
    except IntegrityError:
        db.rollback()
        return APIResponse.error(
            message="Invalid data: Required specialization does not exist or valid constraints failed.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    new_data = ServiceResponse.model_validate(updated_service).model_dump(mode="json")
    
    # Audit Logging
    UserService.log_activity(
        db,
        user_id=current_admin.id,
        action="UPDATE_SERVICE",
        entity_id=id,
        entity_type="service",
        description=f"Updated service: {updated_service.name}",
        old_val=old_data,
        new_val=new_data,
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(
        message=ResponseMessages.UPDATED_SUCCESS,
        data=ServiceResponse.model_validate(updated_service)
    )

@router.delete("/{id}")
def delete_service(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: str,
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """Delete a service (Admin only)."""
    service_db = crud.service.get(db, id=id)
    if not service_db:
        return APIResponse.error(
            message="Service not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    # Check for dependencies (Appointments)
    if service_db.appointments or service_db.waitlist_entries:
        return APIResponse.error(
            message="Cannot delete service with active appointments or waitlist entries. Deactivate it instead.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
        
    service_name = service_db.name
    crud.service.delete(db, id=id)
    
    # Audit Logging
    UserService.log_activity(
        db,
        user_id=current_admin.id,
        action="DELETE_SERVICE",
        entity_id=id,
        entity_type="service",
        description=f"Deleted service: {service_name}",
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(message=ResponseMessages.DELETED_SUCCESS)
