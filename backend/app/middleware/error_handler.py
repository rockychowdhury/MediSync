from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.utils.response import APIResponse, ResponseMessages


# ───────────────────────── Custom Exceptions ─────────────────────────


class AppException(Exception):
    """Base application exception."""

    def __init__(self, message: str, status_code: int = 400, error_code: str | None = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)


class NotFoundException(AppException):
    def __init__(self, message: str = ResponseMessages.NOT_FOUND):
        super().__init__(message=message, status_code=404, error_code="NOT_FOUND")


class BadRequestException(AppException):
    def __init__(self, message: str = ResponseMessages.BAD_REQUEST):
        super().__init__(message=message, status_code=400, error_code="BAD_REQUEST")


class UnauthorizedException(AppException):
    def __init__(self, message: str = ResponseMessages.UNAUTHORIZED):
        super().__init__(message=message, status_code=401, error_code="UNAUTHORIZED")


class ForbiddenException(AppException):
    def __init__(self, message: str = ResponseMessages.PERMISSION_DENIED):
        super().__init__(message=message, status_code=403, error_code="FORBIDDEN")


# ───────────────────────── Handler Registration ─────────────────────────


def register_exception_handlers(app: FastAPI) -> None:
    """Register all global exception handlers on the FastAPI app instance."""

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for error in exc.errors():
            errors.append({
                "field": " -> ".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"],
            })
        return APIResponse.error(
            message=ResponseMessages.VALIDATION_ERROR,
            errors=errors,
            status_code=422,
            error_code="VALIDATION_ERROR",
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return APIResponse.error(
            message=str(exc.detail),
            status_code=exc.status_code,
            error_code="HTTP_ERROR",
        )

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return APIResponse.error(
            message=exc.message,
            status_code=exc.status_code,
            error_code=exc.error_code,
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        return APIResponse.error(
            message=ResponseMessages.SERVER_ERROR,
            status_code=500,
            error_code="INTERNAL_SERVER_ERROR",
        )
