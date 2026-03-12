from app.crud.base import CRUDBase
from app.crud.crud_user import user
from app.crud.crud_activity_log import activity_log
from app.crud.crud_patient import patient
from app.crud.crud_rbac import role, permission
from app.crud.crud_specialization import specialization
from app.crud.crud_service import service
from app.crud.crud_provider import provider

__all__ = ["CRUDBase", "user", "activity_log", "patient", "role", "permission", "specialization", "service", "provider"]
