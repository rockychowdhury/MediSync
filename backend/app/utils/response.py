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
    PASSWORD_RESET_EMAIL_SENT = "Password reset email sent successfully"
    PASSWORD_RESET_SUCCESS = "Password reset successfully"

    # Profile
    PROFILE_UPDATED = "Profile updated successfully"
    PROFILE_RETRIEVED = "Profile retrieved successfully"

    # Provider Management
    PROVIDER_CREATED = "Provider profile created successfully"
    PROVIDER_UPDATED = "Provider profile updated successfully"
    PROVIDER_DELETED = "Provider profile deleted successfully"
    PROVIDER_RETRIEVED = "Provider retrieved successfully"
    PROVIDER_NOT_FOUND = "Provider not found"
    PROVIDER_AVAILABILITY_UPDATED = "Provider availability updated successfully"
    PROVIDER_CAPACITY_REACHED = "Provider has reached maximum daily capacity"

    # Service Catalog Management
    SERVICE_CREATED = "Service created successfully"
    SERVICE_UPDATED = "Service updated successfully"
    SERVICE_DELETED = "Service deleted successfully"
    SERVICE_RETRIEVED = "Service retrieved successfully"
    SERVICE_NOT_FOUND = "Service not found"

    # Appointment Management
    APPOINTMENT_BOOKED = "Appointment booked successfully"
    APPOINTMENT_UPDATED = "Appointment updated successfully"
    APPOINTMENT_CANCELLED = "Appointment cancelled successfully"
    APPOINTMENT_RESCHEDULED = "Appointment rescheduled successfully"
    APPOINTMENT_RETRIEVED = "Appointment retrieved successfully"
    APPOINTMENT_NOT_FOUND = "Appointment not found"
    APPOINTMENT_CONFLICT = "Time slot is already booked or provider is unavailable"
    APPOINTMENT_CHECKED_IN = "Patient checked-in successfully"
    APPOINTMENT_CHECKED_OUT = "Patient checked-out successfully"
    APPOINTMENT_NO_SHOW = "Appointment marked as no-show"

    # Waitlist & Queue Management
    ADDED_TO_WAITLIST = "Successfully added to the waitlist"
    REMOVED_FROM_WAITLIST = "Successfully removed from the waitlist"
    WAITLIST_ASSIGNED = "Appointment assigned from waitlist successfully"
    WAITLIST_RETRIEVED = "Waitlist retrieved successfully"

    # Dashboard & Analytics
    DASHBOARD_DATA_RETRIEVED = "Dashboard data retrieved successfully"
    REPORT_GENERATED = "Report generated successfully"

    # Notifications
    NOTIFICATION_SENT = "Notification sent successfully"
    NOTIFICATION_PREFERENCES_UPDATED = "Notification preferences updated successfully"

    # General
    CREATED_SUCCESS = "Created successfully"
    UPDATED_SUCCESS = "Updated successfully"
    DELETED_SUCCESS = "Deleted successfully"
    RETRIEVED_SUCCESS = "Data retrieved successfully"
    OPERATION_SUCCESSFUL = "Operation successful"

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
