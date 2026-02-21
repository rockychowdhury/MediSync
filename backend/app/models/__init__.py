"""
MediSync — SQLAlchemy Model Registry

All models are imported here so that:
  1. Alembic can auto-detect them for migration generation
  2. Other modules can do `from app.models import User, Provider, ...`
"""

# ── RBAC ──
from app.models.role import Role, Permission, role_permissions  # noqa: F401

# ── Users & Patients ──
from app.models.user import User  # noqa: F401
from app.models.patient import Patient  # noqa: F401

# ── Specializations & Services ──
from app.models.specialization import Specialization  # noqa: F401
from app.models.service import Service  # noqa: F401

# ── Providers ──
from app.models.provider import Provider  # noqa: F401
from app.models.provider_service import provider_services  # noqa: F401
from app.models.availability import Availability  # noqa: F401
from app.models.provider_time_off import ProviderTimeOff  # noqa: F401

# ── Appointments ──
from app.models.appointment import Appointment  # noqa: F401

# ── Waitlist ──
from app.models.waitlist import Waitlist  # noqa: F401

# ── Notifications ──
from app.models.notification import Notification  # noqa: F401

# ── Audit ──
from app.models.activity_log import ActivityLog  # noqa: F401
