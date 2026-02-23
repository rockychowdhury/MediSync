from fastapi import APIRouter

from app.api.v1 import auth
from app.utils.response import APIResponse, ResponseMessages

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])

@router.get("/")
def root():
    """API v1 root — confirms the API is reachable."""
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data={"version": "1.0.0"},
    )
