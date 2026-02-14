from app.db.base import Base
from app.utils.mixins import UUIDMixin, TimeStampMixin, SoftDeleteMixin


class BaseModel(UUIDMixin, TimeStampMixin, SoftDeleteMixin, Base):
    """
    Abstract base model that all application models should inherit from.

    Provides:
      - UUID primary key  (from UUIDMixin)
      - created_at / updated_at timestamps  (from TimeStampMixin)
      - is_deleted / deleted_at soft-delete  (from SoftDeleteMixin)
    """

    __abstract__ = True
