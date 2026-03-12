from fastapi import APIRouter

from app.api.v1 import auth, users, profile, patients, rbac, activity_logs, specializations, services, providers, availability, provider_time_off
from app.utils.response import APIResponse, ResponseMessages

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(profile.router, prefix="/profile", tags=["profile"])
router.include_router(patients.router, prefix="/patients", tags=["patients"])
router.include_router(rbac.router, prefix="/rbac", tags=["rbac"])
router.include_router(activity_logs.router, prefix="/activity-logs", tags=["activity-logs"])
router.include_router(specializations.router, prefix="/specializations", tags=["specializations"])
router.include_router(services.router, prefix="/services", tags=["services"])
router.include_router(providers.router, prefix="/providers", tags=["providers"])
router.include_router(availability.router, prefix="/availability", tags=["availability"])
router.include_router(provider_time_off.router, prefix="/time-off", tags=["time-off"])

@router.get("/", tags=["v1"])
def root():
    """API v1 root — confirms the API is reachable."""
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data={"version": "1.0.0"},
    )
