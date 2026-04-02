from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import jwt
from fastapi import Response

from app.core.config import settings
from app.models.user import User

class JWTAuthManager:
    """Handles JWT token generation, validation, and cookie management."""

    # Token expiration times
    ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    REFRESH_TOKEN_EXPIRE_DAYS = 7

    # Cookie settings
    ACCESS_COOKIE_NAME = "access_token"
    REFRESH_COOKIE_NAME = "refresh_token"
    COOKIE_SECURE = not settings.DEBUG  # False (http) in dev, True (https) in prod
    COOKIE_SAMESITE = "lax"  # Browser-default for same-domain cross-port (localhost:3000 -> 8000)

    @classmethod
    def generate_token_pair(cls, user_id: Any, role_id: int) -> Tuple[str, str]:
        """Generates a new access and refresh token pair."""
        access_token = cls._generate_access_token(user_id, role_id)
        refresh_token = cls._generate_refresh_token(user_id, role_id)
        return access_token, refresh_token

    @classmethod
    def _generate_access_token(cls, user_id: Any, role_id: int) -> str:
        """Generates a short-lived access token."""
        expire = datetime.now(timezone.utc) + timedelta(minutes=cls.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {
            "sub": str(user_id),
            "role": role_id,
            "type": "access",
            "exp": expire
        }
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    @classmethod
    def _generate_refresh_token(cls, user_id: Any, role_id: int) -> str:
        """Generates a long-lived refresh token."""
        expire = datetime.now(timezone.utc) + timedelta(days=cls.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode = {
            "sub": str(user_id),
            "role": role_id,
            "type": "refresh",
            "exp": expire
        }
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    @classmethod
    def validate_token(cls, token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
        """
        Validates a JWT token.
        Returns the decoded payload if valid and of the correct type, else None.
        """
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != token_type:
                return None
            return payload
        except jwt.PyJWTError:
            return None

    @classmethod
    def set_auth_cookies(cls, response: Response, access_token: str, refresh_token: str):
        """Sets HTTPOnly cookies for the tokens."""
        response.set_cookie(
            key=cls.ACCESS_COOKIE_NAME,
            value=access_token,
            httponly=True,
            secure=cls.COOKIE_SECURE,
            samesite=cls.COOKIE_SAMESITE,
            max_age=cls.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
        response.set_cookie(
            key=cls.REFRESH_COOKIE_NAME,
            value=refresh_token,
            httponly=True,
            secure=cls.COOKIE_SECURE,
            samesite=cls.COOKIE_SAMESITE,
            max_age=cls.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        )

    @classmethod
    def clear_auth_cookies(cls, response: Response):
        """Clears auth cookies."""
        response.delete_cookie(
            key=cls.ACCESS_COOKIE_NAME,
            secure=cls.COOKIE_SECURE,
            httponly=True,
            samesite=cls.COOKIE_SAMESITE,
        )
        response.delete_cookie(
            key=cls.REFRESH_COOKIE_NAME,
            secure=cls.COOKIE_SECURE,
            httponly=True,
            samesite=cls.COOKIE_SAMESITE,
        )
