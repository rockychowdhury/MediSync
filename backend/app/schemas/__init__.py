"""
MediSync — Pydantic Schema Registry

All schemas are imported here for convenient access:
    from app.schemas import UserCreate, UserResponse, ...
"""

# ── RBAC ──
from app.schemas.role import (  # noqa: F401
    RoleCreate,
    RoleResponse,
    RoleWithPermissions,
    PermissionCreate,
    PermissionResponse,
)

# ── Users & Patients ──
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserWithRole  # noqa: F401
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse  # noqa: F401

# ── Specializations & Services ──
from app.schemas.specialization import (  # noqa: F401
    SpecializationCreate,
    SpecializationResponse,
)
from app.schemas.service import (  # noqa: F401
    ServiceCreate,
    ServiceUpdate,
    ServiceResponse,
    ServiceWithSpecialization,
)

# ── Providers ──
from app.schemas.provider import (  # noqa: F401
    ProviderCreate,
    ProviderUpdate,
    ProviderResponse,
    ProviderWithDetails,
)
from app.schemas.availability import (  # noqa: F401
    AvailabilityCreate,
    AvailabilityUpdate,
    AvailabilityResponse,
)
from app.schemas.provider_time_off import (  # noqa: F401
    ProviderTimeOffCreate,
    ProviderTimeOffUpdate,
    ProviderTimeOffResponse,
)

# ── Appointments ──
from app.schemas.appointment import (  # noqa: F401
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentStatusUpdate,
    AppointmentResponse,
)

# ── Waitlist ──
from app.schemas.waitlist import (  # noqa: F401
    WaitlistCreate,
    WaitlistUpdate,
    WaitlistResponse,
)

# ── Notifications ──
from app.schemas.notification import NotificationCreate, NotificationResponse  # noqa: F401

# ── Audit ──
from app.schemas.activity_log import (  # noqa: F401
    ActivityLogCreate,
    ActivityLogResponse,
)
