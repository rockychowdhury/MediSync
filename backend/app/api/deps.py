"""
Application-wide FastAPI dependencies.

Provides database session management and user authentication logic.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Annotated

from app.db.session import get_db
from app.models.user import User

__all__ = ["get_db", "get_current_user"]

# The URL where clients send username/password to get a token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db)
) -> User:
    """
    [STUB] Decodes the JWT token and fetches the current user from the database.
    Implement JWT decoding and error handling logic here later.
    """
    # TODO: Decode token, validate expiry, extract user ID (e.g. using python-jose)
    # Then query db to fetch the actual user.
    # Ex:
    # try:
    #     payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    #     user_id: str = payload.get("sub")
    #     if user_id is None:
    #         raise AuthException()
    # except JWTError:
    #     raise AuthException()
    
    # user = crud.user.get(db, id=user_id)
    # if not user:
    #     raise AuthException()
    # return user
    
    # Stub response representing a fallback/unimplemented block
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="get_current_user decoding logic is stubbed out. Please implement."
    )
