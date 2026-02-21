"""
Application-wide FastAPI dependencies.

Re-exports the database session dependency from its canonical location.
"""

from app.db.session import get_db  # noqa: F401

__all__ = ["get_db"]
