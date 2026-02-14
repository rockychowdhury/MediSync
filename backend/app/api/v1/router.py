from fastapi import APIRouter

from app.utils.response import APIResponse, ResponseMessages

router = APIRouter()


@router.get("/")
async def root():
    """API v1 root — confirms the API is reachable."""
    return APIResponse.success(
        message=ResponseMessages.RETRIEVED_SUCCESS,
        data={"version": "1.0.0"},
    )
