# MediSync — Admin Dashboard Overview Implementation Spec
**Route:** `http://localhost:3000/dashboard/admin`
**Version:** 1.0 | **Prepared for:** Frontend Development Team | **Date:** April 2026
**Scope:** End-to-end design and implementation guide for the Admin Dashboard Overview — the landing page after login. Covers live KPI metrics, provider utilisation, appointment flow, waitlist snapshot, activity feed, charts, and quick-action shortcuts.

---

## Table of Contents

1. [Mental Model & Design Decisions](#1-mental-model--design-decisions)
2. [Page Layout & File Structure](#2-page-layout--file-structure)
3. [Section A — Top KPI Strip](#3-section-a--top-kpi-strip)
4. [Section B — Alert Banner Zone](#4-section-b--alert-banner-zone)
5. [Section C — Main Grid (Left + Right Columns)](#5-section-c--main-grid-left--right-columns)
   - 5A. Today's Appointment Flow Chart
   - 5B. Provider Utilisation Grid
   - 5C. Waitlist Snapshot Panel
   - 5D. Live Activity Feed
6. [Section D — Secondary Insights Row](#6-section-d--secondary-insights-row)
   - 6A. Appointments by Hour (Heatmap)
   - 6B. Service Demand Chart
   - 6C. No-Show & Cancellation Trend
7. [Section E — Quick Actions](#7-section-e--quick-actions)
8. [Page Header & Navigation Context](#8-page-header--navigation-context)
9. [Real-Time WebSocket Integration](#9-real-time-websocket-integration)
10. [Data Fetching Strategy](#10-data-fetching-strategy)
11. [Responsive Layout](#11-responsive-layout)
12. [UI State Standards](#12-ui-state-standards)
13. [Required Backend Endpoints](#13-required-backend-endpoints)
14. [API Quick Reference](#14-api-quick-reference)

---

## 1. Mental Model & Design Decisions

### 1.1 Purpose of This Page

The Admin Dashboard Overview is the **first thing an admin sees after login**. It must answer five questions within 3 seconds of loading:

1. **How is today going?** — Are appointments flowing normally? Any emergencies?
2. **Is anyone overwhelmed?** — Which providers are at or near full capacity?
3. **Who is waiting without a slot?** — Waitlist depth and urgency at a glance.
4. **What just happened?** — The most recent system activity so the admin knows what their team has been doing.
5. **What needs attention?** — Alerts for anything that requires admin action (pending time-off approvals, emergency waitlist entries, failed notifications).

This page is **not** for deep analysis — every other admin page handles that. The overview is a control room snapshot: scan in 10 seconds, know the state of the clinic, navigate to the right place to act.

### 1.2 Real-Time First

Unlike the other admin pages where real-time is a nice-to-have enhancement, the dashboard overview is **fundamentally real-time**. An admin who loads this page and walks away for 5 minutes should come back to current data — not stale numbers from when they loaded the page. Every metric must update via WebSocket with no manual refresh needed.

### 1.3 Navigation Hub

The dashboard is also a **navigation hub**. Every panel, every chart, every number is a link. Clicking on "6 in-progress appointments" should navigate to the Appointments page filtered to `status=in_progress`. Clicking on a provider's capacity bar should navigate to their provider detail. Clicking on a waitlist count should navigate to the Waitlist page. The dashboard should never be a dead end.

### 1.4 Layout Approach: Asymmetric Grid

The layout is a **grid of cards** — not a single long scroll. The admin should see the most critical panels above the fold without scrolling. The grid is asymmetric: the appointment flow chart and provider grid are wider (primary panels), while the activity feed and waitlist snapshot are narrower sidebars.

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  TOP KPI STRIP — full width, always visible                                          │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  ALERT BANNER ZONE — conditional, only visible when alerts exist                     │
├───────────────────────────────────────────────────┬──────────────────────────────────┤
│                                                   │                                  │
│  TODAY'S APPOINTMENT FLOW CHART                   │  WAITLIST SNAPSHOT               │
│  (left, ~60% width)                               │  (right, ~40% width)             │
│                                                   │                                  │
├───────────────────────────────────────────────────┤                                  │
│                                                   │                                  │
│  PROVIDER UTILISATION GRID                        ├──────────────────────────────────┤
│  (left, ~60% width)                               │                                  │
│                                                   │  LIVE ACTIVITY FEED              │
│                                                   │  (right, ~40% width)             │
│                                                   │                                  │
├────────────────────────────┬──────────────────────┴──────────────┬───────────────────┤
│  HOURLY HEATMAP            │  SERVICE DEMAND CHART               │  NO-SHOW TREND    │
│  (~33% width)              │  (~34% width)                       │  (~33% width)     │
├────────────────────────────┴─────────────────────────────────────┴───────────────────┤
│  QUICK ACTIONS ROW — shortcut buttons                                                │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Page Layout & File Structure

### 2.1 File Structure (Next.js App Router)

```
app/
└── dashboard/
    └── admin/
        ├── page.tsx                               ← Root dashboard overview page
        └── components/
            ├── DashboardHeader.tsx                ← Greeting + date + connection status
            ├── KPIStrip.tsx                       ← Top metrics row
            ├── AlertBannerZone.tsx                ← Conditional alerts row
            ├── panels/
            │   ├── AppointmentFlowChart.tsx       ← Status breakdown donut + timeline
            │   ├── ProviderUtilisationGrid.tsx    ← Provider capacity cards grid
            │   ├── WaitlistSnapshotPanel.tsx      ← Live waitlist summary
            │   └── LiveActivityFeed.tsx           ← Recent activity log stream
            ├── charts/
            │   ├── HourlyHeatmap.tsx              ← Appointments by hour of day
            │   ├── ServiceDemandChart.tsx         ← Top services bar chart
            │   └── NoShowTrendChart.tsx           ← 7-day no-show/cancellation trend
            └── QuickActionsRow.tsx                ← Shortcut buttons
```

### 2.2 Dashboard Page Header

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Good morning, Sarah 👋                                 ● Live  Thu, 2 April 2026   │
│  Here's what's happening at MediSync today.                                          │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Component: `<DashboardHeader />`**

- **Greeting:** "Good morning / afternoon / evening, [first name]" — time-based (morning = before 12, afternoon = 12–17, evening = 17+). First name pulled from `GET /api/v1/profile/me`.
- **Date:** Full date — "Thu, 2 April 2026"
- **Live status indicator:** Small pulsing green dot + "Live" label when WebSocket connected. Grey dot + "Reconnecting..." when disconnected.
- **Subtitle:** "Here's what's happening at MediSync today." — static, motivating context line.

---

## 3. Section A — Top KPI Strip

**Component: `<KPIStrip />`**

A full-width row of metric chips immediately below the header. This is the single most important visual element on the page — every admin reads this first. It must load fast (within the initial page load, not lazy) and update in real-time via WebSocket.

```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│  Today's     │  Completed   │  In Progress │  Scheduled   │  Waitlist    │  No-Show     │
│  Bookings    │              │  Right Now   │  Remaining   │  Active      │  Rate Today  │
│     58       │     31       │      4       │     18       │     12       │    5.2%      │
│  ↑ 12% vs   │  ↑ 6% vs    │  ● live      │  appts left  │  waiting     │  ↓ vs 7.1%  │
│  yesterday   │  yesterday   │              │  today       │  for slot    │  yesterday   │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### 3.1 KPI Definitions

| Chip | Primary Value | Trend Indicator | Click Destination |
|---|---|---|---|
| **Today's Bookings** | Total appointments created or existing for today (all statuses except cancelled+no_show) | ↑/↓ % vs yesterday | `/dashboard/admin/appointments?date=today` |
| **Completed** | `status = completed` today | ↑/↓ vs yesterday | `/dashboard/admin/appointments?date=today&status=completed` |
| **In Progress** | `status = in_progress` right now — shows a pulsing dot | Live count only, no trend | `/dashboard/admin/appointments?date=today&status=in_progress` |
| **Scheduled Remaining** | `status = scheduled` for today (future appointments still to happen) | Count only | `/dashboard/admin/appointments?date=today&status=scheduled` |
| **Waitlist Active** | `status = waiting` entries right now | Count vs 24h ago | `/dashboard/admin/waitlist` |
| **No-Show Rate** | `no_show / total_booked * 100` for today | ↑/↓ vs yesterday's rate | `/dashboard/admin/appointments?date=today&status=no_show` |

### 3.2 Trend Indicators

Every KPI that has a comparison shows a trend arrow:
- ↑ green arrow = improvement (more completed, lower no-show rate)
- ↓ red arrow = deterioration (more no-shows, fewer completions)
- → grey dash = no change (within 1%)

The trend direction meaning is **context-aware**:
- For Completed: ↑ = good (green), ↓ = bad (red)
- For No-Show Rate: ↑ = bad (red), ↓ = good (green)
- For Waitlist: higher numbers are neutral — show in amber, not red/green

### 3.3 Real-Time Update Behaviour

KPI chips update silently — no flash or animation on the number itself (too noisy). Exception: the "In Progress" chip gets a number-change animation (brief scale-up on the number) when it changes, because that's the most operationally significant real-time signal.

**API — initial values:**
```
GET /api/v1/dashboard/summary
```
> **Backend note:** This single endpoint returns all KPI values in one call. See §13.1.

---

## 4. Section B — Alert Banner Zone

**Component: `<AlertBannerZone />`**

Appears **only when there are items requiring admin attention**. If nothing needs attention, this section takes up no space. Located between the KPI strip and the main grid.

### 4.1 Alert Types and Priority Order

Alerts are ordered by severity. Multiple alerts stack vertically, highest severity first. Maximum 3 alerts shown simultaneously — a "Show N more" link if there are more.

**Alert 1 — Emergency Waitlist Entries (highest priority)**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ⚡ EMERGENCY  2 emergency patients are waiting without a slot                       │
│  Sara Ahmed · ECG Test · 28 min  |  John Doe · Cardiology · 11 min                  │
│                                                   [Assign Now] [View Waitlist]       │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

Triggered when: any `waitlist.priority = emergency` AND `status = waiting`.

**Alert 2 — Pending Time-Off Approvals**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ⏳ 3 time-off requests are pending your approval                                    │
│  Dr. Smith · 5–10 Apr  |  Dr. Jones · 15 Apr  |  +1 more                           │
│                                                   [Review All] [View Providers]     │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

Triggered when: any `provider_time_off.is_approved = FALSE` (status = pending).

**Alert 3 — Provider at Full Capacity with Waiting Patients**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  🔴 Dr. Kim Park is at full capacity (8/8) and 3 patients are waiting for ECG Test  │
│  Consider redistributing load or approving capacity override.                        │
│                                                   [View Provider] [Open Waitlist]   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

Triggered when: a provider is at `max_daily_appointments` AND there are `waiting` waitlist entries for a service they can provide.

**Alert 4 — Failed Notifications (batch)**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ⚠ 5 appointment reminders failed to deliver in the last 2 hours                    │
│  Email delivery errors — check notification logs.                                    │
│                                                   [View Notifications]               │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

Triggered when: `notifications.status = failed` count exceeds a threshold (e.g., > 3 in the last 2 hours).

**Alert 5 — Providers Marked On Leave with Active Appointments**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ⚠ Dr. Jones is On Leave but has 2 appointments still scheduled today               │
│  Manual reassignment or cancellation may be required.                                │
│                                                   [View Appointments]                │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

Triggered when: `providers.status = on_leave` AND that provider has `appointments.status = scheduled` for today.

### 4.2 Alert Dismissal

Each alert has a dismiss (✕) button. Dismissed alerts are hidden for the current session only — they reappear on next page load if the condition persists. Dismissal is client-side only (no API call).

### 4.3 Alert Data Loading

Alerts are derived from the dashboard summary API response and the real-time WebSocket. No separate alert-specific API call needed.

---

## 5. Section C — Main Grid (Left + Right Columns)

The primary content grid. The left column (~60%) contains the appointment flow chart and provider utilisation grid. The right column (~40%) contains the waitlist snapshot and activity feed.

---

### 5A. Today's Appointment Flow Chart

**Component: `<AppointmentFlowChart />`**

A card occupying the full left column width, ~280px tall.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Today's Appointments                            [View All →]        │
│  Thursday, 2 April 2026                                              │
│  ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│   ████░░░░░░░░░░░░░░  31 Completed   ████████░  4 In Progress        │
│   ████████████░░░░░░  18 Scheduled   ███░░░░░░  5 Cancelled          │
│                                      █░░░░░░░░  3 No-Show            │
│                                                                      │
│   ─────────────────────────────────────────────────────────────────  │
│   Total today:  61   Progress: ████████████████░░░░░░░ 51%          │
│                                                                      │
│  HOURLY TIMELINE — appointments by status across time (bar chart)    │
│                                                                      │
│  08  09  10  11  12  13  14  15  16  17  18                         │
│  ██  ██  ██  ██  ██  ██  ██  ██  ██  ██                             │
│   C   C   C   C   C   C  S   S   S   S                              │
│       Now ↑                                                          │
└──────────────────────────────────────────────────────────────────────┘
```

**Top section — Status breakdown:**

Horizontal stacked bars or a grid of labelled count cells. Each status shown with its count and a proportional bar:
- Completed (green bar)
- In Progress (amber bar, pulsing animation)
- Scheduled (blue bar — remaining)
- Cancelled (grey bar)
- No-Show (red bar)

**Overall progress bar:** A single full-width bar showing `(completed + in_progress) / total` as the "done" portion. Percentage shown as text. Refreshes via WebSocket.

**Hourly Timeline:** A simple bar chart (not interactive — read-only) showing appointment count per hour of the day. Bars are split by status color (stacked). A vertical "Now" indicator line at the current hour. This lets the admin see: "Is 2pm going to be as busy as 10am was?"

**"View All →" link:** Navigates to `/dashboard/admin/appointments?date=today`.

**API:**
```
GET /api/v1/dashboard/summary          ← counts for status breakdown
GET /api/v1/appointments/stats/today   ← hourly breakdown
```

**WebSocket:** Subscribe to `dashboard:global`. On `appointment_created`, `appointment_status_changed`, `appointment_cancelled` — update counts and progress bar.

---

### 5B. Provider Utilisation Grid

**Component: `<ProviderUtilisationGrid />`**

Directly below the flow chart in the left column. Shows every active provider with their current daily capacity status. This is the most operationally useful panel for admins managing a multi-provider clinic.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Provider Utilisation                        [Manage Providers →]    │
│  4 providers · 2 available · 1 busy · 1 on leave                    │
│  ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│  Dr. Sarah Smith          Cardiology       ● Available               │
│  ████████████░░░░░░░░░░  6/8  (75%)   [3 remaining]  [View Queue]   │
│                                                                      │
│  Dr. Alan Jones           Cardiology       ● Available               │
│  ████░░░░░░░░░░░░░░░░░░  3/8  (37%)   [5 remaining]  [View Queue]   │
│                                                                      │
│  Dr. Kim Park             Cardiology       ● Busy / Full             │
│  ████████████████████████ 8/8  (100%) [FULL] [Override →]           │
│                                                                      │
│  Dr. Maya Patel           General          ○ On Leave                │
│  ░░░░░░░░░░░░░░░░░░░░░░  0/8  (0%)    [On Leave today]             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Each provider row:**

| Element | Content |
|---|---|
| Provider name | Bold — clicking navigates to `/dashboard/admin/providers?id={id}` |
| Specialization | Muted label |
| Status badge | ● Available (green) / ● Busy (amber) / ○ On Leave (muted) |
| Capacity bar | Filled progress bar — green < 70%, amber 70–99%, red = 100% |
| Capacity text | "6/8 (75%)" — booked/max + percentage |
| Remaining slots | "[3 remaining]" — muted, only shown if not full |
| FULL badge | Red pill shown when at 100% capacity |
| View Queue link | → navigates to the Queue Board view of Appointments filtered to this provider |
| Override link | Only shown on FULL providers. Opens Emergency Override flow |

**Summary line at top of card:** "4 providers · 2 available · 1 busy · 1 on leave" — updates via WebSocket.

**Sorting:** Providers sorted by utilisation percentage DESC (most loaded first) so the admin's attention goes to the providers that need it most.

**API:**
```
GET /api/v1/providers/                                      ← provider list with status
GET /api/v1/appointments/providers/{id}/capacity            ← per provider, in parallel
```

> **Backend note:** Ideally this is a single call: `GET /api/v1/dashboard/provider-utilisation` returning all providers with their capacity in one response. See §13.2.

**WebSocket:** On `capacity_updated` and `provider_status_changed` — update the specific provider row in-place (bar value, status badge).

---

### 5C. Waitlist Snapshot Panel

**Component: `<WaitlistSnapshotPanel />`**

Occupies the top portion of the right column. ~350px tall.

```
┌──────────────────────────────────────────────────┐
│  Waitlist                        [Open Waitlist →]│
│  12 patients waiting · Avg ~23 min               │
│  ─────────────────────────────────────────────── │
│                                                  │
│  BY PRIORITY                                     │
│  ⚡ Emergency   2  ← red pill, flashing          │
│  🔶 Urgent      4                                │
│  ○  Standard    6                                │
│                                                  │
│  BY SERVICE                                      │
│  ECG Test               ████ 4   ~35 min        │
│  General Consultation   ██████ 6  ~52 min       │
│  Blood Test             ██ 2    ~15 min          │
│                                                  │
│  ─────────────────────────────────────────────── │
│  TOP WAITING ENTRIES                             │
│  ⚡ Sara Ahmed · ECG Test · 28 min [Assign →]   │
│  ⚡ John Doe · Cardiology · 11 min [Assign →]   │
│  🔶 Ali Hassan · Gen. Consult · 8 min [Assign →]│
│                                                  │
│  [+ Add to Waitlist]                            │
└──────────────────────────────────────────────────┘
```

**Priority breakdown:** Three rows — Emergency / Urgent / Standard — with count badges. Emergency count has a pulsing red animation if > 0.

**By Service:** Compact horizontal bars showing count + estimated wait per service. Clicking a service name navigates to `/dashboard/admin/waitlist?service_id={id}`.

**Top Waiting Entries:** The top 3 entries sorted by the queue ordering (Emergency first, then by wait time). Each shows patient name, service, wait duration, and a direct "Assign →" button that opens the Manual Assign Modal (from the Waitlist page).

**"＋ Add to Waitlist"** shortcut at the bottom — opens Add to Waitlist modal.

**API:**
```
GET /api/v1/waitlist/stats/today      ← counts by priority + service
GET /api/v1/waitlist/?status=waiting&sort=priority_desc,queue_position_asc&page_size=3  ← top entries
GET /api/v1/waitlist/estimated-wait/{service_id}   ← per service wait estimate
```

**WebSocket:** Subscribe to `dashboard:global`. On `waitlist_entry_added`, `waitlist_assigned`, `waitlist_entry_cancelled` — update counts and top entries list.

---

### 5D. Live Activity Feed

**Component: `<LiveActivityFeed />`**

Occupies the bottom portion of the right column. A scrollable list of the most recent system activity. The admin can see at a glance what the team has been doing.

```
┌──────────────────────────────────────────────────┐
│  Recent Activity                [View Full Log →]│
│  ─────────────────────────────────────────────── │
│                                                  │
│  ● just now                                      │
│  Sara Ahmed assigned from waitlist               │
│  APT-20260402-019 · Dr. Smith · 10:30 AM         │
│  by System (auto-promotion)                      │
│                                                  │
│  ● 4 min ago                                     │
│  Appointment cancelled                           │
│  John Doe · Gen. Consult — Patient Request       │
│  by Jane Smith (Receptionist)                    │
│                                                  │
│  ● 12 min ago                                    │
│  Dr. Kim Park marked On Leave                   │
│  15 Apr – 19 Apr — Annual Leave                  │
│  by Dr. Kim Park (Provider)                      │
│                                                  │
│  ● 18 min ago                                    │
│  New patient created                            │
│  Ali Hassan · 01711-999888                       │
│  by Jane Smith (Receptionist)                    │
│                                                  │
│  [Show more ↓]                                   │
└──────────────────────────────────────────────────┘
```

**Each activity entry:**
- Relative timestamp ("just now", "4 min ago", "1 hr ago") — absolute timestamp on hover as tooltip
- Action description — human-readable summary
- Entity detail — appointment number or patient name or provider name
- Actor — who performed the action + their role

**Action type color coding (left dot):**
- Appointment created → green dot
- Appointment cancelled → red dot
- Appointment status change → blue dot
- Waitlist assigned → green dot
- Waitlist added → amber dot
- Provider status changed → purple dot
- Patient created/updated → teal dot
- System action (auto-promotion) → grey dot

**Default:** Shows last 20 entries. "Show more ↓" loads the next 20.

**Real-time:** New entries slide in from the top of the feed when WebSocket events arrive. Existing entries shift down. Maximum 50 entries shown before old ones are removed from the DOM.

**"View Full Log →"** navigates to `/dashboard/admin/audit`.

**API — initial load:**
```
GET /api/v1/activity-logs/?sort=created_at_desc&page_size=20
```

**WebSocket:** On any `dashboard:global` event, add a new entry to the top of the feed. The event payload is translated into a human-readable description client-side using the same mapping table used on the dedicated Audit page.

---

## 6. Section D — Secondary Insights Row

Three equal-width cards in a horizontal row. These are **historical context panels** — they show patterns over time rather than live operational data. They use data from the past 7 days by default with a compact period toggle.

---

### 6A. Appointments by Hour (Heatmap)

**Component: `<HourlyHeatmap />`**

Shows which hours of the day are busiest — across the past 7 days — as a heatmap grid.

```
┌──────────────────────────────────────┐
│  Busiest Hours          [7 days ▼]  │
│  When do most appointments happen?   │
│  ──────────────────────────────────  │
│       08  09  10  11  12  13  14  15 │
│  Mon  ░░  ██  ██  █░  ░░  ██  ██  █░│
│  Tue  ░░  ██  ██  ██  ░░  ██  ██  ██│
│  Wed  ░░  █░  ██  ██  ░░  ██  ██  ██│
│  Thu  ░░  ██  ██  █░  ░░  ██  █░  ░░│
│  Fri  ░░  ██  █░  ██  ░░  ██  █░  ░░│
│                                      │
│  Darkest = most appointments         │
└──────────────────────────────────────┘
```

**Grid:** Days (Mon–Fri) on Y-axis. Hours (08:00–18:00) on X-axis. Cell fill intensity = appointment count (lighter = fewer, darker = more). The admin can immediately see that 10 AM and 2 PM are the peak hours.

**Period toggle:** 7 days / 30 days / This month. Changes the aggregation period.

**Tooltip on hover:** "Tuesday 10:00 AM — 24 appointments (avg. over period)"

**API:**
```
GET /api/v1/dashboard/appointments-by-hour?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
```
> **Backend note:** See §13.3.

---

### 6B. Service Demand Chart

**Component: `<ServiceDemandChart />`**

Shows which services are most in demand — by appointment count — over the past 7 days.

```
┌──────────────────────────────────────┐
│  Top Services               [7d ▼]  │
│  Most requested this week            │
│  ──────────────────────────────────  │
│  General Consult  ██████████ 87     │
│  Blood Test       ███████    61     │
│  ECG Test         ████       38     │
│  Echocardiography ██         19     │
│  Physio Session   ██         16     │
│                                      │
│  [View all services →]              │
└──────────────────────────────────────┘
```

**Chart type:** Horizontal bar chart. Sorted by count descending. Top 5 services shown. Each bar has the count label at the end.

**Period toggle:** 7 days / 30 days / 90 days.

**"View all services →"** navigates to `/dashboard/admin/appointments?view=list` (the list view shows service distribution naturally through filtering).

**API:**
```
GET /api/v1/dashboard/service-demand?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
```
> **Backend note:** See §13.4.

---

### 6C. No-Show & Cancellation Trend

**Component: `<NoShowTrendChart />`**

A 7-day trend line showing no-show rate and cancellation rate day by day. Helps the admin spot patterns — "Is Wednesday always bad for no-shows?"

```
┌──────────────────────────────────────┐
│  No-Show & Cancellation    [7d ▼]   │
│  Rate trend over time                │
│  ──────────────────────────────────  │
│  12% ┤         ╭╮                   │
│   9% ┤    ╭────╯╰────╮              │
│   6% ┤────╯           ╰────         │
│   3% ┤ - - - - - - - - - -          │
│       Mon  Tue  Wed  Thu  Fri Sat   │
│                                      │
│  ── No-Show  - - Cancellation        │
│  Avg no-show:  6.1%   (↑ 0.8%)      │
│  Avg cancellation: 9.3% (↓ 1.2%)   │
└──────────────────────────────────────┘
```

**Chart type:** Line chart. Two lines — no-show rate (solid) and cancellation rate (dashed). Y-axis: percentage (0–20%). X-axis: days of the week.

**Summary below chart:** Average rates for the period + trend vs. prior period.

**Period toggle:** 7 days / 30 days.

**API:**
```
GET /api/v1/dashboard/no-show-trend?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
```
> **Backend note:** See §13.5.

---

## 7. Section E — Quick Actions

**Component: `<QuickActionsRow />`**

A horizontal row of shortcut buttons at the bottom of the dashboard. For the most common admin actions that can be initiated without navigating to another page first.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Quick Actions                                                                         │
│                                                                                        │
│  [+ Book Appointment]  [+ New Patient]  [+ Add to Waitlist]  [↓ Export Today's Report]│
│                                                                                        │
│  [👥 Manage Providers]  [📋 View Full Schedule]  [🔔 Notification Log]                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

| Button | Action |
|---|---|
| **＋ Book Appointment** | Opens the Book Appointment Modal (same as on the Appointments page) |
| **＋ New Patient** | Opens the Create Patient Drawer |
| **＋ Add to Waitlist** | Opens the Add to Waitlist Modal |
| **↓ Export Today's Report** | Triggers `GET /api/v1/appointments/export?format=pdf&date=today`. Downloads today's full schedule as PDF. |
| **Manage Providers** | Navigates to `/dashboard/admin/providers` |
| **View Full Schedule** | Navigates to `/dashboard/admin/appointments?view=calendar&date=today` |
| **Notification Log** | Navigates to `/dashboard/admin/audit?entity_type=notification` (or a filtered view of the notifications section) |

---

## 8. Page Header & Navigation Context

### 8.1 Admin Sidebar Navigation

The admin dashboard exists within a shell that has a sidebar navigation. The sidebar is defined once in a layout file and persists across all admin routes. This spec covers only the `page.tsx` content — the sidebar is a separate component.

**Sidebar structure (reference):**
```
/dashboard/admin            ← Overview (this page)
/dashboard/admin/appointments
/dashboard/admin/patients
/dashboard/admin/waitlist
/dashboard/admin/providers
/dashboard/admin/users
/dashboard/admin/rbac
/dashboard/admin/audit
```

The "Overview" item in the sidebar should be active when on `/dashboard/admin`.

### 8.2 Page Title (Browser Tab)

```
Admin Dashboard — MediSync
```

Updated dynamically using Next.js `<title>` metadata.

---

## 9. Real-Time WebSocket Integration

### 9.1 Connection

On dashboard page mount, connect to:
```
WS /ws/dashboard:global
```

This single channel receives all events needed for the entire dashboard overview. No per-provider or per-service channel subscriptions needed here — the overview consumes the global broadcast.

### 9.2 Event Handling Map

| WS Event | KPI Strip | Flow Chart | Provider Grid | Waitlist Snapshot | Activity Feed | Alert Zone |
|---|---|---|---|---|---|---|
| `appointment_created` | ↑ Today's Bookings | Add to scheduled bar | — | — | New entry | — |
| `appointment_status_changed` | Update relevant status count | Update bar proportions + timeline | — | — | New entry | Check for on-leave conflicts |
| `appointment_cancelled` | ↑ Cancelled, recalc no-show | Update bar | — | — | New entry | Check provider conflicts |
| `capacity_updated` | — | Update progress bar | Update provider row | — | — | Check full provider alert |
| `provider_status_changed` | — | — | Update provider badge + bar | — | New entry | Check on-leave conflicts |
| `waitlist_entry_added` | ↑ Waitlist Active | — | — | Update counts + top entries | New entry | Check emergency alert |
| `waitlist_assigned` | ↓ Waitlist Active | — | — | Remove from top entries, update counts | New entry | Dismiss emergency alert if applicable |
| `waitlist_entry_cancelled` | ↓ Waitlist Active | — | — | Update counts | New entry | — |

### 9.3 Local State Management for Live Counts

Maintain a client-side count map that is initialised from the API on load and updated incrementally via WebSocket — never re-fetch the summary API on each event:

```typescript
interface DashboardLiveCounts {
  today_total: number;
  scheduled: number;
  checked_in: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  no_show: number;
  waitlist_waiting: number;
  waitlist_emergency: number;
  waitlist_urgent: number;
}

// On appointment_status_changed event:
// counts[old_status]--
// counts[new_status]++
// Update no_show_rate = (counts.no_show / counts.today_total) * 100
```

### 9.4 Activity Feed Real-Time Insertion

Translate WebSocket event payloads into human-readable activity entries client-side:

```typescript
function wsEventToActivityEntry(event: WSEvent): ActivityEntry {
  switch (event.event) {
    case 'appointment_created':
      return {
        timestamp: event.timestamp,
        description: `Appointment booked`,
        detail: `${event.data.appointment_number} · ${event.data.patient_name} · ${event.data.provider_name}`,
        actor: event.data.created_by_name,
        actorRole: event.data.created_by_role,
        type: 'appointment_created',
      };
    case 'appointment_cancelled':
      return {
        description: `Appointment cancelled`,
        detail: `${event.data.patient_name} · ${event.data.service_name} — ${event.data.reason}`,
        actor: event.data.cancelled_by_name,
        type: 'appointment_cancelled',
      };
    case 'waitlist_assigned':
      return {
        description: `Waitlist patient assigned`,
        detail: `${event.data.patient_name} → ${event.data.appointment_number} · ${event.data.provider_name}`,
        actor: event.data.assigned_by === 'system' ? 'System (auto-promotion)' : event.data.assigned_by_name,
        type: 'waitlist_assigned',
      };
    // ... other event types
  }
}
```

### 9.5 Reconnection Strategy

1. Attempt reconnect every 3s for first 30 seconds
2. Then every 15 seconds
3. After 2 minutes of failure: switch to 60-second polling on the summary endpoint
4. Show persistent "Live updates paused — reconnecting..." banner below the KPI strip
5. On reconnect: re-fetch summary data to reconcile any missed events, then dismiss banner

---

## 10. Data Fetching Strategy

### 10.1 Initial Page Load — Parallel Fetch

Everything needed to render the dashboard above the fold should be resolved in one parallel batch:

```typescript
const [summary, providers, waitlistStats, recentActivity] = await Promise.all([
  GET /api/v1/dashboard/summary,               // KPI strip + appointment flow
  GET /api/v1/dashboard/provider-utilisation,  // provider utilisation grid
  GET /api/v1/waitlist/stats/today,            // waitlist snapshot counts
  GET /api/v1/activity-logs/?page_size=20,     // activity feed initial entries
]);
```

Target: all four calls complete in < 600ms total (parallel, not sequential). The page should render meaningful content within 2 seconds of navigation.

### 10.2 Deferred / Lazy Loads

Charts in the Secondary Insights Row are **deferred** — they do not block the above-fold render. They load after the main grid is visible, using `Suspense` boundaries or `useEffect` hooks:

```typescript
// Lazy load — fires after initial render is complete
useEffect(() => {
  Promise.all([
    GET /api/v1/dashboard/appointments-by-hour,
    GET /api/v1/dashboard/service-demand,
    GET /api/v1/dashboard/no-show-trend,
    GET /api/v1/waitlist/?status=waiting&page_size=3,  // top waitlist entries
  ]);
}, []);
```

### 10.3 Pending Time-Off Count

The alert zone checks for pending time-off requests. This is loaded as part of the summary or as a separate lazy call:

```
GET /api/v1/time-off/?is_approved=false&page_size=3
```

> **Backend note:** `GET /api/v1/time-off/` needs a global (cross-provider) version accessible to admins. The current endpoint is `GET /api/v1/time-off/{provider_id}`. A new admin-level endpoint is needed. See §13.6.

### 10.4 Stale Data Prevention

The dashboard summary data is **never cached beyond the current session**. On every page visit (including navigating back from another admin page), the summary data is re-fetched fresh. Chart data (deferred) can use a 5-minute stale-while-revalidate strategy since it is historical and changes slowly.

---

## 11. Responsive Layout

### 11.1 Desktop (≥ 1280px) — Full Layout

The full two-column main grid as described in §1.4. All three secondary insight charts side by side. All quick actions visible in one row.

### 11.2 Tablet (768px – 1279px)

- Left/right column layout collapses to single column
- Order: KPI strip → Alerts → Flow Chart → Waitlist Snapshot → Provider Grid → Activity Feed
- Secondary charts: 2 per row (heatmap + service demand), then trend chart full width
- Quick actions: 2 per row

### 11.3 Mobile (< 768px)

- All panels stack single column
- KPI strip wraps to 2-column grid (3 chips per row, 2 rows)
- Provider grid shows compact list (one row per provider, no wide bars)
- Secondary charts hidden by default — replaced with a "View Analytics →" link
- Quick actions: single column list

---

## 12. UI State Standards

### 12.1 Page-Level Loading (Initial Load)

While the parallel fetches are in-flight, show skeleton placeholders for every section. The page must not be blank — skeletons maintain layout and set expectations:

| Component | Skeleton Shape |
|---|---|
| KPI Strip | 6 rectangular chip skeletons, equal width |
| Alert Zone | Hidden (no skeleton — alerts only render when data confirms they exist) |
| Flow Chart | Card skeleton with a horizontal bar area + a small bar chart area |
| Provider Grid | 4 horizontal row skeletons (avatar + bar + text) |
| Waitlist Snapshot | Card with 3 text line skeletons + 3 compact row skeletons |
| Activity Feed | 5 timeline entry skeletons (dot + 2 text lines each) |
| Secondary Charts | 3 card skeletons, 33% width each |
| Quick Actions | 7 button skeletons in a row |

Stagger skeleton animation delays: each section starts its pulse 80ms after the previous one to avoid a synchronised flash effect.

### 12.2 Partial Load Success

If some parallel fetches succeed and others fail, render what succeeded. Don't block the whole page on a single failing endpoint. Each panel has its own error state:

```
┌──────────────────────────────────────────────────┐
│  Provider Utilisation                            │
│  ─────────────────────────────────────────────── │
│  Could not load provider data.                  │
│  [Retry]                                         │
└──────────────────────────────────────────────────┘
```

### 12.3 Empty States

| Scenario | Message |
|---|---|
| No appointments today | "No appointments scheduled for today. Use the quick actions below to get started." |
| No providers available | "No active providers. Go to Providers to add your first provider." |
| Waitlist empty | "No patients currently waiting. The queue is clear ✓" |
| Activity feed empty | "No recent activity. Actions taken by staff will appear here." |
| No alerts | Alert zone is hidden — zero height, not an empty card |

### 12.4 Real-Time Metric Animation Rules

| Metric Change | Animation |
|---|---|
| KPI count increases | Number increments with a brief upward-sweep animation (200ms) |
| KPI count decreases | Number decrements with a downward-sweep animation (200ms) |
| In Progress count changes | Number scales up (1.2×) and back to 1× (150ms) — most urgent signal |
| Provider capacity increases | Progress bar fill widens smoothly (300ms ease-out) |
| New activity feed entry | Entry slides in from above (250ms slide-down) |
| Emergency waitlist entry | Alert banner fades in (200ms) — does NOT use slide or bounce |

Do not animate every field on every WS event — only the specific metric that changed.

### 12.5 Toast Notifications

The dashboard overview shows a minimal set of toasts for events that the admin may want to act on immediately:

| Event | Toast |
|---|---|
| Emergency patient added to waitlist | "⚡ Emergency — [Name] waiting for [Service]. [Assign Now]" (with action button in toast) |
| Provider goes to full capacity | "🔴 [Provider] is now at full capacity (8/8)" |
| Appointment auto-assigned from waitlist | "✓ [Name] auto-assigned from waitlist — [Service]" |
| WS disconnect | "Live updates paused — reconnecting..." (persistent, amber) |
| WS reconnected | "Live updates restored ✓" (auto-dismiss 3s) |

No toast for routine operations (normal appointment bookings, status changes) — that would flood the admin with noise.

---

## 13. Required Backend Endpoints

---

### 13.1 GET dashboard summary

**The most important new endpoint for this page.**

```
GET /api/v1/dashboard/summary
```

**Response:**
```json
{
  "date": "2026-04-02",
  "appointments": {
    "total_today": 61,
    "scheduled": 18,
    "checked_in": 5,
    "in_progress": 4,
    "completed": 31,
    "cancelled": 5,
    "no_show": 3,
    "no_show_rate_today": 5.2,
    "no_show_rate_yesterday": 7.1,
    "progress_percent": 51
  },
  "waitlist": {
    "total_waiting": 12,
    "emergency_waiting": 2,
    "urgent_waiting": 4,
    "standard_waiting": 6,
    "avg_wait_minutes": 23
  },
  "providers": {
    "total_active": 4,
    "available": 2,
    "busy": 1,
    "on_leave": 1
  },
  "alerts": {
    "pending_time_off_count": 3,
    "failed_notifications_last_2h": 5,
    "providers_on_leave_with_appointments": [
      { "provider_id": "uuid", "provider_name": "Dr. Jones", "appointment_count": 2 }
    ],
    "full_providers_with_waitlist": [
      { "provider_id": "uuid", "provider_name": "Dr. Park", "waiting_count": 3, "service_name": "ECG Test" }
    ]
  },
  "trends": {
    "bookings_vs_yesterday_pct": 12,
    "completed_vs_yesterday_pct": 6,
    "waitlist_vs_24h_ago": 3
  }
}
```

Server-side: this is one aggregated query (or a set of fast subqueries). Must return in < 200ms. Index-friendly queries only.

---

### 13.2 GET dashboard provider utilisation

```
GET /api/v1/dashboard/provider-utilisation
```

**Response:**
```json
{
  "providers": [
    {
      "id": "uuid",
      "name": "Dr. Sarah Smith",
      "specialization": "Cardiology",
      "status": "available",
      "booked_today": 6,
      "max_daily_appointments": 8,
      "utilisation_percent": 75,
      "remaining_slots": 2
    }
  ]
}
```

Returns all active providers with their today's capacity in one response. Sorted by `utilisation_percent DESC`.

---

### 13.3 GET appointments by hour (heatmap data)

```
GET /api/v1/dashboard/appointments-by-hour?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
```

**Response:**
```json
{
  "data": [
    { "day_of_week": 0, "hour": 9, "count": 24 },
    { "day_of_week": 0, "hour": 10, "count": 31 },
    { "day_of_week": 1, "hour": 9, "count": 19 }
  ]
}
```

`day_of_week`: 0 = Monday, 6 = Sunday.
`hour`: 0–23 (only hours with data returned, not all 24).

Server-side: `GROUP BY EXTRACT(DOW FROM appointment_start), EXTRACT(HOUR FROM appointment_start)`.

---

### 13.4 GET service demand

```
GET /api/v1/dashboard/service-demand?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&limit=5
```

**Response:**
```json
{
  "services": [
    { "service_id": "uuid", "service_name": "General Consultation", "count": 87, "percent": 36 }
  ]
}
```

Server-side: `GROUP BY service_id ORDER BY COUNT(*) DESC LIMIT :limit`.

---

### 13.5 GET no-show and cancellation trend

```
GET /api/v1/dashboard/no-show-trend?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
```

**Response:**
```json
{
  "days": [
    {
      "date": "2026-03-27",
      "total": 58,
      "no_show": 4,
      "cancelled": 6,
      "no_show_rate": 6.9,
      "cancellation_rate": 10.3
    }
  ],
  "averages": {
    "no_show_rate": 6.1,
    "cancellation_rate": 9.3,
    "no_show_vs_prior_period": 0.8,
    "cancellation_vs_prior_period": -1.2
  }
}
```

---

### 13.6 GET all pending time-off requests (admin-level)

**Extend or create:**
```
GET /api/v1/time-off/?is_approved=false&page_size=5
```

The current `GET /api/v1/time-off/{provider_id}` is scoped per provider. Admins need a cross-provider endpoint. Either add an admin-accessible version of the time-off list without the `{provider_id}` path param, or add it as a query param: `GET /api/v1/time-off/?provider_id=all&is_approved=false`.

---

### 13.7 GET hourly appointment timeline (for Flow Chart)

```
GET /api/v1/appointments/stats/today
```

This endpoint was already defined in the Appointments page spec. Extend it to include the hourly breakdown:

```json
{
  "date": "2026-04-02",
  "counts": { "scheduled": 18, "in_progress": 4, "completed": 31, ... },
  "hourly": [
    { "hour": 8, "scheduled": 3, "completed": 2, "in_progress": 0, "cancelled": 0, "no_show": 0 },
    { "hour": 9, "scheduled": 4, "completed": 6, "in_progress": 2, "cancelled": 1, "no_show": 1 }
  ]
}
```

---

## 14. API Quick Reference

| # | Method | Endpoint | Status | Used In |
|---|---|---|---|---|
| 1 | GET | `/api/v1/dashboard/summary` | ⚠️ **Create** (§13.1) | KPI Strip, Alert Zone, Waitlist Snapshot counts, Provider summary |
| 2 | GET | `/api/v1/dashboard/provider-utilisation` | ⚠️ **Create** (§13.2) | Provider Utilisation Grid |
| 3 | GET | `/api/v1/dashboard/appointments-by-hour` | ⚠️ **Create** (§13.3) | Hourly Heatmap chart |
| 4 | GET | `/api/v1/dashboard/service-demand` | ⚠️ **Create** (§13.4) | Service Demand chart |
| 5 | GET | `/api/v1/dashboard/no-show-trend` | ⚠️ **Create** (§13.5) | No-Show Trend chart |
| 6 | GET | `/api/v1/appointments/stats/today` | ✅ Extend (add `hourly` array per §13.7) | Appointment Flow Chart timeline |
| 7 | GET | `/api/v1/waitlist/stats/today` | ⚠️ Already flagged in Waitlist spec | Waitlist Snapshot counts |
| 8 | GET | `/api/v1/waitlist/` | ✅ Extend (add filters already in Waitlist spec) | Waitlist top 3 entries |
| 9 | GET | `/api/v1/waitlist/estimated-wait/{service_id}` | ✅ Yes | Waitlist Snapshot per-service wait |
| 10 | GET | `/api/v1/activity-logs/` | ✅ Yes | Live Activity Feed initial load |
| 11 | GET | `/api/v1/profile/me` | ✅ Yes | Dashboard header greeting |
| 12 | GET | `/api/v1/time-off/` | ⚠️ Create admin-level version (§13.6) | Alert Zone — pending time-off count |
| 13 | WS | `/ws/dashboard:global` | ✅ Yes | All real-time updates across the dashboard |

**Legend:**
- ✅ Yes = endpoint exists and works as-is
- ✅ Extend = endpoint exists but needs new fields
- ⚠️ Create = must be built before this page can function fully

---

*MediSync Admin Dashboard Overview Frontend Spec — Version 1.0 — April 2026 — Internal Use Only*