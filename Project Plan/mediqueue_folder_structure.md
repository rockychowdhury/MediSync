# MediSync - Project Folder Structure
## Backend (FastAPI) + Frontend (Next.js) Architecture

**Tech Stack:**
- **Backend:** FastAPI + MongoDB + Redis
- **Frontend:** Next.js 14+ (App Router) + Redux Toolkit + Shadcn/ui + Tailwind CSS

---

## Complete Project Structure

```
MediSync/
├── backend/                          # FastAPI Backend
└── frontend/                         # Next.js Frontend
```

---
Backend/
├── venv/                             # Python virtual environment (git-ignored)
├── app/
│   ├── __init__.py
│   ├── main.py                       # FastAPI app entry point
│   │
│   ├── api/                          # API routes
│   │   ├── __init__.py
│   │   ├── deps.py                   # Dependency injection (db session, etc.)
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── router.py             # v1 router aggregator
│   │
│   ├── core/                         # Core configurations
│   │   ├── __init__.py
│   │   └── config.py                 # Pydantic Settings (reads .env)
│   │
│   ├── db/                           # Database layer
│   │   ├── __init__.py
│   │   ├── session.py                # SQLAlchemy engine + SessionLocal
│   │   └── base.py                   # Declarative Base
│   │
│   ├── models/                       # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   └── base_model.py             # Base model using all mixins
│   │
│   ├── schemas/                      # Pydantic request/response schemas
│   │   └── __init__.py
│   │
│   ├── services/                     # Business logic layer
│   │   └── __init__.py
│   │
│   ├── middleware/                    # Custom middleware
│   │   ├── __init__.py
│   │   └── error_handler.py          # Global exception handling middleware
│   │
│   └── utils/                        # Shared utilities
│       ├── __init__.py
│       ├── mixins.py                 # UUIDMixin, TimeStampMixin, SoftDeleteMixin
│       └── response.py              # APIResponse + ResponseMessages
│
├── .env                              # Local env vars (git-ignored)
├── .env.example                      # Checked-in template
├── requirements.txt
├── Dockerfile
└── docker-compose.yml

---




## 1. Backend Folder Structure (FastAPI + MongoDB + Redis)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI application entry point
│   │
│   ├── api/                         # API routes
│   │   ├── __init__.py
│   │   ├── deps.py                  # Dependency injection (auth, db)
│   │   └── v1/                      # API version 1
│   │       ├── __init__.py
│   │       ├── router.py            # Main API router aggregator
│   │       └── endpoints/           # Route handlers
│   │           ├── __init__.py
│   │           ├── auth.py          # Authentication endpoints
│   │           ├── users.py         # User management
│   │           ├── providers.py     # Provider CRUD
│   │           ├── services.py      # Service management
│   │           ├── appointments.py  # Appointment operations
│   │           ├── queue.py         # Waitlist/queue management
│   │           ├── schedules.py     # Provider schedules
│   │           ├── dashboard.py     # Dashboard stats
│   │           ├── analytics.py     # Analytics endpoints
│   │           ├── reports.py       # Report generation
│   │           ├── notifications.py # Notification management
│   │           └── activity_logs.py # Activity logging
│   │
│   ├── core/                        # Core configurations
│   │   ├── __init__.py
│   │   ├── config.py                # Environment & app settings
│   │   ├── security.py              # JWT, password hashing
│   │   └── logging.py               # Logging configuration
│   │
│   ├── db/                          # Database layer
│   │   ├── __init__.py
│   │   ├── mongodb.py               # MongoDB connection & client
│   │   ├── redis_client.py          # Redis connection & operations
│   │   └── init_db.py               # Database initialization & seeding
│   │
│   ├── models/                      # Pydantic models & MongoDB schemas
│   │   ├── __init__.py
│   │   ├── user.py                  # User model & schemas
│   │   ├── provider.py              # Provider model
│   │   ├── service.py               # Service model
│   │   ├── appointment.py           # Appointment model
│   │   ├── queue.py                 # Queue entry model
│   │   ├── schedule.py              # Provider schedule model
│   │   ├── activity_log.py          # Activity log model
│   │   ├── notification.py          # Notification model
│   │   └── common.py                # Common base models & enums
│   │
│   ├── schemas/                     # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── user.py                  # User DTO schemas
│   │   ├── provider.py              # Provider DTO schemas
│   │   ├── service.py               # Service DTO schemas
│   │   ├── appointment.py           # Appointment DTO schemas
│   │   ├── queue.py                 # Queue DTO schemas
│   │   ├── schedule.py              # Schedule DTO schemas
│   │   ├── auth.py                  # Auth request/response schemas
│   │   ├── dashboard.py             # Dashboard response schemas
│   │   └── analytics.py             # Analytics response schemas
│   │
│   ├── services/                    # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py          # Authentication logic
│   │   ├── user_service.py          # User operations
│   │   ├── provider_service.py      # Provider business logic
│   │   ├── service_service.py       # Service management logic
│   │   ├── appointment_service.py   # Appointment logic & conflict detection
│   │   ├── queue_service.py         # Queue management & auto-assignment
│   │   ├── schedule_service.py      # Schedule management
│   │   ├── notification_service.py  # Email/notification sending
│   │   ├── analytics_service.py     # Analytics calculations
│   │   ├── report_service.py        # Report generation
│   │   └── activity_log_service.py  # Activity logging
│   │
│   ├── repositories/                # Data access layer (MongoDB operations)
│   │   ├── __init__.py
│   │   ├── base.py                  # Base repository with CRUD
│   │   ├── user_repository.py       # User data access
│   │   ├── provider_repository.py   # Provider data access
│   │   ├── service_repository.py    # Service data access
│   │   ├── appointment_repository.py # Appointment data access
│   │   ├── queue_repository.py      # Queue data access
│   │   ├── schedule_repository.py   # Schedule data access
│   │   └── activity_log_repository.py # Activity log data access
│   │
│   ├── utils/                       # Utility functions
│   │   ├── __init__.py
│   │   ├── email.py                 # Email sending utilities
│   │   ├── datetime_helpers.py      # Date/time utilities
│   │   ├── validators.py            # Custom validators
│   │   ├── pagination.py            # Pagination helpers
│   │   └── pdf_generator.py         # PDF report generation
│   │
│   ├── middleware/                  # Custom middleware
│   │   ├── __init__.py
│   │   ├── auth_middleware.py       # JWT validation middleware
│   │   ├── error_handler.py         # Global error handling
│   │   └── rate_limiter.py          # Rate limiting middleware
│   │
│   └── tests/                       # Test suite
│       ├── __init__.py
│       ├── conftest.py              # Pytest configuration & fixtures
│       ├── test_auth.py             # Auth endpoint tests
│       ├── test_appointments.py     # Appointment tests
│       ├── test_queue.py            # Queue logic tests
│       └── test_services.py         # Service layer tests
│
├── alembic/                         # Database migrations (if using SQL)
│   ├── versions/
│   └── env.py
│
├── scripts/                         # Utility scripts
│   ├── seed_data.py                 # Seed sample data
│   ├── create_indexes.py            # Create MongoDB indexes
│   └── backup_db.py                 # Database backup script
│
├── .env.example                     # Environment variables template
├── .env                             # Actual environment variables (gitignored)
├── .gitignore                       # Git ignore file
├── requirements.txt                 # Python dependencies
├── pyproject.toml                   # Poetry/modern Python config
├── pytest.ini                       # Pytest configuration
├── README.md                        # Backend documentation
└── Dockerfile                       # Docker configuration
```

---

## 2. Frontend Folder Structure (Next.js + Redux + Shadcn/ui)

```
frontend/
├── public/                          # Static assets
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero-bg.jpg
│   │   └── screenshots/            # Homepage UI screenshots
│   ├── icons/
│   │   └── favicon.ico
│   └── fonts/
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (public)/                # Public routes group
│   │   │   ├── page.tsx             # Homepage (landing page)
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # Login page
│   │   │   ├── signup/
│   │   │   │   └── page.tsx         # Signup page
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx         # Forgot password
│   │   │   └── reset-password/
│   │   │       └── [token]/
│   │   │           └── page.tsx     # Reset password with token
│   │   │
│   │   ├── (dashboard)/             # Authenticated routes group
│   │   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         # Main dashboard
│   │   │   ├── profile/
│   │   │   │   └── page.tsx         # User profile
│   │   │   │
│   │   │   ├── (admin)/             # Admin-only routes
│   │   │   │   ├── users/
│   │   │   │   │   ├── page.tsx     # Users list
│   │   │   │   │   ├── create/
│   │   │   │   │   │   └── page.tsx # Create user
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx # User details
│   │   │   │   │       └── edit/
│   │   │   │   │           └── page.tsx # Edit user
│   │   │   │   ├── providers/
│   │   │   │   │   ├── page.tsx     # Providers list
│   │   │   │   │   ├── create/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── edit/
│   │   │   │   │           └── page.tsx
│   │   │   │   ├── services/
│   │   │   │   │   ├── page.tsx     # Services list
│   │   │   │   │   ├── create/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── edit/
│   │   │   │   │           └── page.tsx
│   │   │   │   ├── reports/
│   │   │   │   │   └── page.tsx     # Reports & analytics
│   │   │   │   └── activity-logs/
│   │   │   │       └── page.tsx     # Activity logs
│   │   │   │
│   │   │   ├── (receptionist)/      # Receptionist routes
│   │   │   │   ├── appointments/
│   │   │   │   │   ├── page.tsx     # Appointments list
│   │   │   │   │   ├── create/
│   │   │   │   │   │   └── page.tsx # Create appointment
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx # Appointment details
│   │   │   │   │       └── edit/
│   │   │   │   │           └── page.tsx # Edit appointment
│   │   │   │   ├── queue/
│   │   │   │   │   ├── page.tsx     # Queue management
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── assign/
│   │   │   │   │           └── page.tsx # Assign from queue
│   │   │   │   └── schedule/
│   │   │   │       └── page.tsx     # Schedule calendar
│   │   │   │
│   │   │   └── (provider)/          # Provider routes
│   │   │       ├── my-schedule/
│   │   │       │   └── page.tsx     # Provider schedule
│   │   │       ├── my-appointments/
│   │   │       │   └── page.tsx     # Provider appointments
│   │   │       ├── availability/
│   │   │       │   └── page.tsx     # Manage availability
│   │   │       └── statistics/
│   │   │           └── page.tsx     # Provider stats
│   │   │
│   │   ├── api/                     # API routes (optional for BFF pattern)
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts     # NextAuth.js routes
│   │   │
│   │   ├── layout.tsx               # Root layout
│   │   ├── error.tsx                # Global error page
│   │   ├── not-found.tsx            # 404 page
│   │   └── loading.tsx              # Global loading state
│   │
│   ├── components/                  # React components
│   │   ├── ui/                      # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── ... (other shadcn components)
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── Header.tsx           # Top navigation bar
│   │   │   ├── Sidebar.tsx          # Sidebar navigation
│   │   │   ├── Footer.tsx           # Footer
│   │   │   └── DashboardLayout.tsx  # Dashboard wrapper
│   │   │
│   │   ├── auth/                    # Auth-related components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   └── ProtectedRoute.tsx   # Route protection wrapper
│   │   │
│   │   ├── appointments/            # Appointment components
│   │   │   ├── AppointmentCard.tsx
│   │   │   ├── AppointmentList.tsx
│   │   │   ├── AppointmentForm.tsx
│   │   │   ├── AppointmentCalendar.tsx
│   │   │   ├── ConflictWarning.tsx
│   │   │   └── StatusBadge.tsx
│   │   │
│   │   ├── providers/               # Provider components
│   │   │   ├── ProviderCard.tsx
│   │   │   ├── ProviderList.tsx
│   │   │   ├── ProviderForm.tsx
│   │   │   ├── CapacityIndicator.tsx
│   │   │   └── AvailabilityToggle.tsx
│   │   │
│   │   ├── queue/                   # Queue components
│   │   │   ├── QueueList.tsx
│   │   │   ├── QueueItem.tsx
│   │   │   ├── PriorityBadge.tsx
│   │   │   └── AssignProviderModal.tsx
│   │   │
│   │   ├── dashboard/               # Dashboard components
│   │   │   ├── StatCard.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   ├── ProviderUtilization.tsx
│   │   │   └── QuickActions.tsx
│   │   │
│   │   ├── analytics/               # Analytics components
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── PieChart.tsx
│   │   │   └── HeatMap.tsx
│   │   │
│   │   ├── common/                  # Common/shared components
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── TimePicker.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   │
│   │   └── homepage/                # Homepage sections
│   │       ├── HeroSection.tsx
│   │       ├── ProblemSection.tsx
│   │       ├── SolutionSection.tsx
│   │       ├── FeaturesSection.tsx
│   │       ├── TechStackSection.tsx
│   │       ├── UIGallerySection.tsx
│   │       ├── MetricsSection.tsx
│   │       └── CTASection.tsx
│   │
│   ├── lib/                         # Library code & utilities
│   │   ├── api/                     # API client
│   │   │   ├── client.ts            # Axios/fetch wrapper
│   │   │   ├── auth.ts              # Auth API calls
│   │   │   ├── users.ts             # User API calls
│   │   │   ├── providers.ts         # Provider API calls
│   │   │   ├── services.ts          # Service API calls
│   │   │   ├── appointments.ts      # Appointment API calls
│   │   │   ├── queue.ts             # Queue API calls
│   │   │   ├── schedules.ts         # Schedule API calls
│   │   │   ├── dashboard.ts         # Dashboard API calls
│   │   │   └── analytics.ts         # Analytics API calls
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   ├── cn.ts                # Tailwind class merger (shadcn)
│   │   │   ├── formatters.ts        # Date/time/currency formatters
│   │   │   ├── validators.ts        # Form validation helpers
│   │   │   ├── constants.ts         # App constants
│   │   │   └── helpers.ts           # General helper functions
│   │   │
│   │   └── hooks/                   # Custom React hooks
│   │       ├── useAuth.ts           # Authentication hook
│   │       ├── useAppointments.ts   # Appointments data hook
│   │       ├── useProviders.ts      # Providers data hook
│   │       ├── useQueue.ts          # Queue data hook
│   │       ├── useDebounce.ts       # Debounce hook
│   │       └── useLocalStorage.ts   # Local storage hook
│   │
│   ├── store/                       # Redux store
│   │   ├── index.ts                 # Store configuration
│   │   ├── hooks.ts                 # Typed Redux hooks
│   │   │
│   │   ├── slices/                  # Redux slices
│   │   │   ├── authSlice.ts         # Auth state
│   │   │   ├── userSlice.ts         # User state
│   │   │   ├── providerSlice.ts     # Provider state
│   │   │   ├── serviceSlice.ts      # Service state
│   │   │   ├── appointmentSlice.ts  # Appointment state
│   │   │   ├── queueSlice.ts        # Queue state
│   │   │   ├── dashboardSlice.ts    # Dashboard state
│   │   │   └── uiSlice.ts           # UI state (modals, toasts)
│   │   │
│   │   └── middleware/              # Redux middleware
│   │       └── apiMiddleware.ts     # API call middleware
│   │
│   ├── types/                       # TypeScript types
│   │   ├── index.ts                 # Common types
│   │   ├── user.ts                  # User types
│   │   ├── provider.ts              # Provider types
│   │   ├── service.ts               # Service types
│   │   ├── appointment.ts           # Appointment types
│   │   ├── queue.ts                 # Queue types
│   │   ├── schedule.ts              # Schedule types
│   │   ├── analytics.ts             # Analytics types
│   │   └── api.ts                   # API response types
│   │
│   ├── styles/                      # Global styles
│   │   └── globals.css              # Global CSS & Tailwind imports
│   │
│   └── config/                      # Configuration files
│       ├── site.ts                  # Site metadata & config
│       ├── navigation.ts            # Navigation menu config
│       └── env.ts                   # Environment variables validation
│
├── .env.local                       # Local environment variables
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore
├── next.config.js                   # Next.js configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
├── postcss.config.js                # PostCSS configuration
├── components.json                  # Shadcn/ui configuration
├── package.json                     # Dependencies
├── package-lock.json                # Lock file
├── README.md                        # Frontend documentation
└── Dockerfile                       # Docker configuration
```

---

## 3. Key Files Content Overview

### Backend Key Files

**`backend/app/main.py`**
```python
# FastAPI application setup
# CORS middleware
# Router registration
# Startup/shutdown events
```

**`backend/app/core/config.py`**
```python
# Environment variables
# MongoDB connection string
# Redis configuration
# JWT settings
# Email settings
```

**`backend/app/db/mongodb.py`**
```python
# MongoDB client initialization
# Database connection
# Collections setup
```

**`backend/app/db/redis_client.py`**
```python
# Redis client initialization
# Caching utilities
# Session management
```

**`backend/app/core/security.py`**
```python
# Password hashing (bcrypt)
# JWT token creation/validation
# Role-based permissions
```

---

### Frontend Key Files

**`frontend/src/app/layout.tsx`**
```tsx
// Root layout
// Redux Provider
// Theme Provider
// Toast notifications
```

**`frontend/src/store/index.ts`**
```typescript
// Redux store configuration
// Combine reducers
// Middleware setup
```

**`frontend/src/lib/api/client.ts`**
```typescript
// Axios instance with interceptors
// Request/response handling
// Error handling
// Token refresh logic
```

**`frontend/src/components/ui/*`**
```
// Shadcn/ui components
// Pre-built, customizable components
// Radix UI primitives
```

**`frontend/tailwind.config.ts`**
```typescript
// Tailwind configuration
// Custom colors
// Typography settings
// Shadcn/ui theme
```

---

## 4. Environment Variables

### Backend `.env`
```env
# Application
APP_NAME=MediSync
APP_ENV=development
DEBUG=True
API_VERSION=v1

# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=MediSync

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Security
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@MediSync.com

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://MediSync.vercel.app

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100
```

### Frontend `.env.local`
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_API_TIMEOUT=30000

# App
NEXT_PUBLIC_APP_NAME=MediSync
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Demo Credentials (for homepage)
NEXT_PUBLIC_DEMO_EMAIL=demo@MediSync.com
NEXT_PUBLIC_DEMO_PASSWORD=Demo@123
```

---

## 5. Package Dependencies

### Backend `requirements.txt`
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
motor==3.3.2                    # Async MongoDB driver
redis==5.0.1
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
python-dotenv==1.0.0
aiosmtplib==3.0.1
jinja2==3.1.2                   # Email templates
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2                   # Testing
```

### Frontend `package.json` (key dependencies)
```json
{
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@reduxjs/toolkit": "^2.0.1",
    "react-redux": "^9.0.4",
    "axios": "^1.6.2",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "lucide-react": "^0.294.0",
    "recharts": "^2.10.3",
    "date-fns": "^3.0.6",
    "zod": "^3.22.4",
    "react-hook-form": "^7.49.2",
    "@hookform/resolvers": "^3.3.3"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.0.4"
  }
}
```

---

## 6. Docker Configuration (Optional)

### Backend `Dockerfile`
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend `Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### `docker-compose.yml` (root level)
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongodb:27017
      - REDIS_HOST=redis
    depends_on:
      - mongodb
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000/api/v1

volumes:
  mongodb_data:
```

---

## 7. Development Workflow

### Backend Development
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest
```

### Frontend Development
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Add Shadcn/ui components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
# ... etc

# Run development server
npm run dev

# Build for production
npm run build
```

---

## 8. Git Repository Structure

```
.gitignore                    # Root gitignore
README.md                     # Main project documentation
LICENSE
backend/
  .gitignore                  # Backend-specific ignores
  README.md                   # Backend documentation
frontend/
  .gitignore                  # Frontend-specific ignores
  README.md                   # Frontend documentation
docs/                         # Additional documentation
  api-documentation.md
  database-schema.md
  deployment-guide.md
```

---

## Summary

**Backend (FastAPI):**
- ✅ Clean architecture with layered structure
- ✅ Separation of concerns (routes → services → repositories)
- ✅ MongoDB with Motor (async driver)
- ✅ Redis for caching and sessions
- ✅ Pydantic for validation
- ✅ JWT authentication
- ✅ Comprehensive testing setup

**Frontend (Next.js 14):**
- ✅ App Router with route groups
- ✅ Redux Toolkit for state management
- ✅ Shadcn/ui + Tailwind CSS
- ✅ TypeScript throughout
- ✅ Role-based routing structure
- ✅ Reusable component library
- ✅ Custom hooks and utilities

**Total Files:** 150+ organized files across both projects

This structure is production-ready, scalable, and follows