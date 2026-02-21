"""
CRUD — Data Access Layer

This package contains database operation classes for each model.
Each module should provide a class inheriting from CRUDBase
with model-specific queries.

Usage:
    from app.crud.base import CRUDBase
    from app.models.user import User
    from app.schemas.user import UserCreate, UserUpdate

    class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
        # Add custom queries here
        pass

    user_crud = CRUDUser(User)
"""
