# MediSync — Frontend Dashboard Specification
**Version:** 1.0 | **Prepared for:** Frontend Development Team | **Date:** April 2026
**Project:** MediSync — Smart Healthcare Scheduling Platform

> This document defines the dashboard structure, tab layout, and component inventory for each user role. Use this as the source of truth when building client-side views. All data references map to the MediSync DB Schema v1.0 and the API endpoints defined in the MediSync Backend API.

---

## Table of Contents

1. [Role Overview](#1-role-overview)
2. [Administrator Dashboard](#2-administrator-dashboard)
3. [Receptionist Dashboard](#3-receptionist-dashboard)
4. [Provider Dashboard](#4-provider-dashboard)
5. [Shared / Global Components](#5-shared--global-components)
6. [API Endpoint → Tab Mapping](#6-api-endpoint--tab-mapping)
7. [UI States & Guard Rules](#7-ui-states--guard-rules)

---

## 1. Role Overview

| Role | `roles.name` | Primary Responsibility | Tab Count |
|------|-------------|----------------------|-----------|
| Administrator | `admin` | Full system access, configuration, user management | 7 tabs |
| Receptionist | `receptionist` | Appointment management, patient check-in/out | 5 tabs |
| Provider | `provider` | View personal schedule, manage own availability | 3 tabs |

> **Route guard:** On login, read `users.role_id` → `roles.name` and redirect to the correct dashboard root. All tab routes must be protected by the user's assigned role.

---

## 2. Administrator Dashboard

**Root route:** `/admin`
**Tab bar position:** Left sidebar (vertical nav)

---

### Tab 1 — Overview
**Route:** `/admin/overview`
**Icon:** Grid / Home
**Purpose:** High-level operational snapshot of the entire facility for the current day.

#### Components when active:

**KPI Summary Strip** — 4 metric cards rendered in a horizontal row.
- Total appointments today (source: `GET /api/v1/appointments/` filtered by today's date)
- Appointments by status breakdown: Scheduled / Checked-In / In-Progress / Completed / Cancelled / No-Show (status badges with count)
- Current waitlist queue count (source: `GET /api/v1/waitlist/`)
- No-show rate % with trend arrow vs. yesterday

**Provider Utilization Grid** — Card grid, one card per active provider.
- Provider name + specialization
- Capacity meter: current booked / max daily (e.g., "5 / 8") rendered as a filled progress bar
- Color coding: Green (< 70% booked) | Yellow (70–99%) | Red (100% = full)
- "View Schedule" action link per card (navigates to Appointments tab filtered to that provider)
- Source: `GET /api/v1/appointments/providers/{provider_id}/capacity`

**Live Activity Feed** — Scrollable list, most recent 20 activity log entries.
- Each entry: timestamp | actor name | action description
- Color-coded by action type: creation (green), cancellation (red), update (amber), system (blue)
- "View all" link → navigates to Audit Log tab
- Source: `GET /api/v1/activity-logs/`

**Waitlist Snapshot** — Compact table showing top 5 waiting entries.
- Columns: Patient Name | Service | Priority | Queue Position | Waiting Since
- Priority badges: Emergency (red), Urgent (amber), Standard (grey)
- "Manage Waitlist" CTA → navigates to Waitlist tab
- Source: `GET /api/v1/waitlist/`

---

### Tab 2 — Appointments
**Route:** `/admin/appointments`
**Icon:** Calendar
**Purpose:** Full appointment lifecycle management across all providers and patients.

#### Components when active:

**Toolbar / Filter Bar** — Sticky bar at the top of the tab.
- Date range picker (defaults to today)
- Provider dropdown filter (source: `GET /api/v1/providers/`)
- Service dropdown filter (source: `GET /api/v1/services/`)
- Status multi-select filter (Scheduled / Checked-In / In-Progress / Completed / Cancelled / No-Show)
- Search input: patient name or appointment number (APT-YYYYMMDD-NNN)
- View toggle: Calendar View | List View

**Calendar View (default)** — Full-page interactive calendar.
- Sub-views: Day | Week | Month (toggle buttons)
- Each appointment rendered as a colored block: color maps to `appointments.status`
- Clicking a block opens Appointment Detail Drawer (see below)
- Provider-lane layout in Day/Week view (one column per provider)
- Drag-to-reschedule interaction (triggers `PATCH /api/v1/appointments/{id}/status` + conflict check)

**List View** — Paginated data table (20 rows per page).
- Columns: Appointment # | Patient | Provider | Service | Date & Time | Duration | Status | Actions
- Actions per row: Check In | Complete | Cancel | View Detail
- Bulk action bar appears on row selection: Bulk Cancel with reason

**Appointment Detail Drawer** — Slides in from the right on appointment click.
- Patient info: Name, Phone, Email, DOB, Gender
- Appointment info: Service, Provider, Date/Time, Duration, Priority, Notes
- Status history timeline
- Action buttons (role-aware): Check In → In Progress → Complete | Cancel | Reschedule
- Cancellation sub-form: reason text field (required), confirmation button
- Source: `GET /api/v1/appointments/{id}`

**New Appointment Button** — Fixed position, top right.
- Opens "Book Appointment" modal/drawer
- Fields: Patient search/select (source: `GET /api/v1/patients/`) | Service select | Provider select (auto-filtered by service's required specialization) | Date/Time picker (shows only available slots based on provider availability) | Priority select | Notes
- Real-time conflict check on slot selection (source: `GET /api/v1/appointments/providers/{provider_id}/capacity`)
- If no slots: offers "Add to Waitlist" CTA
- Source: `POST /api/v1/appointments/`

---

### Tab 3 — Patients
**Route:** `/admin/patients`
**Icon:** Users
**Purpose:** Patient record management.

#### Components when active:

**Search & Filter Bar**
- Search input: name, phone, or email (source: `GET /api/v1/patients/`)
- Active/Inactive toggle filter

**Patient Table** — Paginated (20 rows per page).
- Columns: Name | Phone | Email | Date of Birth | Gender | Notification Opt-Out | Status | Actions
- Actions per row: View | Edit | Deactivate / Reactivate
- Opt-Out column: toggle switch (updates `patients.notification_opt_out`)
- Inactive rows rendered with muted/grey styling

**New Patient Button** — Opens "Create Patient" modal.
- Fields: Full Name (required) | Phone | Email | Date of Birth | Gender | Notification Opt-Out toggle
- Source: `POST /api/v1/patients/`

**Patient Detail Drawer** — Opens on "View" action.
- Patient demographic fields (editable inline via "Edit" mode, source: `PUT /api/v1/patients/{id}`)
- Appointment history tab within drawer: list of all past and upcoming appointments for this patient
- Audit trail tab within drawer (source: `GET /api/v1/patients/{id}/audit`)

---

### Tab 4 — Providers & Services
**Route:** `/admin/providers`
**Icon:** Stethoscope / Briefcase
**Purpose:** Provider profile management, service catalog, and availability configuration. Two sub-sections rendered as inner tabs.

#### Inner Tab A — Providers

**Provider Cards Grid** — One card per provider, responsive grid layout.
- Card shows: Avatar initials | Name | Specialization | Daily Capacity | Services assigned count | Status badge
- Actions: Edit Profile | Manage Availability | Manage Time Off | View Schedule

**Provider Detail Panel** (opens on Edit or card click)
- Profile fields: Name, Specialization (dropdown, source: `GET /api/v1/specializations/`), Contact Info, Daily Appointment Capacity
- Source: `PUT /api/v1/providers/{id}`

**Assigned Services List** — within Provider Detail Panel
- Chips/tags showing services assigned to this provider
- "Add Service" button: opens service picker filtered by provider's specialization (source: `POST /api/v1/providers/{provider_id}/services/{service_id}`)
- Remove button per chip (source: `DELETE /api/v1/providers/{provider_id}/services/{service_id}`)

**Availability Schedule** — within Provider Detail Panel
- Weekly grid: 7 columns (days) × time rows
- Click a cell to set availability block: Start Time | End Time | Repeat (weekly/one-time)
- Source: `POST /api/v1/availability/`, `PUT /api/v1/availability/{id}`, `DELETE /api/v1/availability/{id}`

**Time Off Manager** — within Provider Detail Panel
- List of existing time-off requests with status (pending / approved)
- "Add Time Off" form: Date From | Date To | Reason
- Admin can approve directly (source: `PATCH /api/v1/time-off/{id}/approve`)

**Promote User to Provider** — Button in top right
- User search/select (source: `GET /api/v1/users/`)
- Source: `POST /api/v1/providers/`

#### Inner Tab B — Services

**Service Catalog Table**
- Columns: Name | Category | Duration | Buffer Time | Required Specialization | Fee | Billing Code | Status | Actions
- Row actions: Edit | Deactivate
- Filter by category (source: `GET /api/v1/services/categories`)
- Source: `GET /api/v1/services/`

**New Service Button** — Opens "Create Service" modal.
- Fields: Name | Description | Category | Duration (dropdown: 15/30/45/60 min) | Buffer Time | Required Specialization | Fee | Billing Code | Active toggle
- Source: `POST /api/v1/services/`

**Specializations Sub-section** — Collapsible panel below service table
- Simple list/table of all specializations
- Add / Edit / Delete actions
- Source: `GET /api/v1/specializations/`, `POST`, `PUT`, `DELETE`

---

### Tab 5 — Waitlist
**Route:** `/admin/waitlist`
**Icon:** Clock / Queue
**Purpose:** Waitlist monitoring and manual queue management.

#### Components when active:

**Waitlist Stats Bar** — 3 KPI chips.
- Total currently waiting
- Average estimated wait time per service (source: `GET /api/v1/waitlist/estimated-wait/{service_id}`)
- Assignments made today

**Filter Bar**
- Filter by: Service | Priority | Status (Waiting / Assigned / Cancelled / Expired)
- Sort by: Priority + Queue Position (default) | Wait Time | Created Date

**Waitlist Queue Table** — Full-width table, real-time polling recommended (30s interval).
- Columns: Queue # | Patient Name | Service | Preferred Provider (or "Any") | Priority | Requested Date | Waiting Since | Estimated Wait | Status | Actions
- Priority badges: Emergency (red pill), Urgent (amber), Standard (grey)
- Actions per row: Assign Now (triggers provider selection modal) | Cancel Entry
- "Assign Now" flow: select available provider → confirms slot → creates appointment → updates waitlist entry status to `assigned` (source: `POST /api/v1/appointments/`)

**Add to Waitlist Button** — Opens form modal.
- Fields: Patient search | Service | Preferred Provider (optional) | Priority | Requested Date (optional) | Notes
- Source: `POST /api/v1/waitlist/`

---

### Tab 6 — Users & Roles
**Route:** `/admin/users`
**Icon:** Shield / Lock
**Purpose:** System user management and RBAC configuration. Two inner tabs.

#### Inner Tab A — Users

**User Table** — Paginated.
- Columns: Name | Email | Role | Status (Active/Inactive) | Last Login | Created | Actions
- Actions: Edit | Activate (`PATCH /api/v1/users/{id}/activate`) | Deactivate (`PATCH /api/v1/users/{id}/deactivate`) | View Audit
- Source: `GET /api/v1/users/`

**New User Button** — Opens "Create User" modal.
- Fields: Full Name | Email | Password (auto-generated or manual) | Role (dropdown: Admin / Receptionist / Provider)
- Source: `POST /api/v1/users/`

**User Audit Drawer** — Opens on "View Audit" action.
- Source: `GET /api/v1/users/{id}/audit`

#### Inner Tab B — Roles & Permissions

**Roles List** — Left column panel.
- Lists all roles (Admin, Receptionist, Provider)
- Clicking a role loads its permissions in the right panel
- Source: `GET /api/v1/rbac/roles`

**Permissions Matrix** — Right panel (loads on role selection).
- All system permissions listed as checkboxes grouped by resource area
- Checked = assigned to the selected role
- Save changes triggers: `POST /api/v1/rbac/roles/{id}/permissions` (assign) or `DELETE /api/v1/rbac/roles/{id}/permissions/{permission_id}` (revoke)
- Source: `GET /api/v1/rbac/permissions`

---

### Tab 7 — Audit Log
**Route:** `/admin/audit`
**Icon:** File Text / Clipboard
**Purpose:** Immutable system activity trail for compliance and debugging.

#### Components when active:

**Filter Bar**
- Date range picker
- Actor filter (user dropdown, source: `GET /api/v1/users/`)
- Action type filter (multi-select: login, create_appointment, cancel_appointment, etc.)
- Entity type filter (appointment, provider, patient, user, service, waitlist)
- Search by entity ID or description text

**Activity Log Table** — Paginated (50 rows per page).
- Columns: Timestamp | Actor | Action Type | Entity Type | Entity ID | Description | IP Address
- Expandable row: shows `old_values` and `new_values` diff when present (rendered as a before/after JSON diff view)
- Source: `GET /api/v1/activity-logs/`

**Activity Stats Panel** — Collapsible side panel.
- Summary counts by action type for the selected date range
- Source: `GET /api/v1/activity-logs/stats`

---

## 3. Receptionist Dashboard

**Root route:** `/receptionist`
**Tab bar position:** Top horizontal tab bar

---

### Tab 1 — Today's Queue
**Route:** `/receptionist/today`
**Icon:** List / Clipboard
**Purpose:** Real-time view of today's appointments for check-in/check-out workflow. This is the default landing tab.

#### Components when active:

**Date Display & Quick Stats Bar**
- Today's date (large, prominent)
- 4 mini KPI chips: Scheduled | Checked In | In Progress | Completed (counts, updates in real-time)

**Provider Queue Tabs** — Sub-tab strip, one tab per active provider today.
- Each sub-tab shows provider name + current capacity (e.g., "Dr. Smith — 5/8")
- "All Providers" combined view as the first sub-tab
- Source: `GET /api/v1/appointments/providers/{provider_id}/queue`

**Appointment Queue Table** — Within each provider sub-tab.
- Columns: Time Slot | Patient Name | Service | Duration | Status | Actions
- Sorted by appointment start time ascending
- Color-coded rows by status: Scheduled (white) | Checked-In (light blue) | In Progress (light amber) | Completed (light green) | Cancelled (strikethrough grey) | No-Show (light red)
- Actions per row (status-driven):
  - Status = `scheduled` → "Check In" button
  - Status = `checked_in` → "Start" button (moves to in_progress)
  - Status = `in_progress` → "Complete" button
  - Any active status → "Mark No-Show" | "Cancel" (with reason)
- All status transitions via: `PATCH /api/v1/appointments/{id}/status`

**Walk-In Booking Button** — Fixed top-right.
- Shortcut to the quick-book appointment form
- Defaults date to today

---

### Tab 2 — Appointments
**Route:** `/receptionist/appointments`
**Icon:** Calendar
**Purpose:** Browse, search, and manage all appointments (past and future).

#### Components when active:

**Filter & Search Bar**
- Date range picker
- Provider filter dropdown
- Service filter dropdown
- Status multi-select filter
- Patient name / appointment number search

**Calendar / List Toggle**
- Calendar View (Day/Week/Month)
- List View (paginated table)

**Appointment Table (List View)**
- Columns: Appointment # | Patient | Provider | Service | Date & Time | Status | Actions
- Actions: View Detail | Edit | Cancel | Reschedule
- Source: `GET /api/v1/appointments/`

**Appointment Detail Drawer** (same structure as Admin version, but without admin-only override actions)

**New Appointment Button**
- Full booking form (same as admin version)
- Conflict detection and "Add to Waitlist" fallback
- Source: `POST /api/v1/appointments/`

---

### Tab 3 — Patients
**Route:** `/receptionist/patients`
**Icon:** User
**Purpose:** Patient record lookup, creation, and basic profile management.

#### Components when active:

**Search Bar** — Prominent, centered at top.
- Search by name, phone, or email
- Instant results as user types (debounced, 300ms)

**Patient Results Table**
- Columns: Name | Phone | Email | DOB | Active | Actions
- Actions per row: View / Edit | Book Appointment (shortcut to new appointment pre-filled with this patient)
- Source: `GET /api/v1/patients/`

**New Patient Button**
- Create Patient modal: Full Name | Phone | Email | DOB | Gender | Notification Opt-Out
- Source: `POST /api/v1/patients/`

**Patient Detail Drawer** (on View/Edit)
- Editable profile fields
- "Upcoming Appointments" section within drawer (list of future appointments for this patient)
- Source: `GET /api/v1/patients/{id}`, `PUT /api/v1/patients/{id}`

---

### Tab 4 — Waitlist
**Route:** `/receptionist/waitlist`
**Icon:** Clock
**Purpose:** View the live waitlist queue and add/cancel entries.

#### Components when active:

**Estimated Wait Display** — Service-by-service accordion.
- Each service shows: estimated current wait time (source: `GET /api/v1/waitlist/estimated-wait/{service_id}`)
- Count of people currently waiting per service

**Waitlist Table**
- Columns: Queue Position | Patient | Service | Priority | Waiting Since | Status | Actions
- Actions: Cancel Entry (`DELETE /api/v1/waitlist/{id}`)
- Source: `GET /api/v1/waitlist/`

**Add to Waitlist Button**
- Modal: Patient search | Service | Priority | Preferred Provider (optional) | Requested Date | Notes
- Source: `POST /api/v1/waitlist/`

---

### Tab 5 — My Profile
**Route:** `/receptionist/profile`
**Icon:** Person / Settings
**Purpose:** Personal account settings for the logged-in receptionist.

#### Components when active:

**Profile Form** — Editable.
- Fields: Full Name | Email (read-only, display only) | Contact Info
- Save button (source: `PUT /api/v1/profile/me`)

**Change Password Form** — Separate card below profile form.
- Fields: Current Password | New Password | Confirm New Password
- Password strength indicator
- Source: `PUT /api/v1/profile/change-password`

---

## 4. Provider Dashboard

**Root route:** `/provider`
**Tab bar position:** Top horizontal tab bar (compact, 3 tabs only)

---

### Tab 1 — My Schedule
**Route:** `/provider/schedule`
**Icon:** Calendar
**Purpose:** Provider's personal appointment schedule view. Default landing tab.

#### Components when active:

**Today's Summary Bar**
- Today's date
- Appointments today: count completed / total scheduled (e.g., "3 of 8 done")
- Current capacity status badge (Available / Approaching Full / Full)

**View Toggle** — Day (default) | Week | Month

**Day View** — Timeline layout (e.g., 08:00–18:00 in 15-min rows).
- Each appointment block: Patient Name | Service | Duration | Status chip
- Clicking a block opens Appointment Detail panel (read-only for provider)
- Buffer time between appointments shown as hatched/grey zones
- Source: `GET /api/v1/appointments/` filtered to `provider_id = current user's provider ID`

**Week View** — 7-column grid, one column per day.
- Appointment blocks per day column
- Day header shows: date + count of appointments

**Month View** — Standard monthly calendar.
- Each day cell shows: count of appointments + capacity color indicator

**Provider Queue Panel** — Sidebar panel (visible in Day view).
- Real-time ordered list of today's remaining appointments
- Quick status action buttons per entry (Check In, Complete, etc.)
- Source: `GET /api/v1/appointments/providers/{provider_id}/queue`

---

### Tab 2 — Availability & Time Off
**Route:** `/provider/availability`
**Icon:** Clock / Toggle
**Purpose:** Provider self-manages their own schedule and time-off requests.

#### Components when active:

**Weekly Availability Schedule** — Interactive weekly grid.
- 7 day columns × configurable time rows
- Filled blocks show current availability windows
- Click empty area → create new availability block (Start Time, End Time, Recurring toggle)
- Click existing block → edit or delete
- Source: `GET /api/v1/availability/{provider_id}`, `POST /api/v1/availability/`, `PUT /api/v1/availability/{id}`, `DELETE /api/v1/availability/{id}`

**Time Off Requests** — Section below the weekly grid.
- Table: Date From | Date To | Reason | Status (Pending / Approved)
- "Request Time Off" button → inline form: Date range picker | Reason text field
- Source: `POST /api/v1/time-off/`, `GET /api/v1/time-off/{provider_id}`, `PUT /api/v1/time-off/{id}`, `DELETE /api/v1/time-off/{id}`
- Pending requests show a "Pending Approval" badge; approved show a green "Approved" badge

---

### Tab 3 — My Profile
**Route:** `/provider/profile`
**Icon:** Person
**Purpose:** Provider's personal account settings.

#### Components when active:

**Profile Form**
- Fields: Full Name | Email (display only) | Contact Info
- Source: `PUT /api/v1/profile/me`

**Provider Profile Section** — Separate card.
- Specialization (read-only, set by admin)
- Daily Appointment Capacity (read-only, set by admin)
- Assigned Services list (read-only chips)
- Source: `GET /api/v1/providers/{id}`, `GET /api/v1/providers/{id}/services`

**Change Password Form**
- Fields: Current Password | New Password | Confirm New Password
- Source: `PUT /api/v1/profile/change-password`

---

## 5. Shared / Global Components

These components are rendered outside the tab content area and persist across all tabs and all roles.

**Top Navigation Bar** (all roles)
- MediSync logo (left)
- Current user name + role badge (right)
- Notification bell icon (future; placeholder for now)
- Logout button → `POST /api/v1/auth/logout`

**Session Timeout Warning Modal**
- Appears at 25-minute inactivity mark (5-minute warning before the 30-minute auto-logout)
- "Stay Logged In" button resets the inactivity timer
- Countdown displayed in modal

**Toast / Snackbar Notification System**
- Success toasts: appointment booked, patient created, status updated
- Error toasts: conflict detected, API errors, validation failures
- Info toasts: waitlist assignment notifications
- Auto-dismiss after 4 seconds; manually dismissable

**Empty State Components** — Standardised for every table and list:
- Illustration + message + CTA button when no data is present (e.g., "No appointments today — Book one now")

**Loading Skeleton Screens** — Used for every data-fetching state:
- Skeleton rows for tables, skeleton cards for grids
- No spinner-only states on primary content areas

**Confirmation Dialog** — Reusable modal for destructive actions:
- Used for: Cancel Appointment, Delete Patient, Deactivate User, Remove Service
- Must always show the affected entity name and require explicit confirmation click
- Never auto-confirm destructive actions

---

## 6. API Endpoint → Tab Mapping

| API Endpoint | Admin Tab | Receptionist Tab | Provider Tab |
|---|---|---|---|
| `GET /api/v1/appointments/` | Appointments, Overview | Appointments, Today's Queue | My Schedule |
| `POST /api/v1/appointments/` | Appointments | Appointments, Today's Queue | — |
| `PATCH /api/v1/appointments/{id}/status` | Appointments | Today's Queue | — |
| `GET /api/v1/appointments/providers/{id}/queue` | Overview | Today's Queue | My Schedule |
| `GET /api/v1/appointments/providers/{id}/capacity` | Overview | Today's Queue | My Schedule |
| `GET /api/v1/patients/` | Patients | Patients | — |
| `POST /api/v1/patients/` | Patients | Patients | — |
| `GET /api/v1/providers/` | Providers & Services | Appointments (filter) | — |
| `GET /api/v1/availability/{provider_id}` | Providers & Services | — | Availability & Time Off |
| `POST /api/v1/availability/` | Providers & Services | — | Availability & Time Off |
| `POST /api/v1/time-off/` | Providers & Services | — | Availability & Time Off |
| `PATCH /api/v1/time-off/{id}/approve` | Providers & Services | — | — |
| `GET /api/v1/waitlist/` | Waitlist, Overview | Waitlist | — |
| `POST /api/v1/waitlist/` | Waitlist | Waitlist | — |
| `GET /api/v1/waitlist/estimated-wait/{service_id}` | Waitlist | Waitlist | — |
| `GET /api/v1/services/` | Providers & Services | Appointments (filter) | My Profile |
| `GET /api/v1/users/` | Users & Roles | — | — |
| `POST /api/v1/users/` | Users & Roles | — | — |
| `GET /api/v1/rbac/roles` | Users & Roles | — | — |
| `GET /api/v1/rbac/permissions` | Users & Roles | — | — |
| `GET /api/v1/activity-logs/` | Audit Log, Overview | — | — |
| `GET /api/v1/activity-logs/stats` | Audit Log | — | — |
| `GET /api/v1/profile/me` | All roles — My Profile | My Profile | My Profile |
| `PUT /api/v1/profile/change-password` | All roles — My Profile | My Profile | My Profile |

---

## 7. UI States & Guard Rules

### Role-Based Access Guards

| Feature / Action | Admin | Receptionist | Provider |
|---|:---:|:---:|:---:|
| View all appointments | ✅ | ✅ | ❌ (own only) |
| Create appointment | ✅ | ✅ | ❌ |
| Cancel appointment | ✅ | ✅ | ❌ |
| Override capacity (emergency) | ✅ | ❌ | ❌ |
| Manage patients | ✅ | ✅ | ❌ |
| Promote user to provider | ✅ | ❌ | ❌ |
| Manage provider profiles | ✅ | ❌ | ❌ |
| Manage services & specializations | ✅ | ❌ | ❌ |
| Approve time-off requests | ✅ | ❌ | ❌ |
| Manage own availability | ✅ (via provider panel) | ❌ | ✅ |
| Request own time off | ✅ (via provider panel) | ❌ | ✅ |
| View audit log | ✅ | ❌ | ❌ |
| Manage RBAC roles & permissions | ✅ | ❌ | ❌ |
| Manage waitlist | ✅ | ✅ | ❌ |
| View own schedule | ✅ | ❌ | ✅ |

### Appointment Status Transition Rules (UI Button Visibility)

| Current Status | Allowed Transitions | Who Can Trigger |
|---|---|---|
| `scheduled` | → `checked_in`, → `cancelled`, → `no_show` | Admin, Receptionist |
| `checked_in` | → `in_progress`, → `cancelled` | Admin, Receptionist |
| `in_progress` | → `completed`, → `cancelled` | Admin, Receptionist |
| `completed` | (terminal — no transitions) | — |
| `cancelled` | (terminal — no transitions) | — |
| `no_show` | (terminal — no transitions) | — |

> Render action buttons based on `appointments.status`. Hide or disable buttons that do not correspond to a valid next transition. Never show a "Check In" button on a completed or cancelled appointment.

### Real-Time Polling Strategy

| Tab / Component | Recommended Poll Interval |
|---|---|
| Today's Queue (Receptionist) | 15 seconds |
| Provider Queue Panel (Provider) | 15 seconds |
| Overview KPI Strip (Admin) | 30 seconds |
| Waitlist Queue Table | 30 seconds |
| Provider Capacity Grid | 60 seconds |
| Activity Feed | 60 seconds |

> Use polling only where WebSocket is not available. Avoid polling on static/filter-only views like the patient table or audit log.

### Empty & Error States

Every data-displaying component must handle three states explicitly:

1. **Loading** — render skeleton placeholders matching the expected layout shape.
2. **Empty** — render a context-specific empty state illustration with a relevant CTA (e.g., "No patients found — Create one").
3. **Error** — render an inline error banner with a "Retry" button. Do not show raw API error messages to end users; map error codes to human-readable messages.

---

*MediSync Frontend Dashboard Specification — Version 1.0 — April 2026 — Internal Use Only*