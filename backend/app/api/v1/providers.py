from datetime import date
from typing import Any
from fastapi import APIRouter, Depends, Query, status, Request
from sqlalchemy.orm import Session

from app import crud
from app.api.deps import get_db, get_current_active_admin, get_current_user
from app.models.user import User
from app.services.user_service import UserService
from app.utils.response import APIResponse, ResponseMessages

from app.schemas.provider import ProviderCreate, ProviderUpdate, ProviderResponse, ProviderWithDetails
from app.schemas.service import ServiceWithSpecialization

router = APIRouter()

@router.get("", response_model=list[ProviderWithDetails])
def read_providers(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    specialization_id: int | None = Query(None),
    status: str | None = Query(None),
    search: str | None = Query(None),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve all clinical providers with filtering and pagination."""
    providers, total = crud.provider.get_multi_filtered(
        db, skip=skip, limit=limit, specialization_id=specialization_id, status=status, search=search
    )
    return APIResponse.paginated_success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=[ProviderWithDetails.model_validate(p) for p in providers],
        pagination_data={"total": total, "skip": skip, "limit": limit}
    )

@router.post("", status_code=status.HTTP_201_CREATED)
def promote_to_provider(
    *,
    request: Request,
    db: Session = Depends(get_db),
    provider_in: ProviderCreate,
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """
    Promote an existing user to a Provider profile (Admin only).
    The user must already have the 'provider' role.
    """
    # 1. Check if user exists
    user_db = crud.user.get(db, id=provider_in.id)
    if not user_db:
        return APIResponse.error(
            message="User not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    # 2. Check if user has provider role
    if not user_db.role or user_db.role.name != "provider":
         return APIResponse.error(
            message="User does not have the required 'provider' role to be promoted.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    # 3. Check if provider profile already exists
    existing_provider = crud.provider.get(db, id=provider_in.id)
    if existing_provider:
        return APIResponse.error(
            message="Provider profile already exists for this user.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    # 4. Create profile
    provider_db = crud.provider.create(db, obj_in=provider_in)
    
    # Audit Logging
    UserService.log_activity(
        db,
        user_id=current_admin.id,
        action="PROMOTE_PROVIDER",
        entity_id=provider_db.id,
        entity_type="provider",
        description=f"Promoted user {user_db.email} to clinical provider profile",
        new_val=provider_in.model_dump(mode="json"),
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(
        message="User successfully promoted to clinical provider profile.",
        data=ProviderResponse.model_validate(provider_db),
        status_code=status.HTTP_201_CREATED
    )

@router.get("/{id}", response_model=ProviderWithDetails)
def read_provider_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get a specific provider's clinical profile."""
    provider_db = crud.provider.get(db, id=id)
    if not provider_db:
        return APIResponse.error(
            message="Provider not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=ProviderWithDetails.model_validate(provider_db)
    )

@router.put("/{id}", response_model=ProviderResponse)
def update_provider_profile(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: str,
    provider_in: ProviderUpdate,
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """Update a provider's clinical attributes (Admin only)."""
    provider_db = crud.provider.get(db, id=id)
    if not provider_db:
        return APIResponse.error(
            message="Provider not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    old_data = ProviderResponse.model_validate(provider_db).model_dump(mode="json")
    updated_provider = crud.provider.update(db, db_obj=provider_db, obj_in=provider_in)
    new_data = ProviderResponse.model_validate(updated_provider).model_dump(mode="json")
    
    # Audit Logging
    UserService.log_activity(
        db,
        user_id=current_admin.id,
        action="UPDATE_PROVIDER_PROFILE",
        entity_id=id,
        entity_type="provider",
        description=f"Updated clinical profile for provider {id}",
        old_val=old_data,
        new_val=new_data,
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(
        message=ResponseMessages.UPDATED_SUCCESS,
        data=ProviderResponse.model_validate(updated_provider)
    )

@router.get("/{id}/services", response_model=list[ServiceWithSpecialization])
def read_provider_services(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve all clinical services assigned to a specific provider."""
    provider_db = crud.provider.get(db, id=id)
    if not provider_db:
        return APIResponse.error(
            message="Provider not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=[ServiceWithSpecialization.model_validate(s) for s in provider_db.services]
    )

@router.post("/{provider_id}/services/{service_id}")
def assign_service_to_provider(
    *,
    request: Request,
    db: Session = Depends(get_db),
    provider_id: str,
    service_id: str,
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """
    Assign a clinical service to a provider.
    Validates that the provider has the required specialization for the service.
    """
    # 1. Fetch provider and service
    provider_db = crud.provider.get(db, id=provider_id)
    if not provider_db:
        return APIResponse.error(
            message="Provider not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    service_db = crud.service.get(db, id=service_id)
    if not service_db:
        return APIResponse.error(
            message="Service not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    # 2. Validation: Ensure specialization matches if required
    if service_db.required_specialization_id and provider_db.specialization_id != service_db.required_specialization_id:
        return APIResponse.error(
            message=f"Specialization mismatch. Service requires specialization ID {service_db.required_specialization_id}, but provider has ID {provider_db.specialization_id}.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    # 3. Check if already assigned
    if service_db in provider_db.services:
        return APIResponse.error(
            message="Service already assigned to this provider.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    # 4. Assign
    provider_db.services.append(service_db)
    db.commit()
    
    # Audit Logging
    UserService.log_activity(
        db,
        user_id=current_admin.id,
        action="ASSIGN_SERVICE_PROVIDER",
        entity_id=f"{provider_id}:{service_id}",
        entity_type="provider_service",
        description=f"Assigned service '{service_db.name}' to provider '{provider_id}'",
        new_val={"provider_id": provider_id, "service_id": service_id},
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(message="Service successfully assigned to provider.")

@router.delete("/{provider_id}/services/{service_id}")
def remove_service_from_provider(
    *,
    request: Request,
    db: Session = Depends(get_db),
    provider_id: str,
    service_id: str,
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """Remove a clinical service assignment from a provider."""
    provider_db = crud.provider.get(db, id=provider_id)
    if not provider_db:
        return APIResponse.error(
            message="Provider not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    service_db = crud.service.get(db, id=service_id)
    if not service_db:
        return APIResponse.error(
            message="Service not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    
    if service_db not in provider_db.services:
        return APIResponse.error(
            message="Service is not assigned to this provider.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    provider_db.services.remove(service_db)
    db.commit()
    
    # Audit Logging
    UserService.log_activity(
        db,
        user_id=current_admin.id,
        action="REMOVE_SERVICE_PROVIDER",
        entity_id=f"{provider_id}:{service_id}",
        entity_type="provider_service",
        description=f"Removed service '{service_db.name}' from provider '{provider_id}'",
        ip_address=request.client.host if request.client else None
    )
    
    return APIResponse.success(message="Service successfully removed from provider.")

@router.patch("/{id}/status")
def update_provider_status(
    *,
    request: Request,
    db: Session = Depends(get_db),
    id: str,
    status_in: dict[str, str],
    current_admin: User = Depends(get_current_active_admin),
) -> Any:
    """Lightweight status update for provider presence."""
    provider_db = crud.provider.get(db, id=id)
    if not provider_db:
        return APIResponse.error(message="Provider not found", status_code=status.HTTP_404_NOT_FOUND)
    
    new_status = status_in.get("status")
    if not new_status:
        return APIResponse.error(message="Status required", status_code=status.HTTP_400_BAD_REQUEST)

    provider_db.status = new_status
    db.commit()
    db.refresh(provider_db)
    
    return APIResponse.success(message="Status updated", data={"id": id, "status": new_status})

@router.get("/{id}/stats")
def read_provider_stats(
    id: str,
    date_from: date = Query(...),
    date_to: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve performance statistics for a specific provider."""
    provider_db = crud.provider.get(db, id=id)
    if not provider_db:
        return APIResponse.error(message="Provider not found", status_code=status.HTTP_404_NOT_FOUND)
    
    stats = crud.provider.get_stats(db, provider_id=id, date_from=date_from, date_to=date_to)
    return APIResponse.success(message="Stats retrieved", data=stats)
