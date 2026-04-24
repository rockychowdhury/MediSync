# MediSync — Complete Project Architecture Memory

> **Last Updated:** 2026-04-24 | **Audit Scope:** Full codebase (backend + frontend + project plan)

---

## 1. Project Overview

**MediSync** is a full-stack healthcare appointment management system for clinics. It optimizes provider schedules, reduces no-shows, and manages patient flow via intelligent queue/waitlist management.

| Layer | Stack | Entry Point |
|-------|-------|-------------|
| **Backend** | FastAPI 0.115 · Python 3.12 · SQLAlchemy 2 · PostgreSQL · Alembic · Upstash Redis | `backend/app/main.py` |
| **Frontend** | Next.js 16 · React 19 · Redux Toolkit · Tailwind 4 · shadcn/ui · Recharts · Framer Motion | `frontend/src/app/layout.tsx` |
| **Infra** | Docker Compose (API + Postgres) · Alembic migrations · `pre-start.sh` | `backend/docker-compose.yml` |

**Repo:** `github.com/rockychowdhury/MediSync`

---

## 2. Backend Architecture

### 2.1 Directory Map

```
backend/app/
├── main.py                  # FastAPI app factory, CORS, middleware, routers
├── core/
│   ├── config.py            # Pydantic Settings (DB, JWT, CORS, Redis, Mail)
│   ├── auth.py              # JWTAuthManager — token gen, cookie management
│   ├── security.py          # bcrypt password hashing (passlib)
│   └── permissions.py       # SystemPermission enum + PermissionChecker dep
├── api/
│   ├── deps.py              # get_db, get_current_user, PermissionChecker, role guards
│   └── v1/
│       ├── router.py        # Central v1 router — mounts all sub-routers
│       ├── auth.py          # login, logout, forgot/reset password
│       ├── users.py         # Admin CRUD for system users
│       ├── profile.py       # Self-service profile & password
│       ├── patients.py      # Patient CRUD
│       ├── providers.py     # Provider profile, services, stats
│       ├── appointments.py  # Booking, status transitions, bulk, reschedule, export
│       ├── waitlist.py      # Queue management, auto-schedule, analytics
│       ├── availability.py  # Provider weekly schedule CRUD
│       ├── services.py      # Service catalog CRUD
│       ├── specializations.py # Specialization lookup CRUD
│       ├── rbac.py          # Role & permission management
│       ├── dashboard.py     # KPI summary, utilisation, heatmap, trends
│       ├── activity_logs.py # Audit trail queries
│       ├── provider_time_off.py # Leave requests + approval workflow
│       └── websocket.py     # WS endpoint for real-time channels
├── models/                  # SQLAlchemy 2.0 mapped models (see §3)
├── schemas/                 # Pydantic v2 request/response schemas
├── crud/                    # Generic CRUDBase + per-model CRUD classes
├── services/                # Business logic layer (see §2.3)
├── middleware/
│   ├── auth.py              # JWTAuthenticationMiddleware (silent refresh)
│   └── error_handler.py     # Global exception handlers + custom exceptions
├── utils/
│   ├── mixins.py            # UUIDMixin, TimeStampMixin, SoftDeleteMixin
│   ├── redis.py             # Upstash Redis client init
│   └── response.py          # APIResponse helper + ResponseMessages constants
└── db/
    ├── base.py              # DeclarativeBase
    ├── session.py           # Engine + SessionLocal + get_db generator
    └── seed.py              # Permissions, Roles, Admin user seeding
```

### 2.2 Authentication & Authorization Flow

```
Login → POST /api/v1/auth/login (OAuth2 form)
  ↓ verify password (bcrypt) + check account lockout
  ↓ generate access_token (30min) + refresh_token (7d) via HS256 JWT
  ↓ set HTTPOnly cookies (access_token, refresh_token)
  → return user profile + role info

Every Request → JWTAuthenticationMiddleware
  ↓ extract cookies → validate access_token
  ↓ if expired: silent refresh via refresh_token → new cookie pair
  ↓ inject request.state.user_payload = {sub, role, type}

Protected Endpoints → Depends(get_current_active_user)
  ↓ reads request.state.user_payload → loads User from DB
  ↓ checks is_active, not locked

Permission-Gated → Depends(PermissionChecker("appointments:manage"))
  ↓ loads user.role.permissions from DB (selectin eager)
  ↓ checks required permission name exists in set
```

**Key Security Details:**
- Cookies: `httponly=True`, `samesite=lax`, `secure=True` (prod), `path=/`
- Brute force: 5 failed attempts → 15min lockout (`locked_until` field)
- Password reset: UUID token stored in Redis (Upstash) with 5min TTL, single-use

**Seeded Roles & Permissions:**

| Role | Permissions |
|------|------------|
| `admin` | ALL 11 permissions |
| `receptionist` | `users:read`, `patients:read/manage`, `appointments:read/manage`, `providers:read` |
| `provider` | `patients:read`, `appointments:read/manage`, `providers:read` |

### 2.3 Service Layer

| Service | Key Responsibilities |
|---------|---------------------|
| `AppointmentService` | Create with conflict check, status state machine, bulk updates, reschedule (cancel+rebook), slot availability calc |
| `WaitlistService` | Add/cancel entries, auto-promote on slot freed, manual assign, daily stats, analytics, expire stale entries |
| `SchedulingService` | Conflict detection (capacity, overlap, time-off, working hours, breaks), eligible provider finder, round-robin & ETA selection |
| `DashboardService` | Summary KPIs, provider utilisation, hourly heatmap, service demand, no-show trend |
| `UserService` | CRUD with audit logging, activate/deactivate/soft-delete, password management |
| `PatientService` | CRUD with duplicate detection (name+DOB+email), audit logging |
| `EmailService` | Debug mode (save to file) / prod SMTP, password reset & activation templates |
| `RedisTokenService` | Store/verify ephemeral reset tokens in Upstash Redis (5min TTL) |
| `WebSocketManager` | Channel-based pub/sub, multi-channel broadcast, dead socket cleanup, sync→async bridge |

**Appointment Status State Machine:**
```
scheduled → checked_in → in_progress → completed
    ↓           ↓            ↓             ↓
 cancelled   cancelled    cancelled     cancelled
    ↓
 no_show → scheduled (recovery)
cancelled → scheduled (recovery)
no_show → checked_in (recovery)
```

### 2.4 WebSocket Channels

| Channel Pattern | Purpose |
|----------------|---------|
| `dashboard:global` | All dashboard-relevant events |
| `provider:{id}` | Provider-specific appointment events |
| `queue:{id}` | Queue board updates per provider |
| `waitlist:{service_id}` | Waitlist changes per service |

### 2.5 CRUD Layer Pattern

`CRUDBase[Model, CreateSchema, UpdateSchema]` provides generic `get`, `get_multi`, `create`, `update`, `delete`. Extended per-model with:
- `crud_user`: `get_by_email`, `authenticate`, password hashing on create/update
- `crud_appointment`: `create_with_number` (auto-gen APT-YYYYMMDD-NNN), capacity metrics, stats, CSV export
- `crud_waitlist`: `create` with auto queue_position, `recalculate_queue_positions`, ordered waitlist queries
- `crud_patient`: `get_by_identity` (duplicate check)
- `crud_provider`: service assignment, stats aggregation

---

## 3. Data Model (ERD Summary)

### 3.1 Base Patterns

| Mixin | Columns |
|-------|---------|
| `UUIDMixin` | `id` VARCHAR(36) PK, default uuid4 |
| `TimeStampMixin` | `created_at`, `updated_at` TIMESTAMPTZ |
| `SoftDeleteMixin` | `is_active` BOOL, `deleted_at` TIMESTAMPTZ |
| `BaseModel` | All three above (abstract) |

### 3.2 Entity Models

| Model | Table | PK Type | Inherits | Key Fields |
|-------|-------|---------|----------|------------|
| `User` | `users` | UUID | BaseModel | name, email (unique), password_hash, role_id FK, security fields (lockout, reset) |
| `Role` | `roles` | INT auto | Base | name (unique), M2M→permissions via `role_permissions` |
| `Permission` | `permissions` | INT auto | Base | name (unique, e.g. "appointments:manage") |
| `Patient` | `patients` | UUID | BaseModel | name, phone, email, dob, gender, notification_opt_out |
| `Provider` | `providers` | UUID=users.id | TimeStamp+SoftDelete+Base | specialization_id FK, consultation_fee, emergency_enabled, max_daily(8), status |
| `Specialization` | `specializations` | INT auto | Base | name (unique) |
| `Service` | `services` | UUID | BaseModel | name, duration_minutes, buffer_time, required_specialization FK, fee, billing_code |
| `Availability` | `availability` | INT auto | Base | provider_id FK, day_of_week(0=Sun), start/end_time, break times, is_working_day |
| `ProviderTimeOff` | `provider_time_off` | INT auto | Base | provider_id FK, date range, approval workflow (approved_by, rejected_by, status) |
| `Appointment` | `appointments` | UUID | TimeStamp+Base | patient/provider/service/created_by FKs, start/end TIMESTAMPTZ, status, priority, reminder tracking, assigned_from_waitlist |
| `Waitlist` | `waitlist` | UUID | TimeStamp+Base | patient/service FKs, optional provider FK, priority, queue_position, status, assignment_method |
| `Notification` | `notifications` | UUID | Base | recipient polymorphic, appointment/waitlist FKs, channel(email/sms), type, status, retry tracking |
| `ActivityLog` | `activity_logs` | BIGINT auto | Base | user_id FK, action_type, entity_type/id, old/new_values JSONB, ip_address |

### 3.3 Key Relationships

```
User 1←→1 Provider (extension table, shared PK)
User N←→1 Role ←M2M→ Permission
Provider N←→1 Specialization
Provider ←M2M→ Service (via provider_services)
Provider 1←→N Availability
Provider 1←→N ProviderTimeOff
Appointment N←→1 Patient, Provider, Service, User(created_by)
Waitlist N←→1 Patient, Service; N←→0..1 Provider, Appointment
Notification N←→0..1 Appointment, Waitlist
ActivityLog N←→0..1 User
```

### 3.4 Composite Indexes

- `ix_appointments_conflict`: (provider_id, appointment_start, appointment_end)
- `ix_appointments_status_start`: (status, appointment_start)
- `ix_waitlist_queue_order`: (status, priority, queue_position, created_at)
- `ix_waitlist_slot_match`: (service_id, provider_id)
- `ix_activity_logs_entity`: (entity_type, entity_id)

---

## 4. API Surface (V1)

### 4.1 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | None | OAuth2 form login → set cookies |
| POST | `/auth/logout` | User | Clear cookies |
| POST | `/auth/forgot-password` | None | Email reset link (Redis token) |
| POST | `/auth/reset-password` | None | Verify Redis token + set new password |

### 4.2 Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile/me` | User | Current user profile + role info |
| PUT | `/profile/me` | User | Update own name/email |
| PUT | `/profile/me/password` | User | Change own password (old required) |

### 4.3 Core Resources (CRUD)

| Resource | Endpoints | Required Permission |
|----------|-----------|-------------------|
| Users | GET/POST/PUT/DELETE `/users/` | `users:manage` |
| Patients | GET/POST/PUT/DELETE `/patients/` | `patients:read/manage` |
| Providers | GET/POST/PUT/DELETE `/providers/` | `providers:read/manage` |
| Services | GET/POST/PUT/DELETE `/services/` | (various) |
| Specializations | GET/POST/PUT/DELETE `/specializations/` | (various) |

### 4.4 Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/appointments/` | List with filters (status, date, provider, patient) |
| POST | `/appointments/` | Book (conflict check + auto-number) |
| PUT | `/appointments/{id}/status` | State machine transition |
| POST | `/appointments/{id}/reschedule` | Cancel + rebook atomically |
| POST | `/appointments/bulk-status` | Batch status update |
| GET | `/appointments/stats/today` | Today's counts + hourly |
| GET | `/appointments/export` | CSV download |

### 4.5 Waitlist & Queue

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/waitlist/` | Filtered, priority-ordered queue |
| POST | `/waitlist/` | Add entry (auto queue position) |
| PUT | `/waitlist/{id}/cancel` | Cancel entry + reposition |
| POST | `/waitlist/{id}/assign` | Manual assign to appointment |
| GET | `/waitlist/stats/today` | Daily KPIs |
| GET | `/waitlist/analytics` | Period analytics |

### 4.6 Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/summary` | All KPIs, alerts, trends |
| GET | `/dashboard/provider-utilisation` | Provider capacity grid |
| GET | `/dashboard/appointments-by-hour` | Heatmap data |
| GET | `/dashboard/service-demand` | Top services chart data |
| GET | `/dashboard/no-show-trend` | Trend line data |

### 4.7 Other

- **RBAC:** Full role/permission CRUD at `/rbac/`
- **Availability:** Provider schedule CRUD at `/availability/`
- **Time-Off:** Request + approval workflow at `/time-off/`
- **Activity Logs:** Filterable audit trail at `/activity-logs/`
- **WebSocket:** `WS /ws/{channel}` with token auth

### 4.8 Standardized Response Format

```json
// Success
{ "success": true, "message": "...", "data": {...}, "meta": {} }

// Error
{ "success": false, "message": "...", "errors": [...], "error_code": "..." }

// Paginated
{ "success": true, "data": [...], "meta": { "pagination": { "total", "skip", "limit" } } }
```

---

## 5. Frontend Architecture

### 5.1 Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| Next.js | 16.2.1 | App Router, SSR, API proxy (rewrites) |
| React | 19.2.4 | UI with React Compiler enabled |
| Redux Toolkit | 2.11 | Global state (auth, UI) |
| Tailwind CSS | 4 | Utility-first styling |
| shadcn/ui | 4.1 | 27 Radix-based UI components |
| Axios | 1.13 | HTTP client with interceptors |
| Recharts | 3.8 | Dashboard charts |
| Framer Motion | 12.38 | Animations |
| React Hook Form + Zod | 7.72 / 4.3 | Form validation |
| date-fns | 4.1 | Date formatting |
| Lucide React | 1.0 | Icon set |
| sonner | 2.0 | Toast notifications |

### 5.2 Directory Structure

```
frontend/src/
├── app/
│   ├── layout.tsx              # Root: fonts (Inter+Montserrat), ReduxProvider, AuthObserver
│   ├── page.tsx                # Landing/home page
│   ├── globals.css             # Tailwind base + custom styles
│   ├── (public)/               # Auth pages (no dashboard layout)
│   │   ├── layout.tsx          # Public page shell
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   └── dashboard/
│       ├── layout.tsx          # Dashboard shell: sidebar + topbar + role-based nav
│       ├── admin/
│       │   ├── page.tsx        # Admin overview (KPIs, charts, activity feed)
│       │   ├── components/     # Dashboard-specific components
│       │   ├── appointments/   # Appointment management page
│       │   ├── patients/       # Patient management page
│       │   ├── providers/      # Provider management page
│       │   ├── services/       # Service & specialization management
│       │   ├── waitlist/       # Queue management page
│       │   ├── users/          # User management page
│       │   ├── rbac/           # Role & permission management
│       │   └── audit/          # Activity log viewer
│       ├── provider/page.tsx   # Provider dashboard (schedule view)
│       └── receptionist/page.tsx # Receptionist dashboard (queue view)
├── components/
│   ├── auth/                   # AuthObserver, ProtectedRoute
│   ├── common/                 # MediSyncLogo, shared components
│   ├── dashboard/              # Dashboard feature components (8 subdirs)
│   ├── home/                   # Landing page components
│   ├── layout/                 # Navbar, Footer
│   ├── providers/              # ReduxProvider wrapper
│   └── ui/                     # 27 shadcn components
├── config/
│   ├── env.ts                  # Environment variable access
│   ├── navigation.ts           # Role-based nav groups (admin/receptionist/provider)
│   └── site.ts                 # Site config (name, apiUrl, timeout, demo creds)
├── hooks/
│   ├── useDebounce.ts          # Debounced value hook
│   └── useWebSocket.ts         # WS connection with auto-reconnect
├── lib/
│   ├── api/                    # 16 API client modules (axios-based)
│   │   ├── client.ts           # Axios instance: baseURL=/api/v1, withCredentials
│   │   ├── auth.ts             # login, logout, me, forgot/reset password
│   │   ├── appointments.ts     # CRUD + status + reschedule + stats + export
│   │   ├── dashboard.ts        # summary, utilisation, heatmap, trends
│   │   ├── providers.ts, patients.ts, users.ts, services.ts, etc.
│   │   └── index.ts            # Barrel export
│   ├── hooks/                  # Additional hooks
│   ├── utils/                  # Helper utilities
│   ├── utils.ts                # cn() helper (clsx + tailwind-merge)
│   └── validations/            # Zod schemas for forms
├── store/
│   ├── index.ts                # Redux store config
│   ├── hooks.ts                # Typed useAppSelector/useAppDispatch
│   └── slices/
│       ├── authSlice.ts        # user, isAuthenticated, isLoading, token
│       └── uiSlice.ts          # UI state (sidebar, modals)
└── types/
    ├── index.ts                # Barrel export
    ├── user.ts                 # User, UserRole, UserStatus
    ├── api.ts                  # ApiResponse<T>, PaginatedResponse<T>, ApiError
    ├── appointment.ts          # Appointment, AppointmentStatus, AppointmentPriority
    ├── provider.ts, service.ts, queue.ts, schedule.ts, analytics.ts, audit.ts
```

### 5.3 Auth Flow (Frontend)

```
App Mount → AuthObserver (runs once per session)
  ↓ GET /api/v1/profile/me (cookies sent automatically)
  ↓ Success: dispatch(setCredentials({user, token}))
  ↓         if on public route → redirect to /dashboard/{role}
  ↓ Failure (401): dispatch(logoutAction())
  ↓         if on protected route → redirect to /login

Login Page → POST /api/v1/auth/login (form-urlencoded)
  ↓ Backend sets HTTPOnly cookies in response
  ↓ AuthObserver picks up on next /profile/me call
```

**Public Routes:** `/`, `/login`, `/forgot-password`, `/reset-password`

### 5.4 API Proxy

Next.js rewrites `/api/v1/:path*` → `http://127.0.0.1:8000/api/v1/:path*`. All frontend API calls go through this proxy, avoiding CORS issues in development.

### 5.5 Dashboard Layout

The dashboard shell (`dashboard/layout.tsx`) provides:
- **Sidebar:** Role-based navigation groups (Core/Operations/Governance for admin)
- **Topbar:** Mobile hamburger, search bar (⌘K), notifications bell, user avatar
- **Content area:** Max-width 1400px, custom scrollbar, TooltipProvider
- **Logout:** Calls `authApi.logout()` then dispatches `logoutAction()` + redirect

**Navigation by Role:**

| Role | Groups | Pages |
|------|--------|-------|
| Admin | Core (Overview), Operations (Appointments, Patients, Providers, Services, Waitlist), Governance (Users, RBAC, Audit) | 9 pages |
| Receptionist | Core (Queue), Operations (Appointments, Patients, Waitlist) | 4 pages |
| Provider | Core (Schedule), Operations (Availability) | 2 pages |

### 5.6 WebSocket Hook

`useWebSocket({ channel, onMessage, enabled, token })` — connects to `ws://localhost:8000/api/v1/ws/{channel}`, auto-reconnects on abnormal close (5s delay), cleans up on unmount.

---

## 6. Environment Configuration

### 6.1 Backend (.env)

```
DATABASE_URL=postgresql://user:pass@host/dbname
SECRET_KEY=...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:3000
DEBUG=true
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...
MAIL_SERVER / MAIL_PORT / MAIL_FROM / MAIL_USERNAME / MAIL_PASSWORD
INIT_ADMIN_EMAIL / INIT_ADMIN_PASSWORD
```

### 6.2 Frontend (.env.local)

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_DEMO_EMAIL / NEXT_PUBLIC_DEMO_PASSWORD
```

---

## 7. Project Plan Documentation

25 markdown files in `Project Plan/` covering every page spec:

| Document | Content |
|----------|---------|
| `overview.md` (57KB) | Admin Dashboard Overview — full spec with layout, KPIs, charts, WS integration, API contracts |
| `appointmentUI.md` (68KB) | Appointment management page — list/calendar views, booking modal, status flow |
| `patient.md` (57KB) | Patient management — CRUD, search, history |
| `providermanagement.md` (69KB) | Provider management — profiles, services, availability, time-off |
| `waitlist.md` (73KB) | Waitlist/queue — priority ordering, auto/manual assignment |
| `rbac.md` (42KB) | Role & permission management UI |
| `providerDashboard.md` (55KB) | Provider-role dashboard spec |
| `receptionistDashboard.md` (55KB) | Receptionist-role dashboard spec |
| `dashboard.md` (27KB) | Dashboard layout & navigation spec |
| `authpage.md` (18KB) | Login/forgot/reset password pages |
| `mediqueue_homepage_guide.md` (24KB) | Landing page design guide |
| `implementation_plan.md` (6KB) | Phase-based implementation roadmap |
| `MediSync_DB_Schema.md` (20KB) | Database schema documentation |
| `apis.md` (6KB) | API endpoint summary |
| `backend_readiness_report.md` (7KB) | Backend implementation status |

---

## 8. Known Issues & Notes

1. **Duplicate singleton:** `appointment_service = AppointmentService()` is instantiated twice at bottom of `appointment_service.py` (line 407 and 410)
2. **Missing import:** `appointment_service.py` line 365 uses `func.date()` but `func` is not imported (imported in other services but not this one)
3. **Dashboard avg_wait_minutes:** Hardcoded placeholder `23` in `dashboard_service.py` line 130
4. **Time-off admin endpoint:** The project plan flags that admins need a cross-provider time-off listing endpoint (§13.6 of overview.md) — currently scoped per-provider only
5. **Waitlist notification:** `notifications.ts` API client exists but notification sending logic is not yet wired in the waitlist auto-promotion flow
6. **React Compiler:** Enabled in `next.config.ts` (`reactCompiler: true`) — requires `babel-plugin-react-compiler` (installed)

---

## 9. Quick Reference — File Locations

| Need to... | File |
|------------|------|
| Add a new API endpoint | `backend/app/api/v1/` + register in `router.py` |
| Add a new DB model | `backend/app/models/` + import in `models/__init__.py` |
| Add a new Pydantic schema | `backend/app/schemas/` |
| Add a new service | `backend/app/services/` |
| Add a new CRUD module | `backend/app/crud/` + register in `crud/__init__.py` |
| Add a frontend API client | `frontend/src/lib/api/` + export in `index.ts` |
| Add a new dashboard page | `frontend/src/app/dashboard/{role}/` + nav in `dashboard/layout.tsx` |
| Add a new Redux slice | `frontend/src/store/slices/` + add to `store/index.ts` |
| Add a new TypeScript type | `frontend/src/types/` + re-export in `index.ts` |
| Add a UI component | `frontend/src/components/ui/` (shadcn) or feature-specific dir |
| Modify permissions | `backend/app/core/permissions.py` + `db/seed.py` |
| Run migrations | `alembic revision --autogenerate` then `alembic upgrade head` |
| Seed database | `python -m app.db.seed` |
