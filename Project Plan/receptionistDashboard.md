# MediSync — Receptionist Dashboard Frontend Implementation Spec
**Version:** 1.0 | **Prepared for:** Frontend Development Team | **Date:** April 2026
**Scope:** End-to-end implementation of the Receptionist (`/receptionist`) dashboard
**Prerequisite reading:** MediSync DB Schema v1.0 · Backend API Docs · Appointment System Design Doc

---

## Table of Contents

1. [Dashboard Shell & Layout](#1-dashboard-shell--layout)
2. [Global WebSocket Setup](#2-global-websocket-setup)
3. [Tab 1 — Today's Queue (Default Landing)](#3-tab-1--todays-queue-default-landing)
4. [Tab 2 — Appointments (Browse & Manage)](#4-tab-2--appointments-browse--manage)
5. [Tab 3 — Patients](#5-tab-3--patients)
6. [Tab 4 — Waitlist](#6-tab-4--waitlist)
7. [Tab 5 — My Profile](#7-tab-5--my-profile)
8. [Shared Modals & Drawers](#8-shared-modals--drawers)
   - 8A. Book Appointment Modal (Full Booking Flow)
   - 8B. Appointment Detail Drawer
   - 8C. Cancel Appointment Dialog
   - 8D. Reschedule Appointment Flow
   - 8E. Create / Edit Patient Drawer
   - 8F. Add to Waitlist Modal
9. [UI State Standards](#9-ui-state-standards)
10. [WebSocket Event Handlers](#10-websocket-event-handlers)
11. [Role Guard & Permission Rules](#11-role-guard--permission-rules)
12. [API Quick Reference](#12-api-quick-reference)

---

## 1. Dashboard Shell & Layout

### 1.1 Overall Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP NAVIGATION BAR                                             │
│  [MediSync Logo]           [User Name - Receptionist]  [Logout] │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  TAB BAR (horizontal, sticky)                                   │
│  [Today's Queue] [Appointments] [Patients] [Waitlist] [Profile] │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   TAB CONTENT AREA (scrollable)                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Top Navigation Bar

**Component: `<TopNavBar />`** — Fixed at top, full width, z-index above all content.

**Left side:**
- MediSync logo/wordmark (links to `/receptionist/today` on click)

**Right side (left to right):**
- Connection status indicator — small dot (green = WebSocket connected, grey = polling fallback). Tooltip: "Live updates active" / "Reconnecting..."
- Logged-in user's full name — pulled from `GET /api/v1/profile/me` on app mount. Display as "Jane Doe · Receptionist"
- Logout button — calls `POST /api/v1/auth/logout`, clears session/token from storage, redirects to `/login`

**Session timeout warning:**
- At 25 minutes of inactivity, display a modal overlay: "Your session will expire in 5 minutes. Stay logged in?"
- "Stay Logged In" button — calls `GET /api/v1/profile/me` to reset the session timer
- If no interaction by minute 30, auto-logout and redirect to `/login` with query param `?reason=session_expired`

### 1.3 Tab Bar

**Component: `<ReceptionistTabBar />`** — Sticky below the nav bar.

Five tabs in order:
1. **Today's Queue** — route `/receptionist/today` — default active on login
2. **Appointments** — route `/receptionist/appointments`
3. **Patients** — route `/receptionist/patients`
4. **Waitlist** — route `/receptionist/waitlist`
5. **My Profile** — route `/receptionist/profile`

Active tab has a bottom border indicator. Tab switching is instant — content mounts/unmounts on route change. Keep scroll position reset to top on tab switch.

**Persistent "Book Appointment" button** — Fixed position, bottom-right corner of screen (floating action button), visible on ALL tabs except My Profile. Opens the Book Appointment Modal (§8A). This is the most used action — make it highly visible and always accessible.

---

## 2. Global WebSocket Setup

### 2.1 Connection

On receptionist dashboard mount, open a single WebSocket connection:

```
WS /ws/dashboard:global
```

Also subscribe to the waitlist channel per active service (subscribe dynamically after loading services list):
```
WS /ws/waitlist:{service_id}   ← one per service currently in the catalog
```

> **Fallback:** If WebSocket fails or disconnects, automatically fall back to polling every 30 seconds for critical panels (Today's Queue, Waitlist). Show the grey dot indicator in the nav bar during fallback mode.

### 2.2 Events to Handle

See full event handler spec in [§10](#10-websocket-event-handlers). Wire these up at dashboard mount level and pass update callbacks down to relevant tab components via context or state management.

---

## 3. Tab 1 — Today's Queue (Default Landing)

**Route:** `/receptionist/today`
**Purpose:** The primary operational screen for the front desk. Everything a receptionist needs to run today's clinic from a single view.

### 3.1 Page Layout

```
┌───────────────────────────────────────────────────────┐
│  TODAY'S DATE HEADER + KPI STRIP                      │
├───────────────────────────────────────────────────────┤
│  PROVIDER SUB-TABS  [All] [Dr. A] [Dr. B] [Dr. C]... │
├───────────────────────────────────────────────────────┤
│  QUEUE TABLE  (main content area, fills remainder)    │
│                                                       │
│  [row] [row] [row] ...                                │
└───────────────────────────────────────────────────────┘
```

---

### 3.2 Today's Date Header + KPI Strip

**Component: `<TodayHeader />`**

**Left:** Today's date in full format — e.g., "Thursday, 2 April 2026"

**Right (KPI chips, inline row):** Four count chips that update in real-time via WebSocket:

| Chip Label | Value Source | Update Trigger |
|---|---|---|
| Scheduled | Count of `status = scheduled` for today | WS `appointment_created`, `appointment_status_changed` |
| Checked In | Count of `status = checked_in` for today | WS `appointment_status_changed` |
| In Progress | Count of `status = in_progress` for today | WS `appointment_status_changed` |
| Completed | Count of `status = completed` for today | WS `appointment_status_changed` |

**API — initial load:**
```
GET /api/v1/appointments/?date=today&page_size=1000
```
Aggregate counts client-side from the response. Re-fetch on WS reconnect.

> No-Show and Cancelled counts are intentionally excluded from the header strip — they are visible in the table itself. Keep the header focused on active flow.

---

### 3.3 Provider Sub-Tabs

**Component: `<ProviderSubTabs />`**

A horizontal scrollable strip of tab buttons immediately below the header.

**First tab (always):** "All Providers" — shows appointments across all providers merged into one queue, sorted by appointment start time.

**Subsequent tabs:** One per active provider who has at least one appointment today. Display as:
- Provider name (short: "Dr. Smith")
- Capacity badge: "5 / 8" — current booked count / max daily (color coded: green < 70%, amber 70–99%, red = 100%)

**API — load provider list for today:**
```
GET /api/v1/providers/
```
Then for each provider fetch capacity:
```
GET /api/v1/appointments/providers/{provider_id}/capacity
```

> Only show providers who have appointments today in the sub-tab strip. An admin who just added a provider with no bookings yet should not appear here.

**Tab switch behavior:** Switching provider sub-tab filters the queue table below to that provider only. No route change — this is local state within Tab 1.

---

### 3.4 Queue Table

**Component: `<ProviderQueueTable />`**

The core operational component. Full-width table. No pagination — shows all of today's appointments for the selected provider (or all providers). Sorted by priority first (Emergency → Urgent → Standard), then by `appointment_start` ascending.

**API — load queue:**
```
GET /api/v1/appointments/providers/{provider_id}/queue
```
For "All Providers" tab, call this for each provider and merge results sorted by start time.

> **Backend note:** This endpoint must return appointments ordered as: `priority DESC (emergency first), appointment_start ASC`. If the current endpoint does not support this ordering, add a `sort` query param or fix the ordering server-side.

#### 3.4.1 Table Columns

| Column | Content | Notes |
|---|---|---|
| **#** | Queue position number (1, 2, 3...) | Derived from row index in the sorted result |
| **Time** | `appointment_start` formatted as "09:30 AM" | Show duration below in muted text: "30 min" |
| **Patient** | Patient full name | Show phone number below in muted text |
| **Service** | Service name | Show provider name below in muted text (only in "All Providers" tab) |
| **Priority** | Pill badge | Emergency (urgent red pill), Urgent (amber pill), Standard (no badge / grey) |
| **Status** | Status badge | Color-coded — see §3.4.2 |
| **Actions** | Context-sensitive buttons | See §3.4.3 |

#### 3.4.2 Status Badge Colors & Row Styling

| Status | Badge Style | Row Background |
|---|---|---|
| `scheduled` | Neutral/default | Default |
| `checked_in` | Info/blue | Subtle blue tint |
| `in_progress` | Warning/amber | Subtle amber tint |
| `completed` | Success/green | Subtle green tint, row slightly muted |
| `cancelled` | Muted/grey | Strikethrough text on patient name, row muted |
| `no_show` | Danger/red | Row muted |

Completed, cancelled, and no-show rows are shown at the bottom of the table (push them down with sort) and rendered with reduced visual weight, so active appointments dominate the view.

#### 3.4.3 Action Buttons per Status

Render **only** the valid-next-step actions. No dropdown menus — show buttons directly for fast access.

**Status = `scheduled`:**
- Primary button: **"Check In"** — clicking immediately triggers status transition (no confirmation needed, it's non-destructive). Calls `PATCH /api/v1/appointments/{id}/status` with `{ "status": "checked_in" }`. On success: row updates in-place.
- Secondary button: **"No-Show"** — clicking opens a small inline confirmation popover: "Mark [Patient Name] as no-show?" with Confirm and Cancel. On confirm: `PATCH /api/v1/appointments/{id}/status` with `{ "status": "no_show" }`.
- Text link: **"Cancel"** — opens the Cancel Appointment Dialog (§8C).
- Icon button: **"⋮ More"** — opens a small popover with: "View Details", "Reschedule".

**Status = `checked_in`:**
- Primary button: **"Start"** — moves to `in_progress`. Calls `PATCH /api/v1/appointments/{id}/status` with `{ "status": "in_progress" }`. No confirmation.
- Text link: **"Cancel"** — opens Cancel Dialog (rare case, patient left before being seen).
- Icon button: **"⋮ More"** — "View Details".

**Status = `in_progress`:**
- Primary button: **"Complete"** — moves to `completed`. Calls `PATCH /api/v1/appointments/{id}/status` with `{ "status": "completed" }`. No confirmation.
- Icon button: **"⋮ More"** — "View Details".

**Status = `completed` / `cancelled` / `no_show`:**
- Icon button only: **"View Details"** — opens Appointment Detail Drawer (§8B, read-only).
- No action buttons — terminal states.

#### 3.4.4 Row Interaction

- Clicking anywhere on a row (outside action buttons) opens the Appointment Detail Drawer (§8B).
- Rows update in-place when a WebSocket event arrives for that appointment — no full table reload. Animate the row briefly (subtle flash) to indicate an update occurred.
- New appointments booked during the day appear at the top of their priority group with a brief "new row" animation.

#### 3.4.5 Empty State

When no appointments exist for today (or the selected provider has none):
- Illustration + message: "No appointments scheduled today"
- CTA button: "Book First Appointment" → opens Book Appointment Modal (§8A)

---

### 3.5 Quick Stats Sidebar (Optional, Desktop Only)

On desktop (viewport ≥ 1280px), render a collapsible right sidebar (width: 280px) alongside the queue table.

**Component: `<TodaySidebar />`**

Contains two cards:

**Card 1 — Waitlist Snapshot:**
- Heading: "Waiting Queue"
- Count of entries currently with `status = waiting`
- Top 3 entries listed: Patient Name | Service | Priority | Position
- "View Full Waitlist" link → switches to Waitlist tab
- API: `GET /api/v1/waitlist/?status=waiting&page_size=3`

**Card 2 — Provider Status Grid:**
- One row per provider: Name | Capacity bar | Status
- Capacity bar = filled progress bar (green/amber/red)
- "Full" providers shown with a red indicator
- API: `GET /api/v1/appointments/providers/{provider_id}/capacity` (one call per provider)

---

## 4. Tab 2 — Appointments (Browse & Manage)

**Route:** `/receptionist/appointments`
**Purpose:** Browse all appointments across any date range, search, filter, and manage individual appointments. Secondary operational screen — used for lookups and future booking management.

### 4.1 Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  FILTER BAR  [Date Range] [Provider ▼] [Service ▼] [Status] │
│              [Search Patient/Apt#  🔍 ]  [View: Cal | List]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  CALENDAR VIEW  or  LIST VIEW  (toggled)                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Floating Action Button** (bottom-right): "＋ Book Appointment" — opens Book Appointment Modal (§8A).

---

### 4.2 Filter Bar

**Component: `<AppointmentsFilterBar />`** — Sticky below the tab bar.

| Control | Type | Behavior |
|---|---|---|
| Date Range | Date range picker | Default: today. Quick presets: Today, Yesterday, This Week, This Month, Custom |
| Provider | Dropdown (single select) | "All Providers" default. Options from `GET /api/v1/providers/` |
| Service | Dropdown (single select) | "All Services" default. Options from `GET /api/v1/services/` |
| Status | Multi-select chip group | Checkboxes: Scheduled, Checked In, In Progress, Completed, Cancelled, No-Show. Default: all selected |
| Search | Text input with icon | Debounced 300ms. Searches patient name OR appointment number (APT-YYYYMMDD-NNN) |
| View Toggle | Icon button pair | Calendar icon / List icon. Persisted in local storage |

**API — apply filters:**
```
GET /api/v1/appointments/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&provider_id=...&service_id=...&status=...&search=...
```
> **Backend note:** The current `GET /api/v1/appointments/` endpoint must support these query params: `date_from`, `date_to`, `provider_id`, `service_id`, `status` (comma-separated list), `search`. Add these if not already implemented.

All filters are applied simultaneously — every filter change re-fetches. Show a loading skeleton during fetch.

---

### 4.3 Calendar View

**Component: `<AppointmentCalendar />`**

Three sub-views toggled by buttons in the top-right of the calendar: **Day | Week | Month**

**Day View:**
- Timeline from the clinic's opening time to closing time (e.g., 08:00–18:00) in 15-minute rows
- One column per provider (based on filter — if "All Providers" selected, show all provider columns side by side)
- Each appointment renders as a colored block spanning its duration + buffer time
- Block content: Patient Name (first line), Service Name (second line), Status badge
- Block color maps to status (same color scheme as §3.4.2)
- Clicking a block opens the Appointment Detail Drawer (§8B)
- Empty time slots are clickable — clicking an empty slot opens the Book Appointment Modal pre-filled with that provider and time

**Week View:**
- 7 columns (Mon–Sun), date header per column
- Appointment blocks in each day column (compact — show only patient name)
- Clicking a block opens detail drawer
- Scroll to current time on load

**Month View:**
- Standard monthly calendar grid
- Each day cell shows: count of appointments + a small colored dot per status category
- Clicking a day cell switches to Day View for that date

---

### 4.4 List View

**Component: `<AppointmentListView />`**

Paginated table, 20 rows per page. Default sort: `appointment_start DESC` (most recent first).

#### Table Columns

| Column | Content |
|---|---|
| **Apt #** | `appointment_number` (e.g., APT-20260402-007). Monospace font. |
| **Date & Time** | Formatted: "2 Apr 2026 · 09:30 AM". Duration in muted text below. |
| **Patient** | Full name. Phone below in muted text. |
| **Service** | Service name. Duration in muted text. |
| **Provider** | Provider full name. |
| **Priority** | Badge (Emergency / Urgent / Standard) |
| **Status** | Status badge (same colors as §3.4.2) |
| **Actions** | Depends on status — see below |

#### Actions Column per Status

- `scheduled`: "Check In" (primary) · "Cancel" (text) · "⋮" (View Details, Reschedule)
- `checked_in`: "Start" (primary) · "⋮" (View Details, Cancel)
- `in_progress`: "Complete" (primary) · "⋮" (View Details)
- `completed` / `cancelled` / `no_show`: "View Details" only

#### Pagination

- Row count display: "Showing 1–20 of 143 appointments"
- Previous / Next buttons + page number input
- Page size selector: 10 / 20 / 50 rows per page

#### Sorting

Clicking column headers sorts by: Date & Time, Patient Name, Status. Show sort direction arrow.

---

## 5. Tab 3 — Patients

**Route:** `/receptionist/patients`
**Purpose:** Quickly look up patients, create new patient records, and access a patient's appointment history.

### 5.1 Page Layout

```
┌────────────────────────────────────────────────────────────────┐
│  SEARCH BAR  [Search by name, phone, or email...  🔍 ]        │
│              [Active Only toggle]       [+ New Patient button] │
├────────────────────────────────────────────────────────────────┤
│  PATIENT TABLE                                                 │
│  [row] [row] [row] ...                                         │
│  [pagination]                                                  │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 Search Bar

**Component: `<PatientSearchBar />`**

- Prominent single input field at the top
- Placeholder: "Search by name, phone number, or email..."
- Debounced search: 300ms after last keystroke, fires request
- Minimum 2 characters before search fires (show "Type at least 2 characters" hint otherwise)
- "Active Only" toggle switch — default ON (hides deactivated patients). Toggle off to show all.
- "＋ New Patient" button — top right — opens Create Patient Drawer (§8E)

**API:**
```
GET /api/v1/patients/?search={query}&is_active=true&page=1&page_size=20
```
> **Backend note:** The `search` param must search across `patients.name`, `patients.phone`, and `patients.email`. Add this if not already implemented.

### 5.3 Patient Table

**Component: `<PatientTable />`**

**Default state (no search):** Show all active patients sorted alphabetically by name, paginated 20 per page.

**Search state:** Show matching results sorted by relevance (exact match first).

#### Table Columns

| Column | Content |
|---|---|
| **Name** | Full name. Bold. |
| **Phone** | Phone number. Click-to-call link (`tel:`) on mobile. |
| **Email** | Email address. Truncated if long. |
| **Date of Birth** | Formatted date + age in brackets: "12 Jan 1985 (41 yrs)" |
| **Notifications** | "On" or "Off" label (based on `notification_opt_out`). A muted "Off" label if opted out. |
| **Status** | "Active" (green) or "Inactive" (grey) badge |
| **Actions** | See below |

#### Actions Column

- **"View / Edit"** — opens Patient Detail Drawer (§5.4)
- **"Book Appointment"** — opens Book Appointment Modal (§8A) pre-filled with this patient's ID. Saves the receptionist from re-searching.

#### Empty State

- **No search, no patients:** "No patients yet. Create the first patient record."
- **Search, no results:** "No patients found for '[query]'. Check the spelling or create a new patient record." + "Create Patient" CTA.

### 5.4 Patient Detail Drawer

**Component: `<PatientDetailDrawer />`** — Slides in from the right (width: 520px, full height).

**Trigger:** "View / Edit" action in patient table.

**API:**
```
GET /api/v1/patients/{id}
```

#### Drawer Header
- Patient full name (large, bold)
- "Active" / "Inactive" status badge
- "Edit" toggle button — switches the drawer fields into editable mode
- "Close" (X) button

#### Section 1 — Personal Info

Fields (read-only by default, editable when Edit mode active):
- Full Name
- Phone
- Email
- Date of Birth (date picker in edit mode)
- Gender (select: Male / Female / Other / Prefer not to say)
- Notification Opt-Out toggle (labelled: "Opt out of SMS/Email reminders")

**Save button** (visible in edit mode): Calls `PUT /api/v1/patients/{id}`. On success, show success toast and return to read-only mode.

#### Section 2 — Upcoming Appointments

Title: "Upcoming Appointments"

Compact list (not a full table) of future appointments for this patient:
- Each entry: Date & Time · Service · Provider · Status badge
- Maximum 5 shown, "View all" link below (links to Appointments tab with this patient pre-filtered)
- "Book New Appointment" shortcut button

**API:**
```
GET /api/v1/appointments/?patient_id={id}&date_from=today&status=scheduled,checked_in,in_progress&page_size=5
```
> **Backend note:** The `patient_id` filter param needs to be supported on `GET /api/v1/appointments/`. Add if missing.

#### Section 3 — Past Appointments

Collapsed by default. Click "Show history" to expand.

**API:**
```
GET /api/v1/appointments/?patient_id={id}&date_to=yesterday&page_size=10&sort=date_desc
```

Compact list: Date · Service · Provider · Status badge (completed/cancelled/no-show).

---

## 6. Tab 4 — Waitlist

**Route:** `/receptionist/waitlist`
**Purpose:** View and manage the live waiting queue for patients who couldn't get a slot. Assign patients from waitlist to available slots.

### 6.1 Page Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  HEADER: "Waitlist Queue"   [+ Add to Waitlist button]            │
├────────────────────────────────────────────────────────────────────┤
│  WAIT TIME ESTIMATES STRIP  (service by service)                   │
├────────────────────────────────────────────────────────────────────┤
│  FILTER BAR  [Service ▼] [Priority ▼] [Status ▼]                 │
├────────────────────────────────────────────────────────────────────┤
│  WAITLIST TABLE                                                    │
│  [row] [row] [row] ...                                             │
└────────────────────────────────────────────────────────────────────┘
```

### 6.2 Wait Time Estimates Strip

**Component: `<WaitTimeEstimatesStrip />`**

Horizontal scrollable strip of cards, one per active service that currently has waiting entries.

Each card shows:
- Service name
- "~X min wait" (estimated wait time for position 1)
- Count badge: "3 waiting"
- Small progress bar visual (how many out of typical daily capacity are queued)

**API (per service):**
```
GET /api/v1/waitlist/estimated-wait/{service_id}
```
> **Backend note:** This endpoint should return `{ estimated_minutes: number, queue_count: number }`. Confirm the response shape matches. If the endpoint doesn't exist yet, **create it** (see System Design §8.6 for the estimation algorithm).

Cards update via WebSocket (`waitlist_entry_added`, `queue_positions_updated` events).

### 6.3 Filter Bar

| Control | Options |
|---|---|
| Service | Dropdown — all services. Default: "All Services" |
| Priority | Multi-select: Emergency, Urgent, Standard. Default: all |
| Status | Multi-select: Waiting, Assigned, Cancelled, Expired. Default: Waiting only |

**API:**
```
GET /api/v1/waitlist/?service_id=...&priority=...&status=waiting&sort=priority_desc,queue_position_asc
```

### 6.4 Waitlist Table

**Component: `<WaitlistTable />`**

Real-time table — rows update via WebSocket without full re-render.

#### Table Columns

| Column | Content |
|---|---|
| **Position** | Queue position number (#1, #2...) within same priority tier. Large, bold. |
| **Priority** | Pill badge — Emergency (red), Urgent (amber), Standard (grey) |
| **Patient** | Full name. Phone below in muted text. |
| **Service** | Service name. |
| **Preferred Provider** | Provider name or "Any Available" if `provider_id = null` |
| **Requested Date** | Date or "First Available" if `requested_date = null` |
| **Waiting Since** | Relative time: "23 min ago", "2 hrs ago". Full timestamp on hover (tooltip). |
| **Est. Wait** | "~15 min" or "Unknown" if cannot estimate. |
| **Status** | Badge: Waiting (amber pulse animation to indicate live), Assigned (green), Cancelled (grey), Expired (red) |
| **Actions** | See below |

#### Actions Column

**Status = `waiting`:**
- Primary button: **"Assign Now"** — opens Assign from Waitlist Modal (§6.5)
- Text link: **"Cancel"** — inline popover confirmation: "Remove [Patient Name] from waitlist?" → on confirm: `DELETE /api/v1/waitlist/{id}`. Show success toast.

**Status = `assigned`:**
- "View Appointment" link → opens Appointment Detail Drawer for the linked appointment (`assigned_appointment_id`)

**Status = `cancelled` / `expired`:**
- Row shown muted, no actions

#### Empty State (Waiting = 0)

Icon + message: "No patients in the waiting queue" + "Great news — everyone has been seen or has a slot."

#### Row Animation

When a new entry arrives via WebSocket (`waitlist_entry_added`), animate the new row sliding in from the top of its priority group. When a position number changes, briefly animate the number changing (CSS transition).

### 6.5 Assign from Waitlist Modal

**Trigger:** "Assign Now" button on a waiting entry.

**Component: `<AssignWaitlistModal />`** — Modal dialog (not a drawer).

**Header:** "Assign [Patient Name] — [Service Name]"

**Body:**

Step 1 — Provider Selection:
- List of eligible providers for this service, sorted by least loaded first
- Each provider row: Name · Capacity (e.g., "3/8") · Status badge · "Next available slot" time
- Radio button to select a provider
- If no providers available, show: "No providers available for this service right now. Consider scheduling for a future date."

Step 2 — Slot Selection (appears after provider selected):
- Date picker (defaults to `requested_date` if set, else today)
- Time slot picker — grid of available time slots (30-min increments, greyed out if unavailable)

**API to load available slots:**
```
GET /api/v1/providers/{provider_id}/available-slots?date=YYYY-MM-DD&service_id=...
```
> **Backend note:** This endpoint needs to exist. It should return a list of available time slots based on provider availability, existing appointments, and the service duration. See System Design §15. **Create this endpoint if it doesn't exist.**

**Footer:**
- Cancel button
- "Assign & Book" button — disabled until provider + slot selected. On click:
  - Creates appointment: `POST /api/v1/appointments/` with `{ patient_id, provider_id, service_id, appointment_start, priority, assigned_from_waitlist: true }`
  - On success: closes modal, shows toast "Appointment booked for [Patient Name]", the waitlist row updates to "Assigned" status automatically via WebSocket

---

## 7. Tab 5 — My Profile

**Route:** `/receptionist/profile`
**Purpose:** Personal account settings. Secondary screen, no operational urgency.

### 7.1 Page Layout

Two cards stacked vertically, centered with max-width 640px.

### 7.2 Card 1 — Profile Info

**Component: `<ProfileInfoCard />`**

**API — initial load:**
```
GET /api/v1/profile/me
```

Fields (all editable):
- Full Name (text input)
- Email (text input, read-only display — email changes not supported via this form; show note: "Contact admin to change email")
- Role (text, read-only: "Receptionist")

"Save Changes" button: calls `PUT /api/v1/profile/me` with `{ name }`. On success: success toast "Profile updated". On error: inline error below form.

### 7.3 Card 2 — Change Password

**Component: `<ChangePasswordCard />`**

Fields:
- Current Password (password input)
- New Password (password input + strength meter)
- Confirm New Password (password input)

**Password strength meter** — renders below New Password field:
- Weak (red bar, 1/4)
- Fair (amber bar, 2/4)
- Strong (green bar, 3/4)
- Very Strong (green bar, 4/4)
- Strength is computed client-side: length ≥ 8 chars, contains uppercase, lowercase, number, special char

**Validation before submit:**
- New Password and Confirm must match (show error inline if not)
- New Password must pass minimum strength (warn if Weak — don't block, just show warning)

**Save button:** Calls `PUT /api/v1/profile/change-password` with `{ current_password, new_password }`. On success: success toast + clear all three fields. On 401 error (wrong current password): show inline error "Current password is incorrect".

---

## 8. Shared Modals & Drawers

These components are launched from multiple tabs and from the floating "Book Appointment" button.

---

### 8A. Book Appointment Modal (Full Booking Flow)

**Component: `<BookAppointmentModal />`** — Large modal dialog (width: 720px).
**Trigger:** FAB button (all tabs), empty calendar slot click, "Book New Appointment" shortcuts, Today's Queue empty state CTA.

This is the most complex and most used form in the entire dashboard. It implements the full scheduling algorithm from the System Design doc.

#### Step 1 — Patient

**Sub-component: `<PatientStep />`**

- Large search input: "Search patient by name, phone, or email..."
- Debounced live search (300ms) as user types
- Dropdown results below input: up to 5 matching patients shown as cards (Name · Phone · Email)
- Selecting a patient from dropdown: patient card appears below input (name, phone, email, DOB) with an X to deselect
- "＋ Create New Patient" link at bottom of results dropdown — expands an inline mini-form (Name, Phone, Email required; DOB optional) → calls `POST /api/v1/patients/` on submit → selects the newly created patient automatically

**API (search):**
```
GET /api/v1/patients/?search={query}&is_active=true&page_size=5
```

**State guard:** "Next" button on Step 1 is disabled until a patient is selected.

---

#### Step 2 — Service & Priority

**Sub-component: `<ServicePriorityStep />`**

**Service selection:**
- Display services grouped by category
- Each service shown as a selectable card: Service Name · Duration · (Fee if available)
- Only `is_active = true` services shown
- Selecting a service highlights it with a border

**API:**
```
GET /api/v1/services/?is_active=true
GET /api/v1/services/categories
```

**Priority selection:**
- Three large radio button cards:
  - **Standard** — "Regular appointment, next available slot"
  - **Urgent** — "Patient needs to be seen today if possible"
  - **Emergency** — "Immediate attention required — skips queue, overrides capacity if needed" (show a warning note: "Emergency cases are logged and require provider confirmation")
- Default: Standard

**State guard:** "Next" disabled until service selected.

---

#### Step 3 — Provider & Time Slot

**Sub-component: `<ProviderSlotStep />`**

This step fires the availability and conflict detection logic.

**Date picker:**
- Default: today
- Min date: today (cannot book in the past)
- Changing the date reloads available providers and slots

**Provider selection mode toggle:**
- "Auto-assign (Recommended)" — system picks the least-loaded eligible provider (round-robin)
- "Choose Provider" — shows provider picker

**If "Auto-assign" selected:**
- Display the auto-selected provider: Name · Specialization · Current load
- Note: "Selected via least-loaded assignment"
- "Override and choose manually" link

**If "Choose Provider" selected:**
- Grid of eligible provider cards
- Each card: Name · Specialization · Capacity bar (e.g., "3/8 booked") · Status chip
- Providers at full capacity shown with a "Full" badge (still selectable for Emergency priority, greyed out and unselectable for Standard/Urgent)
- Providers on time-off shown with "On Leave" badge — unselectable

**API to load eligible providers:**
```
GET /api/v1/providers/?service_id={service_id}&date={date}&priority={priority}
```
> **Backend note:** This needs a filter endpoint that accepts `service_id`, `date`, and `priority` to return eligible providers filtered by the scheduling algorithm. If this doesn't exist, **create this endpoint** — it's critical for the booking flow. It should run the eligibility checks from System Design §6.1.

**Time slot picker (appears after provider selected):**
- Visual grid of time slots for the chosen date and provider
- Slots based on the service duration (e.g., if service = 30 min, show 30-min slots)
- Available slots: selectable
- Taken / conflicting slots: greyed out, show tooltip on hover explaining why (e.g., "Already booked", "Provider break time")
- Outside availability hours: greyed out

**API to load available slots:**
```
GET /api/v1/providers/{provider_id}/available-slots?date=YYYY-MM-DD&service_id={service_id}
```
> **Backend note:** **Create this endpoint if it does not exist.** Response should be an array of: `{ start: ISO_timestamp, end: ISO_timestamp, available: boolean, reason_if_unavailable: string }`.

**Notes field (optional, bottom of this step):**
- Textarea, placeholder: "Special instructions, reason for visit, or clinical notes..."
- Max 500 characters

---

#### Conflict Handling in Step 3

If user selects a slot that conflicts (or if API reports a conflict on submit):

Display a conflict resolution panel in-modal (don't close the modal):

```
┌─────────────────────────────────────────────────────────┐
│  ⚠ Scheduling Conflict                                   │
│  Dr. Smith is unavailable at 10:00 AM                   │
│                                                         │
│  Alternative Providers:                                 │
│  [Dr. Jones — 10:00 AM available]  → Select            │
│  [Dr. Park  — 10:30 AM available]  → Select            │
│                                                         │
│  Alternative Times (same provider):                     │
│  [11:00 AM]  [11:30 AM]  [2:00 PM]  → Select           │
│                                                         │
│  Or: [Add to Waitlist instead]                          │
└─────────────────────────────────────────────────────────┘
```

Clicking any suggestion auto-fills the provider + time slot fields above and dismisses the conflict panel.

"Add to Waitlist instead" → closes this modal and opens Add to Waitlist Modal (§8F) pre-filled with patient, service, priority.

---

#### Step 4 — Confirmation & Submit

**Sub-component: `<ConfirmationStep />`**

Read-only summary of the booking:

```
Patient:    Jane Doe  (09876-543210)
Service:    General Consultation  (30 min)
Provider:   Dr. Sarah Smith
Date/Time:  Wednesday, 2 April 2026 · 10:30 AM
Priority:   Standard
Notes:      [notes if entered]
```

**Action buttons:**
- "Back" — returns to Step 3 to change anything
- "Confirm Booking" — submits the appointment

**API:**
```
POST /api/v1/appointments/
Body: {
  patient_id,
  provider_id,
  service_id,
  appointment_start,   ← ISO timestamp
  priority,
  notes
}
```

**On success:**
- Close modal
- Show toast: "Appointment booked — APT-20260402-012 · Dr. Smith · 10:30 AM"
- If user is on Today's Queue tab (and appointment is for today), the new row appears in the queue table via WebSocket automatically

**On error (409 Conflict from API):**
- Do NOT close modal
- Jump back to Step 3 and display the conflict resolution panel

---

#### Modal Progress Indicator

Stepper at the top of the modal:
```
[1 Patient] → [2 Service] → [3 Schedule] → [4 Confirm]
```
Completed steps shown with a checkmark. Clicking a completed step goes back to it.

---

### 8B. Appointment Detail Drawer

**Component: `<AppointmentDetailDrawer />`** — Slides in from the right, full height, width 540px.
**Trigger:** Clicking any appointment row (queue table, list view, calendar block, patient detail upcoming list).

**API:**
```
GET /api/v1/appointments/{id}
```

#### Drawer Header

- Appointment number (APT-YYYYMMDD-NNN) — monospace, muted
- Patient full name — large, bold
- Close (X) button

#### Section 1 — Status Banner

Full-width status banner at the top:
- Background color matches status (same as table row colors)
- Shows current status in large text + status-driven action buttons (same buttons as the queue table §3.4.3)
- For Emergency: show a prominent "EMERGENCY" banner above

#### Section 2 — Appointment Details

Two-column layout:

| Label | Value |
|---|---|
| Service | Service name |
| Duration | "30 min + 5 min buffer" |
| Provider | Provider full name |
| Date | "Wednesday, 2 April 2026" |
| Time | "10:30 AM – 11:00 AM" |
| Priority | Badge |
| Booked By | Staff member name who created the booking |
| Booked At | When the booking was created |
| From Waitlist | "Yes" (if `assigned_from_waitlist = true`) |

#### Section 3 — Patient Info

- Name · Phone · Email · DOB · Gender
- "View Full Patient Record" link → opens Patient Detail Drawer (§5.4) — both drawers can be open simultaneously (stack them)

#### Section 4 — Timeline

Visual timeline of status changes with timestamps:
- Scheduled at: [timestamp]
- Checked in at: [timestamp] (if `checked_in_at` set)
- Completed at: [timestamp] (if `completed_at` set)
- Cancelled at: [timestamp] + Reason (if cancelled)

#### Section 5 — Notes

Display `appointments.notes` in a text block. If empty, show "No notes." If status is `scheduled` or `checked_in`, show an "Edit Notes" link that makes the notes field inline-editable. Save via `PATCH /api/v1/appointments/{id}` with `{ notes }`.

> **Backend note:** A `PATCH /api/v1/appointments/{id}` endpoint for updating editable fields (notes, priority) needs to exist. Add if missing.

---

### 8C. Cancel Appointment Dialog

**Component: `<CancelAppointmentDialog />`** — Compact modal, width 480px.
**Trigger:** "Cancel" action from queue table, list view, or detail drawer.

**Header:** "Cancel Appointment"

**Body:**
- Patient name and appointment summary (read-only): "Jane Doe · General Consultation · 10:30 AM · Dr. Smith"
- Reason textarea (required): "Reason for cancellation*"
  - Placeholder: "e.g., Patient request, provider unavailable, rescheduling..."
  - Min 10 characters

**Warning note:** "Cancelling this appointment will free the slot. If there are patients on the waitlist for this service, one will be automatically assigned."

**Footer:**
- "Keep Appointment" (secondary/cancel)
- "Cancel Appointment" (danger button — disabled until reason filled in)

**API on confirm:**
```
PATCH /api/v1/appointments/{id}/status
Body: { "status": "cancelled", "cancellation_reason": "..." }
```

**On success:** Close dialog, show toast "Appointment cancelled — slot freed". The queue table updates via WebSocket.

---

### 8D. Reschedule Appointment Flow

**Component: `<RescheduleFlow />`** — Reuses the Book Appointment Modal shell.
**Trigger:** "Reschedule" from the ⋮ More menu on queue table rows and list view rows.

The reschedule flow is cancel + re-book atomically.

**How it works:**
1. Open Book Appointment Modal pre-filled with: patient (locked, non-editable), service (pre-selected, changeable), priority (pre-selected, changeable)
2. Show a yellow info banner at the top of the modal: "Rescheduling APT-20260402-007 · The original appointment will be cancelled when you confirm the new time."
3. User selects new date, provider, time slot
4. On confirmation step — summary shows "Original: [date/time]" and "New: [date/time]"
5. "Confirm Reschedule" button calls:
```
POST /api/v1/appointments/{id}/reschedule
Body: { provider_id, appointment_start, service_id, notes }
```
> **Backend note:** This endpoint wraps cancel + re-book in a single DB transaction. If the new slot has a conflict, the original appointment is NOT cancelled (the transaction rolls back). See System Design §10.3. **Create this endpoint** — it is required for safe rescheduling.

**On success:** Toast "Appointment rescheduled — new APT number shown". Old row disappears from queue (if today), new row appears.

---

### 8E. Create / Edit Patient Drawer

**Component: `<PatientFormDrawer />`** — Slides from right, width 480px.
**Trigger:** "＋ New Patient" (Patient tab) · "＋ Create New Patient" link inside Book Appointment Modal.

**Mode: Create** — all fields empty, save calls `POST /api/v1/patients/`
**Mode: Edit** — fields pre-filled, save calls `PUT /api/v1/patients/{id}`

#### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Full Name | Text input | Yes | |
| Phone | Tel input | No | Format hint shown |
| Email | Email input | No | Required if notification opt-in is ON |
| Date of Birth | Date picker | No | |
| Gender | Select | No | Male / Female / Other / Prefer not to say |
| Notification Opt-Out | Toggle switch | No | Default: OFF (notifications enabled). Label: "Opt out of SMS/Email reminders" |

**Validation:**
- Name is required (min 2 chars)
- If email provided, must be valid format
- If phone provided, show formatted preview

**Footer:**
- "Cancel" — closes drawer without saving
- "Save Patient" (create mode) / "Save Changes" (edit mode)

**On create success:** Drawer closes, patient appears at top of patient table, success toast "Patient record created". If opened from within Book Appointment Modal, the new patient is automatically selected in Step 1 of the modal.

---

### 8F. Add to Waitlist Modal

**Component: `<AddToWaitlistModal />`** — Modal, width 560px.
**Trigger:** "＋ Add to Waitlist" (Waitlist tab) · "Add to Waitlist instead" from conflict resolution panel in booking modal.

**Fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| Patient | Search & select | Yes | Same patient search as Book Appointment Step 1 |
| Service | Select | Yes | Active services only |
| Priority | Radio cards | Yes | Standard / Urgent / Emergency |
| Preferred Provider | Select (optional) | No | "Any Available" is the default option. If specific provider preferred by patient. |
| Preferred Date | Date picker (optional) | No | Placeholder: "Leave blank for first available" |
| Notes | Textarea | No | Reason for visit, special instructions |

**Footer:**
- "Cancel"
- "Add to Waitlist" button

**API:**
```
POST /api/v1/waitlist/
Body: {
  patient_id,
  service_id,
  priority,
  provider_id,          ← null if "Any Available"
  requested_date,       ← null if not specified
  notes
}
```

**On success:** Close modal, toast "Added to waitlist — Position #[N] · [Service Name]". Waitlist table updates via WebSocket.

---

## 9. UI State Standards

Every data-displaying component must handle three states. No exceptions.

### 9.1 Loading State

Use skeleton placeholders — not spinners — for all primary content areas.

| Component | Skeleton Shape |
|---|---|
| Queue table | 6 skeleton rows, same column widths as real rows |
| Patient table | 10 skeleton rows |
| Waitlist table | 5 skeleton rows |
| KPI chips | 4 rectangular skeleton blocks |
| Provider sub-tabs | 4 pill skeleton shapes |
| Calendar | Grey block grid matching the time slots |
| Provider cards | 3 skeleton card shapes |

Spinners are only acceptable for: submit button loading state, inline async actions (not full-page or full-component loads).

### 9.2 Empty State

| Component | Message | CTA |
|---|---|---|
| Today's Queue | "No appointments scheduled today" | "Book Appointment" |
| Queue for specific provider | "Dr. [Name] has no appointments today" | "Book for Dr. [Name]" (pre-fills provider) |
| Appointments (filtered) | "No appointments match your filters" | "Clear Filters" |
| Patient table (no search) | "No patient records yet" | "Create First Patient" |
| Patient table (search) | "No patients found for '[query]'" | "Create New Patient" |
| Waitlist (waiting = 0) | "No patients in the waiting queue" | None (it's good news) |
| Upcoming appointments (patient drawer) | "No upcoming appointments" | "Book Appointment" (pre-fills patient) |

### 9.3 Error State

- **Network error / API 5xx:** Inline error banner inside the component (not a full-page error). Shows: "Failed to load [content]. [Retry] button."
- **API 4xx validation error:** Inline error below the specific field (form errors) or a banner at the top of the form with the API error message.
- **API 409 Conflict (booking):** Do not show a generic error. Route to conflict resolution UI (§8A conflict panel).
- **WebSocket disconnect:** Show grey dot in nav bar. Show a subtle persistent banner: "Live updates paused — reconnecting..." with auto-dismiss on reconnect.

### 9.4 Toast Notifications

Toasts appear top-right, stack vertically, auto-dismiss after 5 seconds, manually dismissable.

| Event | Toast Type | Message Template |
|---|---|---|
| Appointment booked | Success | "Appointment booked — [APT#] · [Provider] · [Time]" |
| Appointment cancelled | Info | "Appointment cancelled — slot freed" |
| Appointment rescheduled | Success | "Appointment rescheduled to [new date/time]" |
| Status updated (check in, complete, etc.) | Success | "[Patient Name] — [New Status]" |
| Patient created | Success | "Patient record created for [Name]" |
| Added to waitlist | Info | "[Name] added to waitlist — Position #[N]" |
| Waitlist assigned (via WS) | Success (with sound cue optional) | "[Name] auto-assigned from waitlist — slot available" |
| API error | Error | "Action failed — [specific reason from API]. Try again." |

---

## 10. WebSocket Event Handlers

Wire these at the dashboard root level. Pass update functions to child components via React Context or equivalent.

| Event | Channel | Action |
|---|---|---|
| `appointment_created` | `dashboard:global` | Add row to Today's Queue if date = today. Update provider capacity chip. Update KPI strip. |
| `appointment_status_changed` | `dashboard:global` | Find row by appointment ID. Update status badge + row style in-place. Update KPI strip counts. |
| `appointment_cancelled` | `dashboard:global` | Update row status in queue table. Update capacity chip. Show toast if not triggered by current user. |
| `queue_updated` | `queue:{provider_id}` | Re-sort and re-render queue for that provider's sub-tab. Update position numbers. |
| `capacity_updated` | `dashboard:global` | Update the capacity badge on the provider sub-tab for that provider. Update sidebar provider grid. |
| `waitlist_entry_added` | `waitlist:{service_id}` | Add new row to waitlist table (animate in). Update wait time estimate strip card for that service. |
| `waitlist_assigned` | `waitlist:{service_id}`, `dashboard:global` | Update waitlist row to "Assigned" status. Add corresponding appointment to queue table. Show toast. |
| `queue_positions_updated` | `waitlist:{service_id}` | Update position numbers in waitlist table rows (animate number change). |
| `provider_status_changed` | `dashboard:global` | Update provider sub-tab badge. Update sidebar provider grid. |

**WS reconnection strategy:**
1. Attempt reconnect every 3 seconds for the first 30 seconds
2. Then every 15 seconds
3. After 2 minutes of failure, switch to polling (30s interval) and show persistent "Live updates paused" banner
4. On reconnect: re-fetch all data (full page refresh of current tab data), dismiss banner, restore to WS mode

---

## 11. Role Guard & Permission Rules

All receptionist routes must be guarded client-side. If the logged-in user's role is not `receptionist`, redirect to their appropriate dashboard root.

| Feature | Receptionist Can |
|---|---|
| View all appointments (any provider, any patient) | ✅ Yes |
| Create appointments | ✅ Yes |
| Update appointment status (check-in, start, complete, no-show) | ✅ Yes |
| Cancel appointments | ✅ Yes |
| Create / Edit patients | ✅ Yes |
| Manage waitlist (add, cancel, assign) | ✅ Yes |
| Override capacity (Emergency admin override) | ❌ No — hide the override option; show "Contact admin for emergency override" message |
| Manage providers, services, roles | ❌ No — these routes are not accessible |
| View audit log | ❌ No |
| Approve time-off requests | ❌ No |

For any action the receptionist cannot perform, do not show the button/control at all (don't show it disabled — remove it from the DOM entirely to keep the UI clean).

---

## 12. API Quick Reference

| # | Method | Endpoint | Used In | Notes |
|---|---|---|---|---|
| 1 | GET | `/api/v1/profile/me` | Nav bar, Profile tab | On mount |
| 2 | PUT | `/api/v1/profile/me` | Profile tab | Update name |
| 3 | PUT | `/api/v1/profile/change-password` | Profile tab | |
| 4 | POST | `/api/v1/auth/logout` | Nav bar | |
| 5 | GET | `/api/v1/appointments/` | Appointments tab, Patient drawer | Supports filters: date_from, date_to, provider_id, service_id, status, search, patient_id |
| 6 | POST | `/api/v1/appointments/` | Book Appointment Modal | Full booking with conflict detection |
| 7 | GET | `/api/v1/appointments/{id}` | Detail Drawer | |
| 8 | PATCH | `/api/v1/appointments/{id}/status` | Queue table, List view, Detail Drawer | Status transitions |
| 9 | PATCH | `/api/v1/appointments/{id}` | Detail Drawer (notes edit) | ⚠️ Create if missing |
| 10 | POST | `/api/v1/appointments/{id}/reschedule` | Reschedule flow | ⚠️ Create if missing — atomic cancel+rebook |
| 11 | GET | `/api/v1/appointments/providers/{id}/queue` | Today's Queue | Per-provider ordered queue |
| 12 | GET | `/api/v1/appointments/providers/{id}/capacity` | Today's Queue, Sidebar | Booked/max counts |
| 13 | GET | `/api/v1/patients/` | Patients tab, Patient search in modals | Supports: search, is_active |
| 14 | POST | `/api/v1/patients/` | Create Patient Drawer | |
| 15 | GET | `/api/v1/patients/{id}` | Patient Detail Drawer | |
| 16 | PUT | `/api/v1/patients/{id}` | Patient Detail Drawer | |
| 17 | GET | `/api/v1/providers/` | Provider sub-tabs, filters, Book modal | |
| 18 | GET | `/api/v1/providers/?service_id=&date=&priority=` | Book modal Step 3 | ⚠️ Add filter params if missing |
| 19 | GET | `/api/v1/providers/{id}/available-slots` | Book modal Step 3, Assign Waitlist modal | ⚠️ Create if missing |
| 20 | GET | `/api/v1/services/` | Book modal Step 2, Filters | |
| 21 | GET | `/api/v1/services/categories` | Book modal Step 2 | |
| 22 | GET | `/api/v1/waitlist/` | Waitlist tab | Supports: service_id, priority, status |
| 23 | POST | `/api/v1/waitlist/` | Add to Waitlist modal | |
| 24 | DELETE | `/api/v1/waitlist/{id}` | Waitlist table | Cancel entry |
| 25 | GET | `/api/v1/waitlist/estimated-wait/{service_id}` | Waitlist estimates strip | ⚠️ Create if missing |
| 26 | POST | `/api/v1/waitlist/{id}/assign` | Assign Waitlist modal (alternative to POST appointments) | ⚠️ Create if missing |
| 27 | WS | `/ws/dashboard:global` | Entire dashboard | Connect on mount |
| 28 | WS | `/ws/waitlist:{service_id}` | Waitlist tab, Today's sidebar | One per service |
| 29 | WS | `/ws/queue:{provider_id}` | Today's Queue per provider | One per active provider |

**Legend:**
- ⚠️ = Endpoint may not exist in the current backend. Needs to be created or the existing endpoint needs new query param support. These are flagged so the backend team knows what to prioritize.

---

*MediSync Receptionist Dashboard Frontend Spec — Version 1.0 — April 2026 — Internal Use Only*