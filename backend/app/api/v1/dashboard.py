from datetime import date
from typing import Any, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, PermissionChecker
from app.models.user import User
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    ProviderUtilisationResponse,
    HourlyHeatmapResponse,
    ServiceDemandResponse,
    NoShowTrendResponse
)
from app.services.dashboard_service import dashboard_service
from app.utils.response import APIResponse, ResponseMessages

router = APIRouter()

@router.get("/summary", response_model=Any)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["dashboard:read"])),
) -> Any:
    """Get high-level KPIs and alerts for the admin dashboard."""
    summary = dashboard_service.get_summary(db)
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=summary,
    )

@router.get("/provider-utilisation", response_model=Any)
def get_provider_utilisation(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["dashboard:read"])),
) -> Any:
    """Get today's capacity and utilisation for all active providers."""
    utilisation = dashboard_service.get_provider_utilisation(db)
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=utilisation,
    )

@router.get("/appointments-by-hour", response_model=Any)
def get_appointments_by_hour(
    db: Session = Depends(get_db),
    date_from: date = Query(...),
    date_to: date = Query(...),
    current_user: User = Depends(PermissionChecker(["dashboard:read"])),
) -> Any:
    """Get hourly heatmap data for the specified period."""
    heatmap = dashboard_service.get_appointments_by_hour(db, date_from, date_to)
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=heatmap,
    )

@router.get("/service-demand", response_model=Any)
def get_service_demand(
    db: Session = Depends(get_db),
    date_from: date = Query(...),
    date_to: date = Query(...),
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(PermissionChecker(["dashboard:read"])),
) -> Any:
    """Get top services by demand for the period."""
    demand = dashboard_service.get_service_demand(db, date_from, date_to, limit)
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=demand,
    )

@router.get("/no-show-trend", response_model=Any)
def get_no_show_trend(
    db: Session = Depends(get_db),
    date_from: date = Query(...),
    date_to: date = Query(...),
    current_user: User = Depends(PermissionChecker(["dashboard:read"])),
) -> Any:
    """Get daily no-show and cancellation rates for the period."""
    trend = dashboard_service.get_no_show_trend(db, date_from, date_to)
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data=trend,
    )
