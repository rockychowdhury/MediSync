from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.

    All models must be imported before Alembic can detect them.
    See app/models/__init__.py for the central import registry.
    """
    pass
