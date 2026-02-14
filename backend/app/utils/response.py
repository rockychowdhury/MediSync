from typing import Any, Dict, List, Optional, Union

from fastapi.responses import JSONResponse


class APIResponse:
    """Standardized API response format for the entire application."""

    @staticmethod
    def success(
        message: str = "Operation successful",
        data: Optional[Union[Dict, List]] = None,
        status_code: int = 200,
        meta: Optional[Dict] = None,
    ) -> JSONResponse:
        """Standard success response format."""
        response_data: Dict[str, Any] = {
            "success": True,
            "message": message,
            "data": data,
            "meta": meta or {},
        }
        return JSONResponse(content=response_data, status_code=status_code)

    @staticmethod
    def error(
        message: str = "An error occurred",
        errors: Optional[Union[Dict, List, str]] = None,
        status_code: int = 400,
        error_code: Optional[str] = None,
    ) -> JSONResponse:
        """Standard error response format."""
        response_data: Dict[str, Any] = {
            "success": False,
            "message": message,
            "errors": errors,
            "error_code": error_code,
        }
        return JSONResponse(content=response_data, status_code=status_code)

    @staticmethod
    def paginated_success(
        message: str = "Data retrieved successfully",
        data: Optional[List] = None,
        pagination_data: Optional[Dict] = None,
        status_code: int = 200,
    ) -> JSONResponse:
        """Standard paginated success response."""
        meta = {"pagination": pagination_data or {}}
        return APIResponse.success(message, data, status_code, meta)


class ResponseMessages:
    """Common response messages used across the application."""

    # Authentication
    LOGIN_SUCCESS = "Login successful"
    LOGOUT_SUCCESS = "Logout successful"
    REGISTRATION_SUCCESS = "User registered successfully"
    PASSWORD_CHANGED = "Password changed successfully"
    TOKEN_REFRESHED = "Tokens refreshed successfully"

    # Profile
    PROFILE_UPDATED = "Profile updated successfully"
    PROFILE_RETRIEVED = "Profile retrieved successfully"

    # General
    CREATED_SUCCESS = "Created successfully"
    UPDATED_SUCCESS = "Updated successfully"
    DELETED_SUCCESS = "Deleted successfully"
    RETRIEVED_SUCCESS = "Data retrieved successfully"

    # Errors
    INVALID_CREDENTIALS = "Invalid email or password"
    MISSING_CREDENTIALS = "Email and password are required"
    UNAUTHORIZED = "You are not authorized to perform this action"
    NOT_FOUND = "Resource not found"
    VALIDATION_ERROR = "Validation error occurred"
    ACCOUNT_DISABLED = "Account is disabled"
    TOKEN_EXPIRED = "Token has expired"
    TOKEN_INVALID = "Invalid token"
    OLD_PASSWORD_INCORRECT = "The old password is incorrect"
    AUTHENTICATION_FAILED = "Authentication failed"
    PERMISSION_DENIED = "Permission denied"
    SERVER_ERROR = "An internal server error occurred"
    BAD_REQUEST = "Bad request"
    USER_ALREADY_EXISTS = "A user with this email already exists"
    EMAIL_NOT_VERIFIED = "Email address is not verified"
    TOKEN_REFRESH_FAILED = "Token refresh failed"
    TOKEN_VALIDATION_FAILED = "Token validation failed"
    USER_NOT_FOUND = "User not found"
