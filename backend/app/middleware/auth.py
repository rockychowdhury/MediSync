from typing import Callable, Awaitable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.auth import JWTAuthManager
from app.utils.response import APIResponse

class JWTAuthenticationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        access_token = request.cookies.get(JWTAuthManager.ACCESS_COOKIE_NAME)
        refresh_token = request.cookies.get(JWTAuthManager.REFRESH_COOKIE_NAME)

        # Set token in state for routes to access
        request.state.user_payload = None
        new_tokens = None

        if access_token:
            payload = JWTAuthManager.validate_token(access_token, "access")
            if payload:
                request.state.user_payload = payload
            elif refresh_token:
                # Access token might be expired. Let's try refresh.
                payload = JWTAuthManager.validate_token(refresh_token, "refresh")
                if payload:
                    # Valid refresh token -> issue new access & refresh tokens
                    user_id = int(payload.get("sub"))
                    role_id = int(payload.get("role"))
                    new_access, new_refresh = JWTAuthManager.generate_token_pair(user_id, role_id)
                    new_tokens = (new_access, new_refresh)
                    
                    # Also set state so current request can proceed
                    # We create a pseudo access payload for the state
                    request.state.user_payload = {
                        "sub": str(user_id),
                        "role": role_id,
                        "type": "access"
                    }

        # Instead of rejecting here, we let the route's dependencies (e.g. `get_current_user` / `require_permissions`) 
        # decide if auth is actually required for the current path.
        # This way public routes aren't blocked.
        response = await call_next(request)

        # If new tokens were generated, attach cookies to response
        if new_tokens:
            JWTAuthManager.set_auth_cookies(response, new_tokens[0], new_tokens[1])

        return response
