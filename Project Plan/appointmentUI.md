# MediSync — Admin Appointments Page Implementation Spec
**Route:** `http://localhost:3000/dashboard/admin/appointments`
**Version:** 1.0 | **Prepared for:** Frontend Development Team | **Date:** April 2026
**Scope:** End-to-end design and implementation guide for the Appointments management page inside the Admin dashboard — covering full appointment lifecycle, real-time queue monitoring, conflict management, scheduling, rescheduling, cancellation, no-show handling, and reporting.

---

## Table of Contents

1. [Mental Model & Design Decisions](#1-mental-model--design-decisions)
2. [Page Layout & File Structure](#2-page-layout--file-structure)
3. [Section A — KPI Command Bar](#3-section-a--kpi-command-bar)
4. [Section B — View Mode: Calendar](#4-section-b--view-mode-calendar)
5. [Section C — View Mode: List Table](#5-section-c--view-mode-list-table)
6. [Section D — View Mode: Provider Queue Board](#6-section-d--view-mode-provider-queue-board)
7. [Filter & Search Toolbar](#7-filter--search-toolbar)
8. [Appointment Detail Drawer](#8-appointment-detail-drawer)
9. [Book Appointment Modal — Full Scheduling Flow](#9-book-appointment-modal--full-scheduling-flow)
10. [Cancel Appointment Dialog](#10-cancel-appointment-dialog)
11. [Reschedule Appointment Flow](#11-reschedule-appointment-flow)
12. [No-Show Handling Dialog](#12-no-show-handling-dialog)
13. [Emergency Override Flow](#13-emergency-override-flow)
14. [Real-Time WebSocket Integration](#14-real-time-websocket-integration)
15. [Data Fetching & State Management](#15-data-fetching--state-management)
16. [UI State Standards](#16-ui-state-standards)
17. [Required Backend Endpoints](#17-required-backend-endpoints)
18. [API Quick Reference](#18-api-quick-reference)

---

## 1. Mental Model & Design Decisions

### 1.1 What This Page Does

The Admin Appointments page is the **operational control room** for the entire appointment system. Unlike the Receptionist dashboard (real-time front desk operations) or the Provider dashboard (personal queue management), the admin's view is about **oversight, correction, and historical analysis** across all providers, all patients, and all dates.

The admin needs to:
- Monitor today's live appointment flow across all providers simultaneously
- Book, reschedule, and cancel appointments on behalf of receptionists or to correct errors
- Override conflicts and capacity limits that receptionists cannot touch (emergency overrides)
- Review historical appointment data across any date range
- Identify patterns: which providers have high no-show rates, which time slots are underutilised, which services are most in demand

### 1.2 Admin vs. Receptionist Differences

The admin appointments page is **not** a copy of the receptionist appointments tab. Key differences:

| Capability | Receptionist | Admin |
|---|---|---|
| View appointments | Own day / near future | All dates, all providers, full history |
| Book appointments | Yes | Yes + Emergency capacity override |
| Cancel appointments | Yes (own bookings) | Yes (any appointment, any status) |
| Reschedule | Yes | Yes + overrides |
| Mark no-show | Yes | Yes |
| Check-in patients | Yes | Yes |
| Delete appointment records | No | No (soft states only) |
| View analytics / trends | No | Yes (Stats panel) |
| Bulk operations | No | Yes (bulk cancel, bulk reschedule) |
| Override scheduling rules | No | Yes (emergency override, capacity bypass) |
| Access past appointments | Limited | Full history, unlimited date range |
| Export data | No | Yes (CSV / PDF) |

### 1.3 Three View Modes

The page provides three distinct view modes, toggled by the user. Each mode is optimised for a different task:

- **Calendar View** — spatial, time-aware view for understanding the day's schedule. Best for: checking slot availability, spotting gaps, visualising provider workloads.
- **List / Table View** — data-dense paginated table for searching, filtering, and bulk operations across any date range. Best for: finding specific appointments, historical review, export.
- **Queue Board** — Kanban-style column-per-provider board showing today's live queue. Best for: real-time operational monitoring, status management across all providers simultaneously.

The default view on page load is **Calendar View** for today's date.

### 1.4 Admin-Exclusive Capabilities

Two admin-only flows must be clearly distinguished in the UI:

1. **Emergency Capacity Override** — when a provider is at full capacity but an emergency patient arrives, the admin can force-book past the `max_daily_appointments` limit. This must require explicit acknowledgment and is always logged.

2. **Status Correction** — admin can move any appointment to any valid status at any point (e.g., marking a `checked_in` appointment as `cancelled` — which receptionists cannot do). A reason is always required for admin overrides.

---

## 2. Page Layout & File Structure

### 2.1 File Structure (Next.js App Router)

```
app/
└── dashboard/
    └── admin/
        └── appointments/
            ├── page.tsx                          ← Root page — shell, view toggle, global state
            ├── components/
            │   ├── KPICommandBar.tsx             ← Live KPI strip at top
            │   ├── FilterToolbar.tsx             ← Search + filters (shared across views)
            │   ├── ViewToggle.tsx                ← Calendar | List | Queue Board buttons
            │   ├── views/
            │   │   ├── CalendarView.tsx          ← Day/Week/Month calendar
            │   │   ├── DayCalendar.tsx           ← Day sub-view
            │   │   ├── WeekCalendar.tsx          ← Week sub-view
            │   │   ├── MonthCalendar.tsx         ← Month sub-view
            │   │   ├── ListView.tsx              ← Paginated table
            │   │   └── QueueBoard.tsx            ← Provider kanban columns
            │   ├── AppointmentDetailDrawer.tsx   ← Shared detail panel (right slide-in)
            │   ├── BookAppointmentModal.tsx      ← Full scheduling flow modal
            │   ├── CancelDialog.tsx
            │   ├── RescheduleFlow.tsx
            │   ├── NoShowDialog.tsx
            │   └── EmergencyOverrideDialog.tsx
            └── hooks/
                ├── useAppointments.ts            ← list fetching + filters
                ├── useAppointmentActions.ts      ← status transitions, cancel, reschedule
                ├── useBooking.ts                 ← booking flow state machine
                └── useAppointmentWebSocket.ts    ← WS connection + event handlers
```

### 2.2 Page Header

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  Appointments                                               [+ Book Appointment]│
│  Manage, monitor, and analyse appointments across all providers.               │
└────────────────────────────────────────────────────────────────────────────────┘
```

- Title: "Appointments" (H1)
- Subtitle: "Manage, monitor, and analyse appointments across all providers."
- "＋ Book Appointment" — persistent CTA button, top right. Opens the Book Appointment Modal (§9). Always visible regardless of active view mode.

---

## 3. Section A — KPI Command Bar

**Component: `<KPICommandBar />`**

A persistent strip directly below the page header, always visible regardless of active view mode. Provides an at-a-glance operational snapshot of today's numbers. Updates in real-time via WebSocket.

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬──────────────────┐
│  Scheduled  │ Checked In  │ In Progress │  Completed  │  Cancelled  │    No-Show       │
│     38      │      4      │      3      │     47      │      6      │   5  (3.8%)      │
│  today      │  waiting    │  active now │  today      │  today      │  of 132 booked   │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴──────────────────┘
```

**Each KPI chip:**
- Large number (primary stat)
- Label below (context label)
- Clicking a chip **applies a status filter** to the current view — e.g., clicking "Cancelled · 6" instantly filters the table or calendar to show only today's cancelled appointments

**Additional chips (right side of the bar):**
- **Waitlist** — total patients currently waiting (`status = waiting`). Clicking navigates to `/dashboard/admin/waitlist`
- **Providers Active** — number of providers with at least one active appointment today

**API — initial load:**
```
GET /api/v1/appointments/stats/today
```
> **Backend note:** This endpoint needs to be **created**. Returns counts grouped by status for today. See §17.1.

**WebSocket updates:** Subscribe to `dashboard:global` channel. On `appointment_status_changed` and `appointment_created` events, update the relevant count chips without re-fetching.

---

## 4. Section B — View Mode: Calendar

**Component: `<CalendarView />`**

Default view on page load. Three sub-views toggled by Day | Week | Month buttons within the calendar header.

### 4.1 Calendar View Controls

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [< Prev]  April 2026  [Next >]  [Today]        [Day] [Week] [Month]        │
│            Thursday, 2 April 2026                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Date navigation arrows: move by day/week/month depending on active sub-view
- "Today" button: jump to current date
- Current period label: formats appropriately per sub-view
- Sub-view toggle: Day | Week | Month (persisted in `localStorage`)

---

### 4.2 Day View

**Component: `<DayCalendar />`**

The most detailed view. A vertical timeline divided into provider columns.

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  TIME   │  Dr. Smith (6/8) 🟡  │  Dr. Jones (3/8) 🟢  │  Dr. Park (8/8) 🔴     │
│─────────┼───────────────────────┼──────────────────────┼────────────────────────│
│  08:00  │                       │                      │                        │
│  08:30  │  [John Doe            │                      │  [Alice Brown          │
│  09:00  │   General Consult     │                      │   ECG Test             │
│  09:30  │   ● Completed]        │  [Sam Wilson         │   ● Completed]         │
│  10:00  │                       │   Blood Test         │                        │
│  10:30  │  [Jane Smith          │   ● In Progress]     │  [Robert Kim           │
│  11:00  │   ECG                 │                      │   Cardio Consult       │
│  11:30  │   ● Checked In]       │                      │   ● Scheduled]         │
│  12:00  │  ░░░ BREAK ░░░        │  ░░░ BREAK ░░░       │  [FULL]                │
│  ...    │                       │                      │                        │
└────────────────────────────────────────────────────────────────────────────────────┘
```

**Provider column headers:**
- Provider name
- Capacity chip: "6/8" with color coding (green < 70%, amber 70–99%, red = 100%)
- Status dot (available / on leave / busy)

**Provider column filtering:** By default, all active providers with appointments today are shown. The Filter Toolbar (§7) provider dropdown collapses or expands visible columns.

**Time slots:**
- Timeline: 07:00–20:00 (or provider availability range — whichever is wider across all visible providers)
- 15-minute row granularity on the axis; 30-minute visual grid lines
- Current time indicator: horizontal red line at current time (today only)

**Appointment blocks:**
- Height proportional to duration
- Status color fill (see color map in §5.3)
- Priority left-border treatment: thick red = emergency, amber = urgent, none = standard
- Block content: Patient name (first line), Service name (second line, truncated), Status badge (top-right corner of block)
- **Emergency blocks**: larger border treatment, "⚡ EMERGENCY" label always visible regardless of block height

**Block interactions:**
- **Click**: opens Appointment Detail Drawer (§8)
- **Hover**: tooltip showing full patient name, service, time range, provider, status
- **Empty slot click**: opens Book Appointment Modal (§9) with the provider and time slot pre-filled

**Non-working zones:**
- Time ranges outside the provider's `availability` records: darker background, not clickable
- Approved time-off periods: striped/hatched zone with "Time Off" label
- Break times: lighter striped zone with "Break" label

**Scroll behavior:** On load, the Day View auto-scrolls to the current time minus 30 minutes (so the current activity is visible without manual scrolling).

**API:**
```
GET /api/v1/appointments/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&provider_id={optional}
GET /api/v1/availability/{provider_id}     ← for working hours zones (cached)
GET /api/v1/time-off/{provider_id}         ← for time-off zones (cached)
```

---

### 4.3 Week View

**Component: `<WeekCalendar />`**

Seven columns (Mon–Sun), one row per provider, showing appointment density across the week.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│            │  Mon 31 Mar  │  Tue 1 Apr  │  Wed 2 Apr  │  Thu 3 Apr  │  ...   │
│────────────┼──────────────┼─────────────┼─────────────┼─────────────┼────────│
│  Dr. Smith │  ████░░ 6/8  │  ████ 4/8   │  ████████ 8/8│  ██░░ 2/8  │       │
│  Dr. Jones │  ████ 4/8    │  ████░░ 6/8 │  ██░░ 2/8   │  ████ 4/8  │       │
│  Dr. Park  │  ████░░ 5/8  │  ██░░ 2/8   │  ████████ 8/8│  ░░░ 0/8  │       │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Cells:** Each cell shows a horizontal capacity bar (filled segments = booked) and a "N/8" count. Color: green/amber/red by utilisation.

**Cell click:** Switches to Day View for that specific date and provider combination.

**Provider row click:** Filters to that provider in Day View.

**Overall week row (first row):** Shows aggregate across all providers per day — "Total: 23/32 across 4 providers". Clicking switches to Day View for that date with all providers visible.

**API:**
```
GET /api/v1/appointments/stats/weekly?date_from=Mon&date_to=Sun
```
> **Backend note:** This aggregate stats endpoint needs to be **created**. See §17.2.

---

### 4.4 Month View

**Component: `<MonthCalendar />`**

Standard 5–6 row calendar grid. High-level capacity and volume overview.

**Day cell content:**
- Total appointments count: "18 appts" (bold)
- Mini status bar: colored segments for completed / in-progress / scheduled proportions
- No-show count (if > 0): red "3 no-shows" badge
- Capacity warning: amber dot if any provider is at 100% on that day

**Today cell:** Distinct background highlight. Shows live count (updates via WS).

**Day cell click:** Navigates to Day View for that date.

**Appointment count tooltips:** Hovering a day cell shows a breakdown:
```
Thursday, 2 April
  Completed:  12
  Scheduled:  8
  Cancelled:  2
  No-Show:    1
  Total:      23
```

**API:**
```
GET /api/v1/appointments/stats/monthly?year=2026&month=4
```
> **Backend note:** Monthly aggregate stats endpoint to be **created**. See §17.3.

---

## 5. Section C — View Mode: List Table

**Component: `<ListView />`**

Full-width paginated data table. The primary view for historical lookup, searching across date ranges, bulk operations, and data export.

### 5.1 Table Header

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  Appointments  (1,243 results)         [Select All]   [Bulk Actions ▼]  [Export ▼]│
└──────────────────────────────────────────────────────────────────────────────────┘
```

- **Result count**: total matching the active filters
- **Select All**: selects all rows on the current page for bulk operations. A secondary "Select all 1,243 results" appears after page-select
- **Bulk Actions** dropdown (appears when rows are selected): Cancel Selected / Export Selected
- **Export** dropdown (always visible): Export CSV / Export PDF

### 5.2 Table Columns

| Column | Content | Sortable | Width |
|---|---|---|---|
| **☐** | Checkbox — for row selection (bulk ops) | No | 40px |
| **Apt #** | `appointment_number` e.g., `APT-20260402-007` — monospace | No | 160px |
| **Date & Time** | "2 Apr 2026 · 09:30 AM" — date on first line, time on second | Yes (default sort: date DESC) | 160px |
| **Patient** | Full name (bold), phone below in muted text | Yes | 180px |
| **Service** | Service name, duration below in muted | No | 160px |
| **Provider** | Provider name with specialty in muted below | Yes | 160px |
| **Priority** | Badge: Emergency / Urgent / Standard (Standard = no badge, just muted text) | Yes | 100px |
| **Status** | Status badge — color coded | Yes | 130px |
| **Duration** | Actual vs. scheduled — "28 min / 30 min" for completed; "30 min" for others | No | 100px |
| **Actions** | Context-sensitive action buttons | No | 160px |

**Column visibility:** A "Columns" button allows the admin to show/hide columns. Persisted in `localStorage`. Hidden columns are excluded from export.

### 5.3 Status Badge Color Map

| Status | Badge Style | Row Background |
|---|---|---|
| `scheduled` | Neutral outline | Default |
| `checked_in` | Filled info/blue | Subtle blue row tint |
| `in_progress` | Filled warning/amber, pulsing dot | Subtle amber row tint |
| `completed` | Filled success/green | Default (no tint — historical) |
| `cancelled` | Muted/grey | Grey row tint, patient name struck through |
| `no_show` | Filled danger/red, muted | Red row tint, muted row |

### 5.4 Actions Column per Status

Render only valid next-step actions per row. No disabled buttons — if an action is not available, it is not shown.

| Current Status | Primary Action | Secondary Actions |
|---|---|---|
| `scheduled` | **Check In** | Reschedule · Cancel · ⋮ (View, Mark No-Show) |
| `checked_in` | **Start** (→ in_progress) | Cancel · ⋮ (View) |
| `in_progress` | **Complete** | ⋮ (View, Cancel — admin only) |
| `completed` | *(none)* | View Details |
| `cancelled` | *(none)* | View Details |
| `no_show` | *(none)* | View Details |

**Status transitions fire:**
```
PATCH /api/v1/appointments/{id}/status
Body: { "status": "new_status" }
```

All transitions except cancellation do not require a confirmation — they are reversible or low-impact. Cancellation always opens the Cancel Dialog (§10).

### 5.5 Sorting

Clicking column headers with the sortable flag toggles ASC/DESC. Only one sort column active at a time. Sort indicator arrow shown in active column header.

Default: `appointment_start DESC` (most recent first across date range).

### 5.6 Pagination

```
Showing 1–50 of 1,243 appointments     [< Prev]  Page [  2  ] of 25  [Next >]
Rows per page: [25 ▼]  [50 ▼]  [100 ▼]
```

Default page size: 50. Options: 25 / 50 / 100. Selection persisted in `localStorage`.

### 5.7 Bulk Operations

**Available when 1+ rows are selected:**

**Bulk Cancel:**
- Button "Cancel Selected ([N])"
- Opens a compact bulk cancel dialog: "Cancel [N] selected appointments?" with a single shared reason text field
- Fires individual cancel API calls in parallel — shows progress: "Cancelling... (12/20)"
- On completion: toast "Cancelled [N] appointments." Failed rows highlighted in red with retry option

**Export Selected:**
- Exports only the selected rows (not the full filtered result set)
- Format options: CSV / PDF

**API — bulk cancel (individual calls in parallel):**
```
PATCH /api/v1/appointments/{id}/status
Body: { "status": "cancelled", "cancellation_reason": "Bulk cancellation by admin — [reason]" }
```
> **Backend note:** A `POST /api/v1/appointments/bulk/cancel` endpoint would be cleaner. See §17.4.

### 5.8 Export

**Export CSV:**
- Downloads a `.csv` file of all rows matching the current filters (not just the current page)
- Columns: Apt #, Date, Time, Patient Name, Patient Phone, Service, Provider, Priority, Status, Duration, Notes, Created By, Created At
- Filename: `medisync-appointments-YYYY-MM-DD.csv`

**Export PDF:**
- A formatted PDF report of the current filtered results
- Grouped by date, provider, or status (user selects grouping)
- Suitable for printing the day's schedule

**API — export:**
```
GET /api/v1/appointments/export?format=csv&date_from=&date_to=&provider_id=&status=&...
```
> **Backend note:** Export endpoint to be **created**. See §17.5.

---

## 6. Section D — View Mode: Provider Queue Board

**Component: `<QueueBoard />`**

A Kanban-style board showing today's live appointment queue per provider, side by side. Designed for real-time operational monitoring — the admin can see all providers' queues simultaneously without switching tabs.

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  Today's Queue Board — Thursday, 2 April 2026                    [Refresh: Live ●]│
├──────────────────────┬───────────────────────┬────────────────────────────────────│
│  Dr. Smith  🟡 6/8   │  Dr. Jones  🟢 3/8    │  Dr. Park  🔴 8/8                 │
│  ─────────────────── │  ─────────────────── │  ─────────────────────────────────│
│  ● IN PROGRESS       │  ● CHECKED IN         │  ● IN PROGRESS                    │
│  ┌─────────────────┐ │  ┌─────────────────┐  │  ┌────────────────────────────┐   │
│  │ John Doe        │ │  │ Sam Wilson       │  │  │ Alice Brown                │   │
│  │ Gen. Consult    │ │  │ Blood Test       │  │  │ ECG Test                   │   │
│  │ 09:30 AM ⚡     │ │  │ 10:30 AM        │  │  │ 09:00 AM                   │   │
│  │ [Complete] [⋮] │ │  │ [Start]   [⋮]  │  │  │ [Complete] [⋮]             │   │
│  └─────────────────┘ │  └─────────────────┘  │  └────────────────────────────┘   │
│                      │                       │                                    │
│  ● CHECKED IN        │  ● SCHEDULED (2)      │  ● SCHEDULED (5)                  │
│  ┌─────────────────┐ │  ┌─────────────────┐  │  (all at capacity — no slots)     │
│  │ Jane Smith      │ │  │ Robert Kim      │  │                                    │
│  │ ECG Test        │ │  │ Gen. Consult    │  │  ● COMPLETED (3)                  │
│  │ 10:00 AM        │ │  │ 11:00 AM        │  │  (collapsed — click to expand)    │
│  │ [Start]   [⋮]  │ │  │ [Check In] [⋮] │  │                                    │
│  └─────────────────┘ │  └─────────────────┘  │                                    │
│                      │  ┌─────────────────┐  │                                    │
│  ● SCHEDULED (3)     │  │ Maria Lee       │  │                                    │
│  [show 3 more ▼]     │  │ Blood Test      │  │                                    │
│                      │  │ 11:30 AM        │  │                                    │
│  ● COMPLETED (4)     │  │ [Check In] [⋮] │  │                                    │
│  [show 4 done ▼]     │  └─────────────────┘  │                                    │
└──────────────────────┴───────────────────────┴────────────────────────────────────┘
```

### 6.1 Column Structure

Each provider gets one column. Columns are ordered alphabetically by provider name by default. The admin can drag to reorder columns (order persisted in `localStorage`).

**Column header:**
- Provider name
- Capacity chip (N/max, color coded)
- Status dot (available / on leave / busy)
- A collapse toggle (⌄) to collapse the column to just the header — useful when monitoring many providers

**API — queue data:**
```
GET /api/v1/appointments/providers/{provider_id}/queue
```
Called per provider, in parallel, on board mount.

### 6.2 Queue Cards

Each appointment is a compact card. Cards within a column are grouped by status section:

1. **IN PROGRESS** — rendered at top, always expanded, 1 card max
2. **CHECKED IN** — rendered next, always expanded
3. **SCHEDULED** — rendered next, collapsed after 3 with "show N more ▼" toggle
4. **COMPLETED** — rendered at bottom, collapsed with "show N done ▼" toggle
5. Cancelled and no-show are NOT shown by default — toggle a "Show all" switch in column header

**Card elements:**
- Patient name (bold)
- Service name (truncated)
- Appointment time
- Priority badge (only for Emergency and Urgent — Standard is not shown to reduce noise)
- Action buttons — same as list view (§5.4)

### 6.3 Real-Time Updates

The Queue Board is the primary consumer of WebSocket events. Every mutation anywhere in the system should visually reflect in the correct provider's column immediately:

- New appointment created → new card appears in the correct column at the correct position (slide-in animation)
- Status changed → card moves between status sections (animated transition)
- Appointment cancelled → card disappears (fade-out)
- Provider capacity updated → column header chip updates

**WebSocket subscription:**
```
WS /ws/dashboard:global
WS /ws/queue:{provider_id}    ← one per visible provider column
```

### 6.4 Board-Level Controls

**Refresh mode toggle:** "Live ●" / "Paused ○" — when paused, WebSocket events are buffered but not applied to the board. A "N pending updates" badge shows. Clicking Resume applies all buffered updates at once. Useful for reading a specific card without it disappearing mid-read.

**Scroll sync:** All provider columns scroll together vertically (i.e., when you scroll down one column, all columns scroll to the same time position). This can be toggled off for independent column scrolling.

**Column filter:** A "Providers" multi-select above the board hides/shows specific provider columns. Defaults to all providers with appointments today.

---

## 7. Filter & Search Toolbar

**Component: `<FilterToolbar />`**

Persistent sticky bar directly below the KPI Command Bar. Applies to all three view modes simultaneously — changing a filter updates whichever view is active.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  [📅 Date: Today ▼]  [Provider: All ▼]  [Service: All ▼]  [Status: All ▼]         │
│  [Priority: All ▼]  [🔍 Search patient or Apt#...]  [Clear Filters]  [Calendar|List|Queue]│
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1 Date Range Control

The most important filter. A smart date picker with quick presets:

**Quick presets (dropdown):**
- Today (default)
- Yesterday
- This Week (Mon–Sun)
- Last Week
- This Month
- Last Month
- Last 30 Days
- Last 90 Days
- Custom Range → shows a date range picker (start date + end date)

**Display:** Shows the selected range as "2 Apr 2026" (single day) or "1 Apr – 30 Apr 2026" (range).

**Calendar View restriction:** In Calendar View, the date range maps to the current Day/Week/Month sub-view period. The date picker in Calendar View navigates the calendar; in List/Queue view it filters the table.

### 7.2 Provider Filter

Multi-select dropdown. Options: one checkbox per active provider. "Select All / Deselect All" at top.

In Queue Board view: checking/unchecking providers shows/hides their columns.

In Calendar Day View: checking/unchecking providers shows/hides their timeline columns.

**API — provider list for filter options:**
```
GET /api/v1/providers/
```
Loaded once on page mount, cached.

### 7.3 Service Filter

Single-select dropdown. "All Services" default. Options from:
```
GET /api/v1/services/
```
Loaded once on page mount, cached.

### 7.4 Status Filter

Multi-select chip group (not a dropdown — chips are more visually scannable for status):

```
[All] [Scheduled] [Checked In] [In Progress] [Completed] [Cancelled] [No-Show]
```

Default: All selected (no filter). Click "All" to reset. Individual chips toggle their status on/off.

### 7.5 Priority Filter

Multi-select dropdown: All / Emergency / Urgent / Standard.

### 7.6 Search Input

Free-text search. Searches against:
- Patient name (partial match)
- Patient phone
- Appointment number (`APT-YYYYMMDD-NNN`)

Debounced 300ms. Minimum 2 characters.

**API — search:**
```
GET /api/v1/appointments/?search={query}&...other_filters
```

### 7.7 Active Filter Chips

When any non-default filter is active, render active filter chips below the toolbar:

```
Filters:  [Dr. Smith ✕]  [Completed ✕]  [Apr 1–30 ✕]       [Clear All Filters]
```

Each chip has an ✕ to remove that individual filter. "Clear All Filters" resets everything to defaults.

### 7.8 Filter State & URL Sync

All filter state is reflected in the URL query string so deep links and browser back/forward work:

```
/dashboard/admin/appointments?view=list&date_from=2026-04-01&date_to=2026-04-30&provider_id=uuid&status=completed,cancelled&search=john
```

On page load, parse the URL and initialise filters from query params. If no query params, use defaults.

---

## 8. Appointment Detail Drawer

**Component: `<AppointmentDetailDrawer />`** — Right slide-in panel, full viewport height, width 560px.

**Trigger:** Clicking any appointment block (calendar), any row (list), any card (queue board).

**API — load full detail:**
```
GET /api/v1/appointments/{id}
```

### 8.1 Drawer Header

```
┌──────────────────────────────────────────────────────────────────┐
│  APT-20260402-007                    [STATUS BADGE]         [✕]  │
│  John Doe                                                        │
│  General Consultation · 09:30 AM – 10:00 AM · Dr. Smith         │
│                                                                  │
│  [Check In]  [Reschedule]  [Cancel]  [⋮ More Actions]           │
└──────────────────────────────────────────────────────────────────┘
```

**Action buttons in header — status-driven:**

| Current Status | Shown Buttons |
|---|---|
| `scheduled` | Check In · Reschedule · Cancel · ⋮ (Mark No-Show, Edit Notes) |
| `checked_in` | Start · Cancel (admin) · ⋮ (Mark No-Show, Edit Notes) |
| `in_progress` | Complete · ⋮ (Cancel — admin, Edit Notes) |
| `completed` | ⋮ (View Audit) |
| `cancelled` | ⋮ (View Audit) |
| `no_show` | ⋮ (View Audit) |

"⋮ More Actions" dropdown also contains: **View Activity Log** (links to audit log filtered to this appointment).

### 8.2 Section 1 — Status Timeline

Visual horizontal or vertical timeline showing the appointment's journey:

```
● Booked        ● Checked In     ○ In Progress     ○ Completed
  9:15 AM         10:28 AM         (pending)         (pending)
  by J. Smith
```

Completed steps have filled dots + timestamps. Future/pending steps have hollow dots. Cancelled or no-show states show a terminal step with a red dot.

Each step includes: who performed the action (user name) and when (timestamp).

### 8.3 Section 2 — Appointment Info

Two-column grid layout:

| Label | Value |
|---|---|
| Appointment # | `APT-20260402-007` (monospace) |
| Date | "Thursday, 2 April 2026" |
| Time | "09:30 AM – 10:00 AM (30 min)" |
| Service | "General Consultation" |
| Provider | "Dr. Sarah Smith · Cardiology" |
| Priority | Priority badge |
| Status | Status badge |
| Booked By | "Jane Doe (Receptionist)" |
| Booked At | "2 Apr 2026 · 09:12 AM" |
| From Waitlist | "Yes" (if `assigned_from_waitlist = true`) |
| Checked In At | Timestamp (if applicable) |
| Completed At | Timestamp (if applicable) |
| Cancellation Reason | Text (if cancelled) |

### 8.4 Section 3 — Patient Information

```
Patient                                          [View Patient Record →]
─────────────────────────────────────────────────────────────────────
Name          John Doe
Phone         01711-000000                          (tap to call on mobile)
Email         john@example.com
Date of Birth 12 Jan 1985  (41 yrs)
Gender        Male
Notifications ● Enabled
```

"View Patient Record →" navigates to `/dashboard/admin/patients/{patient_id}` in a new tab.

### 8.5 Section 4 — Appointment Notes

Displays `appointments.notes`. Admin can inline-edit:
- Click "Edit" (pencil icon) to make the field editable
- A textarea appears in place, with a "Save" button
- **API:**
  ```
  PATCH /api/v1/appointments/{id}
  Body: { "notes": "..." }
  ```

### 8.6 Section 5 — Activity Log (Collapsible)

Collapsed by default. Click "Show History" to expand.

Shows a chronological list of all activity log entries related to this appointment:

```
▼ Activity History (4 events)
  09:12 AM  Created by Jane Smith (Receptionist)
  10:28 AM  Checked in by Jane Smith (Receptionist)
  10:34 AM  Started by Dr. Sarah Smith (Provider)
  11:02 AM  Completed by Dr. Sarah Smith (Provider)
```

**API:**
```
GET /api/v1/activity-logs/?entity_type=appointment&entity_id={id}
```

---

## 9. Book Appointment Modal — Full Scheduling Flow

**Component: `<BookAppointmentModal />`** — Large modal, width 760px, max-height 90vh, scrollable.

**Trigger:** "＋ Book Appointment" button (page header), empty calendar slot click (pre-fills provider + time), empty card area in queue board.

The admin booking flow is the same as the receptionist flow plus one admin-only step: **Emergency Override**.

### 9.1 Step Indicator

```
[1. Patient]  →  [2. Service & Priority]  →  [3. Provider & Slot]  →  [4. Confirm]
```

Completed steps show a checkmark. Clicking a completed step navigates back to it.

---

### Step 1 — Patient

**Patient search:** Debounced free-text search by name, phone, or email.

```
[ 🔍 Search patient by name, phone, or email...                    ]

Results:
○  John Doe      01711-000000   john@example.com
○  John Smith    01712-000000   smith@example.com

[+ Create New Patient]
```

**Create New Patient (inline):** Expands below the search input:
- Full Name* · Phone · Email · Date of Birth · Gender · Notification Opt-Out

**API — search:**
```
GET /api/v1/patients/?search={query}&is_active=true&page_size=5
```

**API — create patient:**
```
POST /api/v1/patients/
```

State guard: "Next →" disabled until a patient is selected.

---

### Step 2 — Service & Priority

**Service selection:** Cards grouped by category. Each card: name, duration, fee, required specialization.

```
DIAGNOSTICS
  ┌──────────────────────────────────┐
  │ ECG Test                         │
  │ 45 min · ৳500 · Cardiology req. │
  └──────────────────────────────────┘

CONSULTATIONS
  ┌──────────────────────────────────┐
  │ General Consultation             │
  │ 30 min · ৳300 · No spec. req.   │
  └──────────────────────────────────┘
```

**Priority selection:** Three prominent radio cards:

```
[○ Standard]        [○ Urgent]        [○ Emergency ⚡]
Regular patient.    Needs attention   Immediate care.
Next available.     today.            Skip queue.
                                      Admin override
                                      may be needed.
```

**Emergency warning:** Selecting Emergency shows an amber info box:
> "Emergency appointments skip the queue and may override provider capacity limits. This action is logged and requires explicit confirmation."

**API — services:**
```
GET /api/v1/services/?is_active=true
GET /api/v1/services/categories
```

---

### Step 3 — Provider & Slot

**Date picker:** Default today. Min: today (cannot book past dates from this flow).

**Provider selection mode toggle:**
- **"Auto-assign (Recommended)"** — system selects least-loaded eligible provider. Shows selected provider as a preview card with their load.
- **"Choose Provider"** — grid of eligible provider cards:
  - Provider name + specialization
  - Capacity bar (N/max)
  - "Full" badge if at max — not selectable for Standard/Urgent. **Selectable for Emergency** (with override flag)
  - "On Leave" badge — not selectable

**API — eligible providers:**
```
GET /api/v1/providers/?service_id={id}&date={date}&priority={priority}
```
> **Backend note:** This filter combination needs to be supported. See §17.6.

**Slot picker:** Grid of 30-minute time slots for the selected date + provider.

```
08:00  08:30  09:00  09:30  10:00  10:30
[○]    [○]    [✓ taken] [○]   [○]    [○]
```

Available = selectable. Taken = greyed with tooltip reason. Outside working hours = darker background, not selectable.

**API — available slots:**
```
GET /api/v1/providers/{id}/available-slots?date=YYYY-MM-DD&service_id={id}
```
> **Backend note:** This endpoint needs to exist. See §17.7.

**Notes field (optional):** Textarea for special instructions. Max 500 chars.

**Conflict resolution panel (shown when a conflict is detected):**

```
┌───────────────────────────────────────────────────────────┐
│  ⚠ Scheduling Conflict                                    │
│  Dr. Smith is unavailable at 10:00 AM on 2 April          │
│                                                           │
│  Alternative Providers:                                   │
│  [Dr. Jones — 10:00 AM available]    [Select]             │
│  [Dr. Park  — 10:30 AM available]    [Select]             │
│                                                           │
│  Alternative Times with Dr. Smith:                        │
│  [11:00 AM]  [14:00 PM]  [15:30 PM] ← click to select   │
│                                                           │
│  [Add to Waitlist instead]                                │
│                                                           │
│  ─── Admin Options ─────────────────────────────────────  │
│  [Force Override — Emergency Only ⚡]                     │
└───────────────────────────────────────────────────────────┘
```

The "Force Override" option is **only shown to admins** and only when priority = Emergency. Clicking it opens the Emergency Override Dialog (§13).

---

### Step 4 — Confirm

Read-only summary of the booking:

```
┌──────────────────────────────────────────────────────────┐
│  Booking Summary                                         │
│  ──────────────────────────────────────────────────────  │
│  Patient    John Doe (01711-000000)                      │
│  Service    General Consultation (30 min)                │
│  Provider   Dr. Sarah Smith · Cardiology                 │
│  Date       Thursday, 2 April 2026                       │
│  Time       10:30 AM – 11:00 AM                          │
│  Priority   Standard                                     │
│  Notes      —                                            │
│                                                          │
│  [← Back]                      [Confirm Booking]         │
└──────────────────────────────────────────────────────────┘
```

**"Confirm Booking" button:**

**API:**
```
POST /api/v1/appointments/
Body: {
  patient_id,
  provider_id,
  service_id,
  appointment_start,      ← ISO 8601 timestamp
  priority,
  notes,
  override_capacity       ← boolean, only present and true for emergency override
}
```

**On success:** Modal closes. Toast: "Appointment booked — APT-20260402-015 · Dr. Smith · 10:30 AM". Calendar / List / Queue Board updates via WebSocket.

**On 409 Conflict (API-detected conflict):** Do NOT close modal. Return to Step 3 with conflict panel shown.

---

## 10. Cancel Appointment Dialog

**Component: `<CancelDialog />`** — Modal, 500px wide.

**Trigger:** "Cancel" button in list view, detail drawer, or queue board card.

```
┌──────────────────────────────────────────────────────────────┐
│  Cancel Appointment                                          │
│  ──────────────────────────────────────────────────────────  │
│  APT-20260402-007                                            │
│  John Doe · General Consultation · 10:30 AM · Dr. Smith     │
│                                                              │
│  Cancellation Reason* (required):                            │
│  [                                                       ]   │
│  [e.g., Patient request, provider unavailable, error...]     │
│                                                              │
│  ⚠ Cancelling this appointment will free the slot.          │
│    If patients are on the waitlist for General Consultation,  │
│    one will be automatically assigned to this freed slot.    │
│                                                              │
│  [Keep Appointment]                    [Confirm Cancellation]│
└──────────────────────────────────────────────────────────────┘
```

**Reason field:** Required. Min 10 characters. Cannot submit without it.

**Admin override note (shown for `checked_in` or `in_progress` status):**
```
⚠ Admin Action: Cancelling an appointment that is already [Checked In / In Progress]
  is an unusual action. This will be logged with your admin account.
```

**API:**
```
PATCH /api/v1/appointments/{id}/status
Body: { "status": "cancelled", "cancellation_reason": "..." }
```

**On success:** Dialog closes. Row/card/block updates to cancelled state via WebSocket. Toast: "Appointment cancelled — slot freed."

---

## 11. Reschedule Appointment Flow

**Component: `<RescheduleFlow />`** — Reuses the Book Appointment Modal shell (§9) but in reschedule mode.

**Trigger:** "Reschedule" button in list actions or detail drawer.

**Only available for:** `scheduled` status appointments. (Rescheduling a `checked_in` or `in_progress` appointment is not permitted — the patient is present.)

### Flow Behavior

1. Open the Book Appointment Modal with:
   - Step 1 (Patient) — locked, patient pre-filled and non-editable
   - Step 2 (Service & Priority) — pre-filled, editable
   - Step 3 (Provider & Slot) — empty, user must select new date/provider/slot
   - Yellow info banner at top: "Rescheduling APT-20260402-007 · Original: 2 Apr · 10:30 AM · Dr. Smith. The original appointment will be cancelled when you confirm the new slot."

2. On Step 4 (Confirm), summary shows:
   ```
   Original: 2 Apr 2026 · 10:30 AM · Dr. Smith
   New:      5 Apr 2026 · 11:00 AM · Dr. Jones
   ```

3. "Confirm Reschedule" button calls:
   ```
   POST /api/v1/appointments/{id}/reschedule
   Body: { provider_id, appointment_start, service_id, notes }
   ```
   > **Backend note:** This atomic reschedule endpoint wraps cancel + rebook in a single transaction. If the new slot has a conflict, the original appointment is NOT cancelled. See §17.8.

**On success:** Original appointment card transitions to cancelled (if visible); new appointment appears. Toast: "Rescheduled to 5 Apr · 11:00 AM · Dr. Jones."

---

## 12. No-Show Handling Dialog

**Component: `<NoShowDialog />`** — Compact modal, 440px wide.

**Trigger:** "Mark No-Show" from ⋮ More menu in list view or detail drawer.

**Available for:** `scheduled` and `checked_in` statuses only.

```
┌──────────────────────────────────────────────────────────────┐
│  Mark as No-Show                                             │
│  ──────────────────────────────────────────────────────────  │
│  John Doe · General Consultation · 10:30 AM · Dr. Smith     │
│                                                              │
│  ℹ Marking as no-show will:                                  │
│    · Free this appointment slot                              │
│    · Trigger automatic waitlist assignment (if queue exists) │
│    · Queue a follow-up notification to the patient           │
│    · Log this action in the activity trail                   │
│                                                              │
│  [Cancel]                              [Mark as No-Show]     │
└──────────────────────────────────────────────────────────────┘
```

No reason field required for no-show (unlike cancellation). The action itself is self-explanatory.

**API:**
```
PATCH /api/v1/appointments/{id}/status
Body: { "status": "no_show" }
```

**On success:** Slot freed, waitlist promotion triggered server-side, follow-up notification queued. Toast: "Marked as no-show — slot freed."

---

## 13. Emergency Override Flow

**Component: `<EmergencyOverrideDialog />`** — Modal, 520px wide.

**Trigger:** "Force Override — Emergency Only ⚡" in the conflict resolution panel of the booking modal.

This flow is for when a provider is at full capacity but an emergency patient must be seen immediately. Only admins can trigger this.

```
┌──────────────────────────────────────────────────────────────┐
│  ⚡ Emergency Capacity Override                               │
│  ──────────────────────────────────────────────────────────  │
│  This action will exceed Dr. Smith's daily limit of          │
│  8 appointments. Current: 8 booked.                          │
│                                                              │
│  Emergency appointment will be created as:                   │
│  · Status: Checked In (immediate attention)                  │
│  · Position: First in queue (ahead of all others)            │
│  · Priority: Emergency                                       │
│                                                              │
│  Override Reason* (required):                                │
│  [                                                       ]   │
│  [e.g., Cardiac emergency, walk-in trauma...]                │
│                                                              │
│  ⚠ This override will be logged with your admin account     │
│    and flagged in the activity report.                       │
│                                                              │
│  [ Cancel ]                  [ ⚡ Confirm Emergency Override ]│
└──────────────────────────────────────────────────────────────┘
```

**API:**
```
POST /api/v1/appointments/
Body: {
  patient_id,
  provider_id,
  service_id,
  appointment_start,
  priority: "emergency",
  notes,
  override_capacity: true,
  override_reason: "..."     ← admin-supplied reason, stored in activity log
}
```
> **Backend note:** The `override_capacity` and `override_reason` fields need to be supported by the booking endpoint. The backend should skip the `max_daily_appointments` check when `override_capacity = true` and the caller has admin role. The `override_reason` must be stored in `activity_logs.description`. See §17.9.

**On success:** Booking completes. The emergency appointment is placed at the front of the provider's queue. Toast: "⚡ Emergency appointment booked — Dr. Smith is now over capacity by 1."

---

## 14. Real-Time WebSocket Integration

### 14.1 Connection Setup

On page mount, connect to:
```
WS /ws/dashboard:global
```

Subscribe to individual provider queue channels for providers visible in the Queue Board:
```
WS /ws/queue:{provider_id}    ← per provider column
```

### 14.2 Event Handlers per View Mode

| WS Event | Calendar View | List View | Queue Board |
|---|---|---|---|
| `appointment_created` | Add block to correct slot | Prepend row to table (if matches filters) | Add card to correct column |
| `appointment_status_changed` | Update block color/badge | Update row status badge | Move card between status sections |
| `appointment_cancelled` | Remove block (greyed zone) | Update row to cancelled | Remove card (fade-out) |
| `queue_updated` | N/A | N/A | Re-sort cards in column |
| `capacity_updated` | Update column header chip | N/A | Update column header chip |
| `provider_status_changed` | Update column header status dot | N/A | Update column header status dot |

### 14.3 KPI Bar Updates

All WS events that change appointment counts trigger a recalculation of the KPI chips in the Command Bar. Maintain a local count map and update it on each event:

```typescript
// Local KPI state derived from WS events
const kpiCounts = {
  scheduled: 38,
  checked_in: 4,
  in_progress: 3,
  completed: 47,
  cancelled: 6,
  no_show: 5,
};

// On appointment_status_changed:
// kpiCounts[old_status]--
// kpiCounts[new_status]++
```

### 14.4 Reconnection Strategy

1. Attempt reconnect every 3 seconds (first 30 seconds)
2. Then every 15 seconds
3. After 2 minutes of failure: switch to 30-second polling on the active view
4. Show persistent "Live updates paused — reconnecting..." banner
5. On reconnect: re-fetch current view data, dismiss banner, restore WS

---

## 15. Data Fetching & State Management

### 15.1 On Page Mount (Parallel)

```typescript
await Promise.all([
  GET /api/v1/providers/,          // for filter dropdowns + column headers
  GET /api/v1/services/,           // for filter dropdowns + booking form
  GET /api/v1/specializations/,    // for booking form provider filtering
  GET /api/v1/appointments/stats/today, // for KPI command bar initial values
]);
```

### 15.2 View-Specific Data Fetching

Data fetching is triggered by view mode changes or filter changes.

**Calendar Day/Week view:**
```
GET /api/v1/appointments/?date_from=&date_to=&provider_id=  ← full detail needed
GET /api/v1/availability/{provider_id}                        ← working hours (cached per provider)
GET /api/v1/time-off/{provider_id}                           ← leave zones (cached per provider)
```

**Calendar Month view:**
```
GET /api/v1/appointments/stats/monthly?year=&month=          ← aggregate only
```

**List view:**
```
GET /api/v1/appointments/?...all_filters...&page=&page_size=  ← paginated
```

**Queue Board:**
```
GET /api/v1/appointments/providers/{id}/queue                 ← per provider, parallel
```

### 15.3 Filter State Structure

```typescript
interface AppointmentFilters {
  dateFrom: string;           // ISO date string
  dateTo: string;             // ISO date string
  providerIds: string[];      // UUIDs, empty = all
  serviceId: string | null;
  statuses: AppointmentStatus[];  // empty = all
  priorities: Priority[];     // empty = all
  search: string;
}
```

Filter state is initialised from URL query params on mount. Every filter change updates both local state and the URL (push to history).

---

## 16. UI State Standards

### 16.1 Loading States

| Component | Skeleton |
|---|---|
| KPI Command Bar | 6 rectangular chip skeletons |
| Calendar Day View | Grid of ~5 appointment block skeletons per provider column |
| Calendar Week View | 7×N cell grid skeleton |
| Calendar Month View | 35-cell grid with varying text line skeletons |
| List View | 10 table row skeletons with varying column widths |
| Queue Board | 3 column skeletons each with 3 card skeletons |
| Detail Drawer | Header skeleton + 4 section skeletons |

### 16.2 Empty States

| Scenario | Message | CTA |
|---|---|---|
| No appointments for selected date (Calendar) | "No appointments on [date]" | "+ Book Appointment" |
| No results for current filters (List) | "No appointments match your filters" | "Clear Filters" |
| Queue Board — provider column empty | "No appointments today for Dr. [Name]" | None |
| No appointments ever (fresh system) | "No appointments yet. Book the first one." | "+ Book Appointment" |

### 16.3 Error States

| Scenario | Response |
|---|---|
| Page data load fails | Full-page error with Retry button |
| Single view data fails | Inline error banner within the view area. Retry button. Other views still usable. |
| Status transition rejected by API | Toast error with API message. Row/card state reverts. |
| Booking conflict (409) | Modal stays open, conflict resolution panel appears. |
| Export fails | Toast error. |

### 16.4 Toast Notifications

| Action | Toast |
|---|---|
| Appointment booked | "Appointment booked — [APT#] · [Provider] · [Time]" |
| Appointment cancelled | "Appointment cancelled — slot freed" |
| Rescheduled | "Rescheduled to [new date/time] · [new provider]" |
| Status updated | "[Patient Name] — [New Status]" |
| No-show marked | "Marked as no-show — slot freed" |
| Emergency override | "⚡ Emergency booked — [Provider] is over capacity by 1" |
| Export started | "Preparing export... download will begin shortly" |
| Bulk cancel complete | "Cancelled [N] appointments" |
| WS event (not own action) | Subtle info toast: "[Patient] checked in — [Provider]" |
| Any API failure | "Action failed — [reason]. Try again." |

---

## 17. Required Backend Endpoints

---

### 17.1 GET today's appointment stats

**Endpoint to create:**
```
GET /api/v1/appointments/stats/today
```

**Response:**
```json
{
  "date": "2026-04-02",
  "counts": {
    "scheduled": 38,
    "checked_in": 4,
    "in_progress": 3,
    "completed": 47,
    "cancelled": 6,
    "no_show": 5,
    "total": 103
  },
  "no_show_rate_percent": 3.8,
  "active_providers": 4,
  "waitlist_count": 7
}
```

---

### 17.2 GET weekly appointment stats

**Endpoint to create:**
```
GET /api/v1/appointments/stats/weekly?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
```

**Response:**
```json
{
  "days": [
    {
      "date": "2026-03-31",
      "providers": [
        { "provider_id": "uuid", "provider_name": "Dr. Smith", "booked": 6, "max": 8 },
        { "provider_id": "uuid", "provider_name": "Dr. Jones", "booked": 4, "max": 8 }
      ],
      "total_booked": 10,
      "total_capacity": 16
    }
  ]
}
```

---

### 17.3 GET monthly appointment stats

**Endpoint to create:**
```
GET /api/v1/appointments/stats/monthly?year=2026&month=4
```

**Response:**
```json
{
  "year": 2026,
  "month": 4,
  "days": [
    {
      "date": "2026-04-01",
      "total": 23,
      "completed": 18,
      "cancelled": 2,
      "no_show": 1,
      "scheduled": 2
    }
  ]
}
```

---

### 17.4 POST bulk cancel appointments

**Endpoint to create (optional — improves performance over parallel individual calls):**
```
POST /api/v1/appointments/bulk/cancel
Body: {
  "appointment_ids": ["uuid1", "uuid2", ...],
  "cancellation_reason": "Bulk administrative cancellation"
}
Response: {
  "cancelled": ["uuid1", "uuid2"],
  "failed": [],
  "total": 2
}
```

---

### 17.5 GET export appointments

**Endpoint to create:**
```
GET /api/v1/appointments/export
Query params: format=csv|pdf, date_from, date_to, provider_id, service_id, status, priority, search
Response: File download (Content-Disposition: attachment)
```

Server-side: stream the file. For CSV use Python's `csv` module. For PDF use a library like `reportlab` or `weasyprint`.

---

### 17.6 GET eligible providers for booking

**Endpoint to create or extend:**
```
GET /api/v1/providers/?service_id={id}&date={YYYY-MM-DD}&priority={priority}
```

Returns only providers eligible to handle this booking:
- Linked to the service via `provider_services`
- `providers.status = 'available'`
- Not on approved time-off for the date
- If `priority = emergency`: `providers.emergency_enabled = true`
- Includes `today_booked_count` and `max_daily_appointments` so the frontend can show capacity

---

### 17.7 GET available slots for a provider

**Endpoint to create:**
```
GET /api/v1/providers/{id}/available-slots?date=YYYY-MM-DD&service_id={id}
```

**Response:**
```json
{
  "provider_id": "uuid",
  "date": "2026-04-02",
  "service_duration_minutes": 30,
  "slots": [
    { "start": "2026-04-02T08:00:00Z", "end": "2026-04-02T08:30:00Z", "available": true },
    { "start": "2026-04-02T08:30:00Z", "end": "2026-04-02T09:00:00Z", "available": false, "reason": "Already booked" },
    { "start": "2026-04-02T09:00:00Z", "end": "2026-04-02T09:30:00Z", "available": false, "reason": "Break time" }
  ]
}
```

Server-side logic: generate slots from `availability.start_time` to `availability.end_time` in steps of `service.duration_minutes + service.buffer_time_minutes`. Mark unavailable where existing appointments overlap or break times apply.

---

### 17.8 POST reschedule appointment (atomic)

**Endpoint to create:**
```
POST /api/v1/appointments/{id}/reschedule
Body: {
  "provider_id": "uuid",
  "appointment_start": "ISO 8601",
  "service_id": "uuid",
  "notes": "optional"
}
Response: {
  "cancelled_appointment": { ...original... },
  "new_appointment": { ...new... }
}
```

Wraps cancel + create in a single DB transaction. If the new slot has a conflict, the original appointment is NOT cancelled (transaction rolled back). Returns 409 if conflict detected.

---

### 17.9 POST appointment with emergency capacity override

**Extend existing endpoint:**
```
POST /api/v1/appointments/
Body: {
  ...normal booking fields...,
  "override_capacity": true,        ← new optional field
  "override_reason": "Cardiac emergency"  ← required when override_capacity = true
}
```

Backend must:
- Check that the caller has admin role before accepting `override_capacity = true`
- Skip the `max_daily_appointments` check when the flag is present
- Store `override_reason` in `activity_logs.description` with `action_type = "emergency_override"`
- Return 403 if a non-admin user sends `override_capacity: true`

---

### 17.10 GET appointments with extended filters

**Extend existing endpoint:**
```
GET /api/v1/appointments/
```

Ensure these query params are fully supported:
- `date_from` · `date_to` — range filter on `appointment_start`
- `provider_id` — single UUID filter
- `service_id` — single UUID filter
- `status` — comma-separated list: `?status=scheduled,checked_in`
- `priority` — comma-separated list: `?priority=emergency,urgent`
- `search` — partial match on `patients.name`, `patients.phone`, `appointment_number`
- `patient_id` — filter by specific patient
- `page` · `page_size` · `sort` · `sort_dir` — pagination and sorting
- `assigned_from_waitlist` — boolean filter

---

## 18. API Quick Reference

| # | Method | Endpoint | Status | Used In |
|---|---|---|---|---|
| 1 | GET | `/api/v1/appointments/` | ✅ Extend (add all filter params per §17.10) | List view, Calendar view |
| 2 | POST | `/api/v1/appointments/` | ✅ Extend (add `override_capacity` per §17.9) | Book Appointment modal |
| 3 | GET | `/api/v1/appointments/{id}` | ✅ Yes | Detail Drawer |
| 4 | PATCH | `/api/v1/appointments/{id}/status` | ✅ Yes | All status transitions |
| 5 | PATCH | `/api/v1/appointments/{id}` | ✅ Verify (notes update) | Detail Drawer notes edit |
| 6 | POST | `/api/v1/appointments/{id}/reschedule` | ⚠️ **Create** (§17.8) | Reschedule flow |
| 7 | POST | `/api/v1/appointments/bulk/cancel` | ⚠️ **Create** (§17.4, optional) | Bulk cancel |
| 8 | GET | `/api/v1/appointments/export` | ⚠️ **Create** (§17.5) | Export CSV/PDF |
| 9 | GET | `/api/v1/appointments/stats/today` | ⚠️ **Create** (§17.1) | KPI Command Bar |
| 10 | GET | `/api/v1/appointments/stats/weekly` | ⚠️ **Create** (§17.2) | Week View |
| 11 | GET | `/api/v1/appointments/stats/monthly` | ⚠️ **Create** (§17.3) | Month View |
| 12 | GET | `/api/v1/appointments/providers/{id}/queue` | ✅ Yes | Queue Board columns |
| 13 | GET | `/api/v1/appointments/providers/{id}/capacity` | ✅ Yes | Column headers, KPI bar |
| 14 | GET | `/api/v1/providers/` | ✅ Extend (add service_id, date, priority filter per §17.6) | Booking modal Step 3, Filter toolbar |
| 15 | GET | `/api/v1/providers/{id}/available-slots` | ⚠️ **Create** (§17.7) | Booking modal Step 3 slot picker |
| 16 | GET | `/api/v1/services/` | ✅ Yes | Booking modal Step 2, Filter toolbar |
| 17 | GET | `/api/v1/services/categories` | ✅ Yes | Booking modal Step 2 grouping |
| 18 | GET | `/api/v1/patients/` | ✅ Yes | Booking modal Step 1 search |
| 19 | POST | `/api/v1/patients/` | ✅ Yes | Booking modal Step 1 create |
| 20 | GET | `/api/v1/specializations/` | ✅ Yes | Booking modal provider filtering |
| 21 | GET | `/api/v1/availability/{provider_id}` | ✅ Yes | Calendar day view working hour zones |
| 22 | GET | `/api/v1/time-off/{provider_id}` | ✅ Yes | Calendar day view time-off zones |
| 23 | GET | `/api/v1/activity-logs/` | ✅ Yes | Detail Drawer activity log section |
| 24 | WS | `/ws/dashboard:global` | ✅ Yes | All real-time updates |
| 25 | WS | `/ws/queue:{provider_id}` | ✅ Yes | Queue Board per-column updates |

**Legend:**
- ✅ Yes = exists, use as-is
- ✅ Extend = exists but needs new params or response fields
- ✅ Verify = exists but double-check field support
- ⚠️ Create = must be built before frontend integration of that feature

---

*MediSync Admin Appointments Page Frontend Spec — Version 1.0 — April 2026 — Internal Use Only*