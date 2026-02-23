from datetime import datetime, timedelta
from passlib.context import CryptContext


# Bcrypt configuration for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies that a plain password matches the hashed version."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hashes a password using bcrypt."""
    return pwd_context.hash(password)


def create_access_token(subject: str | int, expires_delta: timedelta | None = None) -> str:
    """
    [STUB] Creates a JWT access token.
    Implement JWT encoding logic here later.
    """
    # TODO: Implement JWT encoding (e.g., using python-jose)
    return "stub_access_token"

def create_refresh_token(subject: str | int, expires_delta: timedelta | None = None) -> str:
    """
    [STUB] Creates a JWT refresh token.
    Implement JWT encoding logic here later.
    """
    # TODO: Implement JWT encoding (e.g., using python-jose)
    return "stub_refresh_token"
