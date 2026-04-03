# MediSync — Provider Dashboard Frontend Implementation Spec
**Version:** 1.0 | **Prepared for:** Frontend Development Team | **Date:** April 2026
**Scope:** End-to-end implementation of the Provider (`/provider`) dashboard
**Prerequisite reading:** MediSync DB Schema v1.0 · Backend API Reference · Appointment Management System Design Doc · Receptionist Dashboard Spec v1.0

---

## Table of Contents

1. [Dashboard Shell & Layout](#1-dashboard-shell--layout)
2. [Global WebSocket Setup](#2-global-websocket-setup)
3. [Tab 1 — My Queue (Default Landing)](#3-tab-1--my-queue-default-landing)
4. [Tab 2 — My Schedule](#4-tab-2--my-schedule)
5. [Tab 3 — Availability & Time Off](#5-tab-3--availability--time-off)
6. [Tab 4 — My Profile](#6-tab-4--my-profile)
7. [Shared Drawers & Dialogs](#7-shared-drawers--dialogs)
   - 7A. Patient & Appointment Detail Drawer
   - 7B. Complete Appointment Dialog
   - 7C. Notes Editor Panel
8. [UI State Standards](#8-ui-state-standards)
9. [WebSocket Event Handlers](#9-websocket-event-handlers)
10. [Role Guard & Permission Rules](#10-role-guard--permission-rules)
11. [API Quick Reference](#11-api-quick-reference)

---

## 1. Dashboard Shell & Layout

### 1.1 Design Philosophy

The provider dashboard is a **service-delivery tool**, not a management tool. The provider's job is to see patients, complete appointments, and manage their own time. Every design decision should reduce friction in that loop. The screen should tell the provider exactly who is next, what service they need, and how the day is tracking — with minimal navigation.

The interface is intentionally **narrower in scope** than the Admin or Receptionist dashboards. Providers do not book appointments, manage patients, or touch any system configuration. They see only what is theirs.

### 1.2 Overall Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  TOP NAVIGATION BAR                                              │
│  [MediSync Logo]    [Live Status Toggle]   [Dr. Name]  [Logout]  │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│  TAB BAR (horizontal, sticky)                                    │
│  [My Queue]  [My Schedule]  [Availability & Time Off]  [Profile] │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   TAB CONTENT AREA (scrollable)                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 Top Navigation Bar

**Component: `<ProviderTopNav />`** — Fixed, full-width, z-index above content.

**Left:** MediSync logo — clicking it navigates to `/provider/queue` (default tab).

**Center: Live Status Toggle** — This is the most prominent control in the nav bar, intentionally placed center.

The provider's current `providers.status` is shown as an interactive toggle with three states:

```
[ ● Available ]   →   [ ◑ Partially Available ]   →   [ ○ On Leave ]
```

- Clicking cycles through: `available` → `partially_available` → `on_leave` → `available`
- Current state shown with distinct styling per status (filled, half-filled, hollow indicator)
- Changing status fires an immediate API call — no save button needed
- A small confirmation popover appears when switching to `on_leave`: "Mark yourself as On Leave? This will prevent new appointments from being booked for you." with Confirm and Cancel.

**API (status change):**
```
PATCH /api/v1/providers/{id}/status
Body: { "status": "available" | "partially_available" | "on_leave" }
```
> **Backend note:** A dedicated `PATCH /api/v1/providers/{id}/status` endpoint for providers to update their own status is needed. If only the full `PUT /api/v1/providers/{id}` exists, add this lightweight endpoint to avoid providers accidentally overwriting other profile fields. **Create this endpoint.**

**Right:**
- Provider's full name + specialization badge (e.g., "Dr. Sarah Smith · Cardiology")
- WebSocket connection indicator dot (green = live, grey = polling fallback)
- Logout button → `POST /api/v1/auth/logout`, clear session, redirect to `/login`

**Session timeout:** Same as receptionist — 25-minute inactivity warning modal, 30-minute auto-logout.

### 1.4 Tab Bar

**Component: `<ProviderTabBar />`** — Sticky below the nav bar.

Four tabs:
1. **My Queue** — `/provider/queue` — default landing tab
2. **My Schedule** — `/provider/schedule`
3. **Availability & Time Off** — `/provider/availability`
4. **My Profile** — `/provider/profile`

Active tab has a bottom border indicator. Scroll position resets to top on tab switch.

---

## 2. Global WebSocket Setup

### 2.1 Connections

On provider dashboard mount, open **two** WebSocket connections specific to the logged-in provider:

```
WS /ws/provider:{provider_id}      ← appointment and status events for this provider
WS /ws/queue:{provider_id}         ← real-time queue ordering updates
```

The `provider_id` is obtained from the profile API response on mount (`GET /api/v1/profile/me` returns the linked provider record).

> **Fallback:** On disconnect, fall back to 30-second polling on the My Queue tab only. Show grey connection dot. Attempt reconnect every 5 seconds (first 30s), then every 20 seconds. On reconnect, re-fetch current tab data.

### 2.2 On Mount Sequence

```
1. GET /api/v1/profile/me                → get user info + provider_id
2. GET /api/v1/providers/{id}            → get full provider profile (capacity, status, services)
3. Open WS /ws/provider:{provider_id}
4. Open WS /ws/queue:{provider_id}
5. Load default tab (My Queue)
```

---

## 3. Tab 1 — My Queue (Default Landing)

**Route:** `/provider/queue`
**Purpose:** The primary daily work screen. The provider sees exactly who is next, manages each patient through the service flow (start → complete), and tracks today's progress. This is the screen a provider keeps open all day.

### 3.1 Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  DAY SUMMARY HEADER                                              │
│  Today · [Date]        [Progress bar: 3 of 8 done]  [capacity]  │
├──────────────────────────────────────────────────────────────────┤
│                                        │                         │
│  QUEUE LIST (left, ~65% width)         │  CURRENT PATIENT PANEL  │
│                                        │  (right, ~35% width)    │
│  [card] Active patient (in_progress)   │  (sticky, always shows  │
│  [card] Next up (checked_in)           │   the in-progress or    │
│  [card] Scheduled patients...          │   next patient)         │
│  [card] ...                            │                         │
│  ─────────────────────────────────     │                         │
│  [card] Completed (muted, bottom)      │                         │
└────────────────────────────────────────┴─────────────────────────┘
```

On mobile (< 1024px): Stack layout — Current Patient Panel moves above the Queue List, both full width.

---

### 3.2 Day Summary Header

**Component: `<DaySummaryHeader />`**

**Left side:**
- "Today" label + full date ("Thursday, 2 April 2026")
- Day of week confirmation — important for providers checking they're on the right day

**Center:**
- Progress bar: filled from left to right as appointments are completed
- Label inside or below: "3 of 8 completed" (completed count / total scheduled today)
- Progress bar color shifts from neutral to a positive tone as it fills

**Right side:**
- Capacity chip: "5 / 8" (booked today / max daily)
- Color: green < 70%, amber 70–99%, red = 100%
- Small label: "slots filled"

**API — initial load:**
```
GET /api/v1/appointments/providers/{provider_id}/capacity
```
Response used: `{ booked_today, max_daily_appointments, completed_today }`

> **Backend note:** The capacity endpoint should return `completed_today` in addition to `booked_today` and `max_daily_appointments`. Add this field if missing.

This header updates in real-time via WebSocket `capacity_updated` and `appointment_status_changed` events.

---

### 3.3 Current Patient Panel

**Component: `<CurrentPatientPanel />`** — Right column, sticky (stays visible as user scrolls the queue list).

This panel shows the **active patient** — either `in_progress` (being served right now) or the next `checked_in` patient. Logic:

1. If any appointment is `in_progress` → show that appointment
2. Else if any appointment is `checked_in` → show that (next up)
3. Else → show "No active patient" empty state

#### Panel: Patient In Progress

```
┌──────────────────────────────────────┐
│  ● IN PROGRESS                       │
│                                      │
│  Patient Name                        │
│  (large, prominent)                  │
│                                      │
│  Service: General Consultation       │
│  Started: 10:32 AM                   │
│  Duration: 30 min                    │
│  Priority: [badge]                   │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Notes                        │  │
│  │  [notes text or "No notes"]   │  │
│  │  [Edit Notes link]            │  │
│  └────────────────────────────────┘  │
│                                      │
│  [ ✓  Complete Appointment ]  ← CTA │
│                                      │
└──────────────────────────────────────┘
```

**"Complete Appointment" button** — large, full-width primary button. Opens Complete Appointment Dialog (§7B).

**"Edit Notes" link** — opens inline Notes Editor (§7C) within this panel.

**Elapsed time counter** — live counter below "Started: [time]", shows "running for 12 min" and counts up every minute. Renders in amber when elapsed time exceeds the scheduled service duration.

#### Panel: Next Patient (Checked In, No In-Progress)

```
┌──────────────────────────────────────┐
│  ◑ NEXT UP — CHECKED IN              │
│                                      │
│  Patient Name                        │
│  (large)                             │
│                                      │
│  Service: Blood Test                 │
│  Appt time: 11:00 AM                 │
│  Priority: [badge]                   │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Notes                        │  │
│  │  [notes text or "No notes"]   │  │
│  └────────────────────────────────┘  │
│                                      │
│  [ ▶  Start Appointment ]  ← CTA    │
│                                      │
└──────────────────────────────────────┘
```

**"Start Appointment" button** — transitions appointment from `checked_in` → `in_progress`.

**API (status transitions):**
```
PATCH /api/v1/appointments/{id}/status
Body: { "status": "in_progress" }   ← for Start
Body: { "status": "completed" }     ← for Complete (with notes)
```

#### Panel: Empty State

```
┌──────────────────────────────────────┐
│                                      │
│   ○  No active patient               │
│                                      │
│   Waiting for the next patient       │
│   to be checked in.                  │
│                                      │
└──────────────────────────────────────┘
```

Show this when no appointment is `in_progress` or `checked_in`. The queue list will show the scheduled appointments waiting.

---

### 3.4 Queue List

**Component: `<ProviderQueueList />`** — Left column, scrollable.

**API — initial load:**
```
GET /api/v1/appointments/providers/{provider_id}/queue
```
Expected response: appointments for today sorted by priority DESC, `appointment_start` ASC. Excludes `cancelled` and `no_show`.

The queue is divided into **two visual sections** separated by a subtle divider:

**Section A — Active Queue** (top): `scheduled`, `checked_in`, `in_progress` appointments
**Section B — Done Today** (bottom, collapsed by default): `completed` appointments

"Done Today" section has a toggle: "Show completed (N)" — click to expand/collapse. Completed rows are rendered at reduced visual weight (muted, smaller).

#### 3.4.1 Queue Card Layout

Each appointment is a **card** (not a table row) to give enough space for the action buttons and contextual info.

```
┌──────────────────────────────────────────────────────────────────┐
│  #2  [URGENT]                                     10:30 – 11:00  │
│                                                                  │
│  John Doe                                         Service name   │
│  09876-543210                                                    │
│                                                                  │
│  [ ▶ Start ]   [ Notes ]   [ ⋮ More ]                           │
└──────────────────────────────────────────────────────────────────┘
```

**Card elements:**

| Element | Content | Position |
|---|---|---|
| Queue position | "#1", "#2" — derived from sort order | Top-left, bold |
| Priority badge | Emergency (prominent, red) / Urgent (amber) / Standard (hidden — don't clutter) | Top-left, next to position |
| Time slot | "10:30 – 11:00 AM" | Top-right |
| Patient name | Full name, large | Main body left |
| Phone | Patient phone number, muted text below name | Below name |
| Service | Service name | Main body right |
| Action buttons | Context-sensitive — see §3.4.2 | Card footer |

**Emergency card styling:** Emergency appointments render with a distinct left border treatment and a persistent "EMERGENCY" label to ensure they are never missed.

**In-progress card styling:** The `in_progress` card renders with special prominence — slightly larger, border treatment, and a subtle pulsing animation on the status indicator to show it's active now.

#### 3.4.2 Action Buttons per Status

Provider sees only the status transitions they can trigger. No receptionist-only actions (check-in, no-show marking) are shown.

**Status = `scheduled`:**
- The patient hasn't arrived yet (receptionist handles check-in). Provider sees this appointment coming up.
- No primary action button
- Secondary: "**View Details**" (text link) — opens Patient & Appointment Detail Drawer (§7A)
- Note text: "Waiting for check-in" (muted, small)

**Status = `checked_in`:**
- Patient has arrived and been checked in by receptionist. Provider can begin.
- Primary button: **"▶ Start"** — immediately transitions to `in_progress`. No confirmation needed.
- Secondary: "**View Details**" (text link)
- The card also appears in the Current Patient Panel on the right (§3.3)

**Status = `in_progress`:**
- Currently being served.
- Primary button: **"✓ Complete"** — opens Complete Appointment Dialog (§7B)
- Secondary: "**Edit Notes**" — opens Notes Editor Panel (§7C) inline or as a small slide-up
- Icon "**⋮ More**": dropdown with "View Details" only

**Status = `completed`** (in the "Done Today" collapsed section):
- Icon button: **"View Details"** only

#### 3.4.3 Real-Time Queue Updates

Queue cards update in real-time via WebSocket (`queue_updated` event on channel `queue:{provider_id}`). Behavior:

- New appointment added → card animates in at its sorted position (slide down from above)
- Status change → card updates in place (badge + buttons swap with a brief highlight animation)
- Appointment moves to completed → card slides down to "Done Today" section
- Cancelled/no-show → card disappears with a brief fade-out; the freed slot is logged in the "Done Today" section in a muted style

Do not do full list re-renders on WS events. Update individual cards in place.

#### 3.4.4 Empty Queue State

When provider has no appointments today (Section A is empty):

```
○  Your queue is empty for today

No appointments have been scheduled or checked in yet.
Check with the front desk if patients are expected.
```

Do not show a CTA — providers cannot book appointments.

---

### 3.5 Queue Summary Footer

**Component: `<QueueSummaryFooter />`** — Sticky at the very bottom of the queue list column (not the page).

Compact single-line summary:
```
Remaining: 4   |   Checked In: 1   |   In Progress: 1   |   Completed: 3
```

Updates via WebSocket. These counts are derived from the queue list state (no extra API call).

---

## 4. Tab 2 — My Schedule

**Route:** `/provider/schedule`
**Purpose:** Full calendar view of the provider's appointments — past, present, and future. For planning ahead, reviewing history, and understanding workload distribution.

### 4.1 Page Layout

```
┌────────────────────────────────────────────────────────────────┐
│  VIEW CONTROLS  [ Day | Week | Month ]   [< Prev] [Today] [Next>]│
├────────────────────────────────────────────────────────────────┤
│  STATS STRIP (Week or Month view only)                         │
│  [Completed: 12] [Cancelled: 2] [No-Show: 1] [Utilization: 73%]│
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  CALENDAR BODY                                                 │
│  (Day / Week / Month grid)                                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 View Controls

**Component: `<ScheduleViewControls />`** — Sticky below tab bar.

**View mode toggle:** Three buttons — Day | Week | Month. Persisted in `localStorage` so the provider's preferred view is remembered across sessions.

**Date navigation:**
- "< Prev" / "Next >" arrows — move backward/forward by one day/week/month depending on current view
- "Today" button — jumps to today in the current view
- Current period label in center: "April 2026" / "Week of 31 Mar – 6 Apr" / "Thursday, 2 April 2026"

**On mobile:** Only Day and Week views are available. Month view is hidden on screens < 768px.

---

### 4.3 Day View

**Component: `<DayCalendar />`**

A vertical timeline for the selected date.

**Structure:**
- Timeline from 07:00 to 20:00 (configurable based on clinic hours — use provider's availability `start_time` and `end_time` from the `availability` table to determine visible range, pad by 30 min each side)
- 15-minute row granularity
- Time labels on the left axis (hourly: 07:00, 08:00...)
- Appointments rendered as blocks spanning their duration

**API:**
```
GET /api/v1/appointments/?provider_id={provider_id}&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
```

**Appointment Block Elements:**
- Patient first name + last initial (e.g., "John D.")
- Service name (truncated if block too short)
- Status chip in top-right corner of block
- Priority left-border treatment (Emergency = thick red left border, Urgent = amber, Standard = none)

**Block color by status:**
- `scheduled` → neutral/default
- `checked_in` → info tint
- `in_progress` → amber/warning tint with pulsing left border
- `completed` → muted/green tint
- `cancelled` → grey, hatched pattern or strikethrough
- `no_show` → muted red tint

**Non-working time zones:**
- Time ranges outside the provider's availability blocks are shown with a distinct background (hatched or darker) to visually show "not working" periods
- Break times (if defined in availability) shown as a striped zone with "Break" label
- Approved time-off periods shown as a blocked-out zone with "Time Off" label

**Clicking an appointment block:** Opens Patient & Appointment Detail Drawer (§7A).

**Today indicator:** A horizontal red line at the current time, with the current time label on the left axis.

**API — availability for the selected date:**
```
GET /api/v1/availability/{provider_id}
```
Used to render working hours zone and break times.

**API — approved time off:**
```
GET /api/v1/time-off/{provider_id}
```
Used to render time-off blocked zones.

---

### 4.4 Week View

**Component: `<WeekCalendar />`**

Seven columns, one per day (Mon–Sun). Same time axis as Day View but compressed horizontally.

**Column header:** Day abbreviation + date number. Today's column has a distinct background.

**Appointment blocks:** Compact — show only patient first name and service abbreviated. Full info on click → opens Detail Drawer (§7A).

**Stats strip** (visible in Week view): Aggregate counts for the week:
```
GET /api/v1/appointments/providers/{provider_id}/stats?date_from=Mon&date_to=Sun
```
> **Backend note:** A stats endpoint for the provider returning aggregated counts per date range is needed. Response should include: `{ completed, cancelled, no_show, total_scheduled, utilization_percent }`. **Create `GET /api/v1/appointments/providers/{provider_id}/stats`** with `date_from` and `date_to` query params if it does not exist.

---

### 4.5 Month View

**Component: `<MonthCalendar />`**

Standard 5-row monthly grid.

**Day cell content:**
- Appointment count badge: "5 appts"
- Mini progress bar inside the cell: completed/total (green fill)
- Capacity indicator dot (green/amber/red matching the daily capacity color logic)

**Today cell:** Distinct background highlight.

**Clicking a day cell:** Navigates to Day View for that date.

**Stats strip** (visible in Month view): Monthly aggregates from stats API.

---

### 4.6 Schedule Legend

Small legend component rendered below the calendar in Day and Week views:

```
Legend: ■ Scheduled  ■ Checked In  ■ In Progress  ■ Completed  ■ Cancelled  ░ Non-working
```

---

## 5. Tab 3 — Availability & Time Off

**Route:** `/provider/availability`
**Purpose:** Providers self-manage their recurring weekly schedule and submit time-off requests. This is used infrequently — it is setup and exception-management, not a daily-use screen.

### 5.1 Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  SECTION HEADER: "Weekly Availability"                           │
├──────────────────────────────────────────────────────────────────┤
│  WEEKLY SCHEDULE GRID                                            │
│  (7 day columns × configurable time rows)                        │
│                                                                  │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun                               │
│  [██] [██] [  ] [██] [██] [  ] [  ]                             │
│                                                                  │
│  [+ Add Availability Block]                                      │
├──────────────────────────────────────────────────────────────────┤
│  SECTION HEADER: "Time Off Requests"         [+ Request Time Off]│
├──────────────────────────────────────────────────────────────────┤
│  TIME OFF TABLE                                                  │
│  [row] [row] [row] ...                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

### 5.2 Weekly Availability Grid

**Component: `<WeeklyAvailabilityGrid />`**

A visual weekly grid showing the provider's recurring availability schedule. This represents the `availability` table records for this provider.

**Grid structure:**
- 7 columns (Mon–Sun), column header = day name
- Time rows from 06:00 to 22:00 in 30-minute increments (rows are compact — not a full timeline like the Day calendar)
- Filled blocks = available windows (rendered as solid filled bars spanning the start–end time)
- Empty rows = not working

**API — initial load:**
```
GET /api/v1/availability/{provider_id}
```

**Interaction — Adding a new availability block:**

Click "＋ Add Availability Block" button or click an empty cell in the grid.

Opens an inline form panel (slides up from the bottom of the grid, not a modal):

```
┌────────────────────────────────────────────────┐
│  Add Availability Block                        │
│                                                │
│  Day(s):    [☑ Mon] [☑ Tue] [☐ Wed]...       │
│  Start Time: [09:00 ▼]                        │
│  End Time:   [17:00 ▼]                        │
│  Break From: [12:00 ▼]  to  [13:00 ▼]  [☐]  │
│  Recurring:  ● Every week  ○ One-time only    │
│                                                │
│  [Cancel]              [Save Block]            │
└────────────────────────────────────────────────┘
```

**Fields:**
- **Day(s):** Multi-checkbox — Mon/Tue/Wed/Thu/Fri/Sat/Sun. Multiple days can be selected at once (creates one record per selected day)
- **Start Time / End Time:** Time picker dropdowns, 15-min increments
- **Break time (optional):** Toggle to enable break. If enabled, shows From/To time pickers. Break is stored in the `availability` record as `break_start` / `break_end`.
- **Recurring:** One-time (single date with a date picker visible) vs. Weekly recurring (no date picker, applies every week for this day)

**Validation:**
- End time must be after start time
- Break window must be within start–end range
- Cannot overlap an existing availability block for the same day

**API — create:**
```
POST /api/v1/availability/
Body: {
  provider_id,
  day_of_week,       ← 0=Monday ... 6=Sunday
  start_time,        ← "HH:MM"
  end_time,          ← "HH:MM"
  break_start,       ← "HH:MM" or null
  break_end,         ← "HH:MM" or null
  is_working_day: true,
  is_recurring: true | false,
  specific_date      ← only if is_recurring = false
}
```

**Interaction — Editing an existing block:**

Click on an existing filled block in the grid. The same inline form opens pre-filled with that block's data. Shows an additional "Delete Block" danger link at the bottom.

**API — update:**
```
PUT /api/v1/availability/{id}
```

**API — delete:**
```
DELETE /api/v1/availability/{id}
```

Delete confirmation: small inline confirmation text "Remove this availability block?" with Confirm / Cancel links (no full modal needed here).

**Warning on delete:** If the deleted block covers a date that has scheduled appointments, show: "⚠ You have scheduled appointments during this time. Removing this block won't cancel them — contact the front desk to reschedule affected appointments."

---

### 5.3 Time Off Requests Section

**Component: `<TimeOffRequestsSection />`**

**Header:** "Time Off Requests" + "＋ Request Time Off" button (top right).

#### 5.3.1 Time Off Table

**API:**
```
GET /api/v1/time-off/{provider_id}
```

Sorted by `start_date` descending (most recent first).

**Columns:**

| Column | Content |
|---|---|
| **Dates** | "1 Apr – 5 Apr 2026" (or single date if same day) |
| **Duration** | "5 days" (calculated from start/end) |
| **Reason** | Reason text (truncated at 60 chars, full text on hover tooltip) |
| **Status** | Badge — Pending (amber) / Approved (green) / Rejected (red) |
| **Requested On** | Date the request was submitted (muted) |
| **Actions** | See below |

**Actions per status:**
- `pending` → "Edit" (opens edit form) | "Cancel Request" (danger text link, with inline confirmation)
- `approved` → No actions. Read-only. Show a note: "Approved — contact admin to cancel"
- `rejected` → "Delete" (removes the rejected record)

**API — cancel a pending request:**
```
DELETE /api/v1/time-off/{id}
```

**API — update a pending request:**
```
PUT /api/v1/time-off/{id}
Body: { start_date, end_date, reason }
```

**Empty state:** "No time off requests. Use the button above to request leave."

#### 5.3.2 Request Time Off Form

**Trigger:** "＋ Request Time Off" button.

Opens as a slide-in panel on the right (not a blocking modal — the provider can still see the time-off table behind it).

**Component: `<TimeOffRequestPanel />`** — Right slide-in panel, width 420px.

**Header:** "Request Time Off" · Close (X)

**Fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| Date Range | Date range picker | Yes | Min: tomorrow (cannot request time off in the past). Calendar highlights days that already have approved time-off. |
| Reason | Textarea | Yes | Min 10 chars. Examples shown as placeholder: "Annual leave, medical appointment, personal matter..." |
| Specific Hours (optional) | Toggle | No | If enabled, shows Start Time + End Time pickers for partial-day requests. If disabled, the full day(s) are covered. |

**Duration preview:** Live-calculated below date range — "5 working days · 15 Apr – 19 Apr 2026"

**Conflict warning:** After selecting dates, check against existing scheduled appointments:
```
GET /api/v1/appointments/?provider_id={id}&date_from=...&date_to=...&status=scheduled
```
If conflicts found, show: "⚠ You have [N] scheduled appointments during these dates. Submitting this request won't cancel them — the admin will need to reschedule them when approving."

**Footer:**
- "Cancel" — closes panel
- "Submit Request" — submits, shows loading state on button

**API — create:**
```
POST /api/v1/time-off/
Body: {
  provider_id,
  start_date,     ← "YYYY-MM-DD"
  end_date,       ← "YYYY-MM-DD"
  reason,
  start_time,     ← "HH:MM" or null (partial day)
  end_time        ← "HH:MM" or null (partial day)
}
```

**On success:** Panel closes. New row appears at the top of the time-off table with "Pending" status. Toast: "Time off request submitted — pending admin approval."

**Important UX note:** Make it very clear to the provider that submitting a time-off request does NOT automatically cancel appointments. It only signals intent. The admin approves the request and handles the scheduling impact.

---

## 6. Tab 4 — My Profile

**Route:** `/provider/profile`
**Purpose:** Personal account settings and read-only view of the provider's clinical profile. Split into two distinct sections: account-editable info and admin-managed clinical info.

### 6.1 Page Layout

Three cards stacked vertically, centered with max-width 680px.

---

### 6.2 Card 1 — Personal Account Info

**Component: `<PersonalInfoCard />`**

**API — initial load:**
```
GET /api/v1/profile/me
```

**Fields (all editable by the provider):**

| Field | Input Type | Notes |
|---|---|---|
| Full Name | Text input | |
| Email | Text input, read-only | Display only. Note: "Contact admin to change your email address." |
| Role | Text, read-only | Displays "Provider" |

**Save button:** `PUT /api/v1/profile/me` with `{ name }`. Success toast: "Profile updated."

---

### 6.3 Card 2 — Clinical Profile (Read-Only)

**Component: `<ClinicalProfileCard />`**

This section shows the provider's clinical attributes. These are set by the admin and **cannot be edited by the provider**. Display them clearly with a note that changes require contacting the admin.

**API:**
```
GET /api/v1/providers/{id}
GET /api/v1/providers/{id}/services
```

**Displayed fields (all read-only):**

| Field | Content |
|---|---|
| **Specialization** | Specialization name (e.g., "Cardiology") |
| **Daily Appointment Capacity** | Max appointments per day (e.g., "8 appointments/day") |
| **Current Status** | Same status toggle as in the nav bar — replicated here for discoverability |
| **Emergency Enabled** | Yes / No badge — whether this provider handles emergency cases |
| **Assigned Services** | Chip list of all services this provider is qualified for. Each chip: Service name + duration badge. No edit actions. |

**Footer note:** "To update your specialization, capacity, or assigned services, please contact the system administrator."

---

### 6.4 Card 3 — Change Password

**Component: `<ChangePasswordCard />`**

**Fields:**
- Current Password (password input, reveal toggle)
- New Password (password input, reveal toggle + strength meter)
- Confirm New Password (password input, reveal toggle)

**Password strength meter** — inline bar below New Password:
- Evaluates: length ≥ 8, uppercase present, lowercase present, digit present, special character present
- 4 levels: Weak | Fair | Strong | Very Strong
- Rendered as a segmented bar (4 segments filling left to right)

**Validation:**
- New Password and Confirm must match — show inline error below Confirm field if not ("Passwords don't match")
- Enforce minimum length of 8 characters (block submission if below 8)
- Warn (but don't block) if strength is Weak

**"Change Password" button:**
- Shows loading spinner inside button on click
- `PUT /api/v1/profile/change-password` with `{ current_password, new_password }`
- **Success:** Toast "Password changed successfully." + Clear all three fields
- **401 Error (wrong current password):** Inline error below Current Password field: "Incorrect current password."
- **400 Validation Error:** Inline error at top of card

---

## 7. Shared Drawers & Dialogs

---

### 7A. Patient & Appointment Detail Drawer

**Component: `<AppointmentDetailDrawer />`** — Slides in from right, full viewport height, width 520px.

**Trigger:**
- Clicking any appointment card in the Queue List (§3.4)
- Clicking any appointment block in the Schedule calendar (§4)
- "View Details" from the ⋮ More menu

**API:**
```
GET /api/v1/appointments/{id}
```

#### Drawer Header

```
┌─────────────────────────────────────────────────────┐
│  APT-20260402-007   [STATUS BADGE]           [✕]    │
│  Patient Full Name  (large, bold)                   │
└─────────────────────────────────────────────────────┘
```

- Appointment number in monospace muted text
- Patient name prominent
- Current status badge
- Close (X) — top right

#### Section 1 — Status Action Banner

Full-width banner below header, same background treatment as the status color:

**If `checked_in`:** "Patient has checked in — ready to begin"
- Full-width button: "▶ Start Appointment" → `PATCH /api/v1/appointments/{id}/status` `{ "status": "in_progress" }`

**If `in_progress`:** "Currently in progress"
- Full-width button: "✓ Complete Appointment" → opens Complete Appointment Dialog (§7B)
- Below button: elapsed time counter "Running for 14 min"

**If `scheduled`:** "Waiting for check-in by front desk"
- No action button (provider cannot check in patients)
- Muted note: "The front desk will check this patient in."

**If `completed`:** "Completed at [time]"
**If `cancelled`:** "Cancelled — [reason]"
**If `no_show`:** "Marked as no-show"

---

#### Section 2 — Appointment Details

Two-column detail grid:

| Label | Value |
|---|---|
| Service | Service name |
| Duration | "30 min (+ 5 min buffer)" |
| Appointment Time | "10:30 AM – 11:00 AM" |
| Date | "Wednesday, 2 April 2026" |
| Priority | Priority badge |
| Booked By | Staff name who created the booking |
| Booked At | Creation timestamp |
| From Waitlist | "Yes" badge if `assigned_from_waitlist = true` |

---

#### Section 3 — Patient Information

Title: "Patient"

| Label | Value |
|---|---|
| Phone | Clickable `tel:` link on mobile |
| Email | Email address |
| Date of Birth | "12 Jan 1985 (41 yrs)" |
| Gender | Gender value |

**Privacy note:** Providers see patient contact info for service delivery purposes. No edit access to patient records (no "Edit" button here — providers cannot modify patient data).

---

#### Section 4 — Clinical Notes

Title: "Appointment Notes"

**Display mode (default):** Notes text rendered in a clearly demarcated box. If `appointments.notes` is empty, show "No notes added."

**Edit mode:** Clicking "Edit Notes" (text link) expands an inline textarea in place (no panel replacement, just the field becomes editable). See §7C for full notes editor spec.

---

#### Section 5 — Appointment Timeline

Compact vertical timeline:

```
○ Scheduled    → created at 09:15 AM by Jane Smith (Receptionist)
● Checked In   → 10:28 AM
● In Progress  → 10:34 AM
```

Each event: dot indicator + label + timestamp. Incomplete/future states shown with hollow dots.

---

### 7B. Complete Appointment Dialog

**Component: `<CompleteAppointmentDialog />`** — Modal, width 480px.

**Trigger:**
- "✓ Complete" button on a queue card (§3.4.2)
- "✓ Complete Appointment" button in Current Patient Panel (§3.3)
- "✓ Complete Appointment" button in Detail Drawer (§7A)

**Purpose:** A deliberate confirmation step for completing an appointment. Gives the provider a moment to add or review notes before finalising.

#### Dialog Layout

**Header:** "Complete Appointment"

**Patient summary (read-only):**
```
Jane Doe  ·  General Consultation  ·  10:30 AM
```

**Notes field:**
- Textarea, pre-filled with existing `appointments.notes` if any
- Placeholder: "Add any notes about this appointment (optional)..."
- Max 1000 characters
- Character count shown: "45 / 1000"
- This is the provider's last chance to add clinical notes before closing the appointment

**"What happens next" info box:**
```
ℹ Completing this appointment will:
  · Mark it as done in the system
  · Free this time slot for the day's count
  · Automatically assign the next waitlist patient (if any)
```

**Footer:**
- "Cancel" — closes dialog, appointment status unchanged
- "Mark as Complete" — primary button. Sends both the status update AND saves notes in one call.

**API:**
```
PATCH /api/v1/appointments/{id}/status
Body: { "status": "completed", "notes": "..." }
```
> **Backend note:** The status PATCH endpoint should accept an optional `notes` field so the completion and note-saving can be done in one request. If not supported, make two sequential calls: first `PATCH /{id}` for notes, then `PATCH /{id}/status` for completion. Prefer single-call approach.

**On success:**
- Dialog closes
- Queue card moves to "Done Today" section (animated)
- Current Patient Panel updates to next patient
- Progress bar in Day Summary Header advances
- Toast: "Appointment completed — [Patient Name]"

---

### 7C. Notes Editor Panel

**Component: `<NotesEditorPanel />`**

**Trigger:** "Edit Notes" link in the queue card ⋮ More menu, or in the Detail Drawer, or in the Current Patient Panel.

**Implementation:** The notes editor is an **inline expansion** — not a separate modal. It expands within the context it's triggered from (inside the card, inside the drawer, or inside the Current Patient Panel).

#### Notes Editor UI

```
┌──────────────────────────────────────────┐
│  Appointment Notes                       │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  │  [editable textarea]             │    │
│  │                                  │    │
│  └──────────────────────────────────┘    │
│  [character count]                       │
│                                          │
│  [Cancel]          [Save Notes]          │
└──────────────────────────────────────────┘
```

**Behavior:**
- Textarea auto-focuses on open
- Pre-filled with current `appointments.notes`
- "Save Notes" is disabled if the text hasn't changed (no dirty state = no unnecessary API call)
- "Cancel" reverts to the original text, no API call

**API:**
```
PATCH /api/v1/appointments/{id}
Body: { "notes": "..." }
```
> **Backend note:** A `PATCH /api/v1/appointments/{id}` for updating editable fields (notes, priority) should exist. If only `PATCH /{id}/status` exists, **create a general update endpoint** for non-status fields.

**On save success:** Notes text updates in-place (textarea collapses, displays updated notes in read mode). Toast: "Notes saved."

**Auto-save (optional enhancement):** If implementing, auto-save on a 3-second debounce after typing stops. Show a subtle "Saving..." indicator. This prevents note loss if the provider is interrupted.

---

## 8. UI State Standards

### 8.1 Loading States

Use skeleton placeholders for all initial data loads.

| Component | Skeleton Shape |
|---|---|
| Queue List | 4 skeleton cards (height ~100px each, with skeleton lines inside) |
| Current Patient Panel | Full panel skeleton with header line + body lines + button placeholder |
| Day Summary Header | Skeleton for progress bar + 3 skeleton chips |
| Calendar (Day view) | Skeleton timeline with 3 randomly sized appointment block skeletons |
| Calendar (Week view) | 7 column skeleton, each with 2-3 appointment block skeletons |
| Calendar (Month view) | 35-cell grid skeleton with small text skeletons per cell |
| Availability Grid | 7 column skeleton with 1-2 filled bar skeletons per column |
| Time Off Table | 3 skeleton rows |
| Profile cards | Form field skeletons |

Spinners are only used inside buttons (during submit/loading state of a specific action).

### 8.2 Empty States

| Component | Empty State Message | CTA |
|---|---|---|
| Queue List (Section A, no active appointments) | "Your queue is empty for today" | None — provider cannot book |
| Queue List (Section B, no completed) | Hidden — don't show "Done Today" section at all if 0 completed | — |
| Schedule (Day view, no appointments) | "No appointments on this day" | None |
| Time Off Table (no requests) | "No time off requests" | "Request Time Off" shortcut |
| Availability Grid (no blocks set) | "No availability set. Add your working hours." | "Add Availability Block" |

### 8.3 Error States

- **API 5xx / Network failure:** Inline error banner inside the failing component. "Failed to load [content]. [Retry]" button. Never replace the entire tab with an error page.
- **API 4xx on status transition (invalid transition):** Toast error: "Cannot [action] — [API error message]." The button that triggered it reverts to its original state.
- **API 4xx on time-off request (date conflict):** Inline error at top of the request form.
- **WS disconnect:** Grey dot in nav bar. "Live updates paused" persistent slim banner below the nav bar. Auto-dismiss on reconnect.

### 8.4 Toast Notifications

All toasts: top-right position, 5 second auto-dismiss, manually dismissable.

| Trigger | Type | Message |
|---|---|---|
| Appointment started | Info | "[Patient Name] — In Progress" |
| Appointment completed | Success | "Appointment completed — [Patient Name]" |
| Notes saved | Success (subtle) | "Notes saved" |
| Status updated | Info | "[Patient Name] — [New Status]" |
| Time off submitted | Success | "Time off request submitted — pending admin approval" |
| Availability block saved | Success | "Availability updated" |
| Password changed | Success | "Password changed successfully" |
| Profile updated | Success | "Profile updated" |
| API error (any action) | Error | "Action failed — [reason]. Try again." |
| WS event: appointment added to queue | Info (subtle) | "[Patient Name] checked in — [Service]" |
| WS event: appointment cancelled (not by provider) | Info | "[Patient Name]'s appointment was cancelled by front desk" |

---

## 9. WebSocket Event Handlers

Wire these at the dashboard root level on mount. The provider dashboard listens on `provider:{provider_id}` and `queue:{provider_id}` channels.

| Event | Channel | What to Do |
|---|---|---|
| `appointment_created` | `provider:{id}` | Add new card to Queue List at sorted position. Animate card sliding in. Update Day Summary Header counts. |
| `appointment_status_changed` | `provider:{id}` | Find card by appointment ID. Update status badge + action buttons in-place. If new status = `checked_in`, update Current Patient Panel if no `in_progress` exists. If new status = `completed`, move card to Done Today section. Update Day Summary Header progress bar. |
| `appointment_cancelled` | `provider:{id}` | Remove card from Queue List (fade out). Update header counts. Show toast: "[Patient Name]'s appointment was cancelled." |
| `queue_updated` | `queue:{id}` | Re-sort queue cards to reflect new order. Animate re-ordering (smooth position transitions using CSS). Update position numbers (#1, #2...). |
| `capacity_updated` | `provider:{id}` | Update capacity chip in Day Summary Header. |
| `provider_status_changed` | `provider:{id}` | If `user_id` is NOT the current provider (i.e., admin changed the status remotely), update the status toggle in the nav bar and show toast: "Your status was updated to [status] by admin." |

**Queue card re-ordering animation:** When `queue_updated` fires and position numbers change, use a short CSS transition (200ms ease) on card position changes so the provider sees cards smoothly rearrange. Do not jump — animate the sort.

---

## 10. Role Guard & Permission Rules

All `/provider/*` routes are guarded. If role ≠ `provider`, redirect to the appropriate dashboard.

| Action | Provider Can |
|---|---|
| View own appointments (today + all history) | ✅ Yes |
| View own queue | ✅ Yes |
| Start an appointment (checked_in → in_progress) | ✅ Yes |
| Complete an appointment (in_progress → completed) | ✅ Yes |
| Add / edit appointment notes | ✅ Yes |
| Update own availability schedule | ✅ Yes |
| Submit time-off requests | ✅ Yes |
| Update own status (available / partially / on leave) | ✅ Yes |
| View own assigned services and clinical profile | ✅ Yes (read-only) |
| Check patients in (scheduled → checked_in) | ❌ No — hide this action entirely |
| Mark no-shows | ❌ No — hide this action entirely |
| Cancel appointments | ❌ No — hide this action entirely |
| Book appointments | ❌ No — no booking controls anywhere in the dashboard |
| View or manage other providers' data | ❌ No |
| View or manage patient records | ❌ No — patient info shown only in context of an appointment |
| Access admin or receptionist functions | ❌ No — routes 404 or redirect |
| Approve time-off requests | ❌ No — provider submits; admin approves |
| Edit own clinical profile (specialization, services, capacity) | ❌ No — read-only, admin-managed |

**For any hidden action:** Do not show the control as disabled — remove it from the DOM entirely. A provider should never see a greyed-out "Cancel" button; they simply don't have that action available.

---

## 11. API Quick Reference

| # | Method | Endpoint | Tab / Component | Notes |
|---|---|---|---|---|
| 1 | GET | `/api/v1/profile/me` | Nav bar, Profile tab | On mount — get user info + provider_id |
| 2 | PUT | `/api/v1/profile/me` | Profile — Card 1 | Update name |
| 3 | PUT | `/api/v1/profile/change-password` | Profile — Card 3 | |
| 4 | POST | `/api/v1/auth/logout` | Nav bar | |
| 5 | GET | `/api/v1/providers/{id}` | Nav bar, Profile — Card 2 | Get provider profile: status, capacity, emergency_enabled |
| 6 | GET | `/api/v1/providers/{id}/services` | Profile — Card 2 | Assigned services (read-only display) |
| 7 | PATCH | `/api/v1/providers/{id}/status` | Nav bar status toggle | ⚠️ Create if missing — lightweight status-only update |
| 8 | GET | `/api/v1/appointments/providers/{id}/queue` | My Queue tab | Today's queue ordered by priority + time |
| 9 | GET | `/api/v1/appointments/providers/{id}/capacity` | Day Summary Header | `booked_today`, `max_daily_appointments`, `completed_today` |
| 10 | GET | `/api/v1/appointments/providers/{id}/stats` | My Schedule — stats strip | ⚠️ Create if missing — `date_from`, `date_to` params. Returns completed, cancelled, no_show, utilization % |
| 11 | GET | `/api/v1/appointments/` | My Schedule calendar | Filter by `provider_id`, `date_from`, `date_to` |
| 12 | GET | `/api/v1/appointments/{id}` | Detail Drawer | Single appointment detail |
| 13 | PATCH | `/api/v1/appointments/{id}/status` | Queue cards, Drawer, Current Patient Panel, Complete Dialog | Status transitions. Should accept optional `notes` field on `completed` transition |
| 14 | PATCH | `/api/v1/appointments/{id}` | Notes Editor Panel | ⚠️ Create if missing — update non-status fields (notes, etc.) |
| 15 | GET | `/api/v1/availability/{provider_id}` | Availability tab, Schedule Day View | Provider's weekly availability blocks |
| 16 | POST | `/api/v1/availability/` | Availability tab — add block form | |
| 17 | PUT | `/api/v1/availability/{id}` | Availability tab — edit block form | |
| 18 | DELETE | `/api/v1/availability/{id}` | Availability tab — delete block | |
| 19 | GET | `/api/v1/time-off/{provider_id}` | Availability tab, Schedule Day View | All time-off requests for this provider |
| 20 | POST | `/api/v1/time-off/` | Availability tab — request panel | Submit new time-off request |
| 21 | PUT | `/api/v1/time-off/{id}` | Availability tab — edit pending request | |
| 22 | DELETE | `/api/v1/time-off/{id}` | Availability tab — cancel request | Cancel pending request |
| 23 | GET | `/api/v1/appointments/?provider_id=&date_from=&date_to=&status=scheduled` | Time Off Request Panel | Conflict check before submitting |
| 24 | WS | `/ws/provider:{provider_id}` | Entire dashboard | Connect on mount |
| 25 | WS | `/ws/queue:{provider_id}` | My Queue tab | Connect on mount |

**Legend:**
- ⚠️ = Endpoint needs to be created or extended on the backend before frontend integration can proceed. Flagged so the backend team can prioritise accordingly.

---

## Appendix A — Provider Status State Reference

| `providers.status` | Nav Toggle Display | Meaning |
|---|---|---|
| `available` | "● Available" | Fully available — new appointments can be booked |
| `partially_available` | "◑ Partially Available" | Limited availability — existing appointments proceed |
| `on_leave` | "○ On Leave" | Not available — blocks new bookings (does not cancel existing ones) |

Changing to `on_leave` via the toggle does NOT cancel existing appointments. It only prevents new bookings. Existing scheduled appointments continue and must be managed by the receptionist.

---

## Appendix B — Appointment Status Quick Reference (Provider Context)

| Status | Meaning for Provider | Provider Action |
|---|---|---|
| `scheduled` | Patient expected — not yet arrived | None (front desk handles check-in) |
| `checked_in` | Patient arrived and confirmed by front desk | Start the appointment |
| `in_progress` | Currently serving this patient | Complete the appointment |
| `completed` | Done | View details only |
| `cancelled` | Cancelled by front desk or admin | View details only |
| `no_show` | Patient didn't arrive | View details only |

---

*MediSync Provider Dashboard Frontend Spec — Version 1.0 — April 2026 — Internal Use Only*