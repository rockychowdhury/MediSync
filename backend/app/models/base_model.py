from app.db.base import Base
from app.utils.mixins import UUIDMixin, TimeStampMixin, SoftDeleteMixin


class BaseModel(UUIDMixin, TimeStampMixin, SoftDeleteMixin, Base):
    """
    Abstract base model that all soft-deletable application models inherit from.

    Provides:
      - UUID primary key  (from UUIDMixin)
      - created_at / updated_at timestamps  (from TimeStampMixin)
      - is_active / deleted_at soft-delete  (from SoftDeleteMixin)
    """

    __abstract__ = True
