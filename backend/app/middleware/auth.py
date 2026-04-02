from typing import Callable, Awaitable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.auth import JWTAuthManager
from app.utils.response import APIResponse

class JWTAuthenticationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        # 1. Attempt token extraction from cookies
        access_token = request.cookies.get(JWTAuthManager.ACCESS_COOKIE_NAME)
        refresh_token = request.cookies.get(JWTAuthManager.REFRESH_COOKIE_NAME)

        # 2. Initialize default state
        request.state.user_payload = None
        new_tokens = None

        # 3. Validation Logic
        if access_token:
            payload = JWTAuthManager.validate_token(access_token, "access")
            if payload:
                request.state.user_payload = payload
            elif refresh_token:
                # Access token expired. Attempt silent refresh.
                refresh_payload = JWTAuthManager.validate_token(refresh_token, "refresh")
                if refresh_payload:
                    user_id = refresh_payload.get("sub")
                    role_id = int(refresh_payload.get("role"))
                    
                    # Generate new pair
                    new_access, new_refresh = JWTAuthManager.generate_token_pair(user_id, role_id)
                    new_tokens = (new_access, new_refresh)
                    
                    # Inject payload so current request is authorized immediately
                    request.state.user_payload = {
                        "sub": str(user_id),
                        "role": role_id,
                        "type": "access"
                    }
        elif refresh_token:
             # Case: Only refresh token provided (e.g. access token cleared but session still valid)
             refresh_payload = JWTAuthManager.validate_token(refresh_token, "refresh")
             if refresh_payload:
                user_id = refresh_payload.get("sub")
                role_id = int(refresh_payload.get("role"))
                new_access, new_refresh = JWTAuthManager.generate_token_pair(user_id, role_id)
                new_tokens = (new_access, new_refresh)
                request.state.user_payload = { "sub": str(user_id), "role": role_id, "type": "access" }

        # 4. Proceed to application logic 
        response = await call_next(request)

        # 5. Flush new cookies if they were issued
        if new_tokens:
            JWTAuthManager.set_auth_cookies(response, new_tokens[0], new_tokens[1])

        return response
