from typing import Generator

from app.db.session import SessionLocal


def get_db() -> Generator:
    """
    Dependency that provides a database session.
    Ensures the session is properly closed after each request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
