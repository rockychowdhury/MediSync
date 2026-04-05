# MediSync — Admin Waitlist Page Implementation Spec
**Route:** `http://localhost:3000/dashboard/admin/waitlist`
**Version:** 1.0 | **Prepared for:** Frontend Development Team | **Date:** April 2026
**Scope:** End-to-end design and implementation guide for the Waitlist management page inside the Admin dashboard — covering live queue monitoring, manual assignment, priority management, auto-promotion visibility, estimated wait times, analytics, and real-time WebSocket updates.

---

## Table of Contents

1. [Mental Model & Design Decisions](#1-mental-model--design-decisions)
2. [Page Layout & File Structure](#2-page-layout--file-structure)
3. [Section A — Command Bar (KPIs + Controls)](#3-section-a--command-bar-kpis--controls)
4. [Section B — Service Queue Columns (Primary View)](#4-section-b--service-queue-columns-primary-view)
5. [Section C — Unified List View](#5-section-c--unified-list-view)
6. [Section D — Analytics Panel](#6-section-d--analytics-panel)
7. [Filter & Search Toolbar](#7-filter--search-toolbar)
8. [Waitlist Entry Detail Drawer](#8-waitlist-entry-detail-drawer)
9. [Add to Waitlist Modal](#9-add-to-waitlist-modal)
10. [Manual Assign Modal](#10-manual-assign-modal)
11. [Edit Waitlist Entry Drawer](#11-edit-waitlist-entry-drawer)
12. [Cancel / Remove Entry Dialog](#12-cancel--remove-entry-dialog)
13. [Priority Override Dialog](#13-priority-override-dialog)
14. [Real-Time WebSocket Integration](#14-real-time-websocket-integration)
15. [Data Fetching & State Management](#15-data-fetching--state-management)
16. [UI State Standards](#16-ui-state-standards)
17. [Required Backend Endpoints](#17-required-backend-endpoints)
18. [API Quick Reference](#18-api-quick-reference)

---

## 1. Mental Model & Design Decisions

### 1.1 What This Page Does

The Waitlist page is the admin's **real-time operations centre for queue management**. It answers four critical operational questions at a glance:

1. **Who is waiting and for what?** — A live ordered list of patients waiting for service slots, grouped by service, sorted by priority then position.
2. **How long are they waiting?** — Estimated wait times calculated from queue position, average service duration, and active provider count.
3. **What has happened?** — Historical view of assigned, cancelled, and expired entries. Tracks conversion rate and identifies bottlenecks.
4. **What should the admin do?** — Manual assignment when auto-promotion hasn't fired, priority escalation for urgent cases, and entry cancellation when patients leave.

### 1.2 The Waitlist vs. the Provider Queue

These are two different concepts that must be clearly distinguished in the UI:

| | **Waitlist** (`waitlist` table) | **Provider Queue** (derived from `appointments`) |
|---|---|---|
| What is it? | Patients with NO confirmed slot yet | Patients with a confirmed appointment slot for today |
| Where is it? | This page | Provider Dashboard + Receptionist Today's Queue |
| How do patients leave? | Auto-promotion when a slot frees, or manual assignment, or cancellation | Appointment progresses through status states |
| Position | `queue_position` column | Derived from `appointment_start` sort |

The admin waitlist page manages **pre-appointment** state. Once a patient is assigned from the waitlist, they appear in the appointment system and leave this page.

### 1.3 Queue Ordering Rules (Frontend Must Enforce Display)

The waitlist ordering is defined in the system design as a three-level composite sort:

```
1. priority DESC     → Emergency first, then Urgent, then Standard
2. queue_position ASC → Lower position = earlier in queue
3. created_at ASC    → First-come-first-served for ties
```

The frontend must render entries in exactly this order. The backend API should return them pre-sorted, but the frontend must also maintain this order when applying optimistic updates from WebSocket events.

### 1.4 Two Primary View Modes

- **Service Column View** (default) — A vertical column per service currently on the waitlist. Within each column, entries are sorted by the queue ordering rules above. This makes it easy to see demand per service and act on the most urgent cases across all services simultaneously.
- **Unified List View** — All entries in a single flat table regardless of service. Better for searching, filtering, and bulk operations.

### 1.5 Admin-Exclusive Capabilities

Admins can do things on the waitlist that receptionists cannot:

| Capability | Receptionist | Admin |
|---|---|---|
| View waitlist | Yes | Yes |
| Add entries | Yes | Yes |
| Cancel entries | Yes | Yes |
| Manual assign | Yes | Yes |
| Override priority | No | Yes |
| Expire entries manually | No | Yes |
| View analytics | No | Yes |
| Reorder queue manually | No | Yes |
| Bulk cancel | No | Yes |

---

## 2. Page Layout & File Structure

### 2.1 File Structure (Next.js App Router)

```
app/
└── dashboard/
    └── admin/
        └── waitlist/
            ├── page.tsx                          ← Root page, view toggle, global state
            ├── components/
            │   ├── CommandBar.tsx                ← KPI strip + top controls
            │   ├── FilterToolbar.tsx             ← Filters shared across views
            │   ├── ViewToggle.tsx                ← Columns | List | Analytics
            │   ├── views/
            │   │   ├── ServiceColumnsView.tsx    ← Kanban columns per service
            │   │   ├── ServiceColumn.tsx         ← Single service column component
            │   │   ├── WaitlistCard.tsx          ← Individual entry card
            │   │   ├── ListView.tsx              ← Unified flat table
            │   │   └── AnalyticsView.tsx         ← Charts + stats panel
            │   ├── WaitlistEntryDrawer.tsx       ← Detail drawer (right slide-in)
            │   ├── AddToWaitlistModal.tsx        ← Add entry flow
            │   ├── ManualAssignModal.tsx         ← Manual slot assignment flow
            │   ├── EditEntryDrawer.tsx           ← Edit existing entry
            │   ├── CancelEntryDialog.tsx
            │   ├── PriorityOverrideDialog.tsx
            │   └── BulkActionsBar.tsx
            └── hooks/
                ├── useWaitlist.ts                ← list fetching + filters
                ├── useWaitlistActions.ts         ← add, cancel, assign, edit
                └── useWaitlistWebSocket.ts       ← WS connection + event handlers
```

### 2.2 Page Header

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  Waitlist                                                  [+ Add to Waitlist]   │
│  Manage the patient waiting queue — monitor, assign, and escalate entries.       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

- Title: "Waitlist" (H1)
- Subtitle: "Manage the patient waiting queue — monitor, assign, and escalate entries."
- "＋ Add to Waitlist" — persistent top-right button. Opens Add to Waitlist Modal (§9). Visible regardless of view mode.

---

## 3. Section A — Command Bar (KPIs + Controls)

**Component: `<CommandBar />`**

A sticky strip directly below the page header. Always visible. Provides a live operational snapshot and quick access to the most common actions.

```
┌─────────────┬────────────────┬─────────────┬─────────────┬───────────────────────────┐
│  Waiting    │   Assigned     │  Cancelled  │  Expired    │  Avg. Wait Today          │
│     12      │  Today: 34     │  Today: 5   │  Today: 2   │  ~23 min                  │
│  right now  │  from waitlist │             │             │  across all services       │
└─────────────┴────────────────┴─────────────┴─────────────┴───────────────────────────┘
```

**KPI Chips:**

| Chip | Value | Click Behaviour |
|---|---|---|
| **Waiting** | Live count of `status = waiting` entries | Filters view to waiting entries only |
| **Assigned Today** | Count assigned today (`status = assigned` + `updated_at = today`) | Filters to today's assigned entries |
| **Cancelled Today** | Count cancelled today | Filters to today's cancelled entries |
| **Expired Today** | Count expired today | Filters to today's expired entries |
| **Avg. Wait Today** | Average minutes from `created_at` to assignment for today's assigned entries | Opens Analytics view |

**Priority Alert Banner (conditional):** If any `priority = emergency` entry has `status = waiting`, render a prominent red alert below the KPI strip:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ⚡ EMERGENCY  1 emergency patient is waiting — immediate action required        │
│  Sara Ahmed · ECG Test · Waiting 14 min              [Assign Now] [View Entry]   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

This alert auto-dismisses when the entry is assigned or cancelled. If multiple emergency entries exist, the alert shows the longest-waiting one and a count: "⚡ 2 emergency patients waiting."

**API — initial load:**
```
GET /api/v1/waitlist/stats/today
```
> **Backend note:** This endpoint needs to be **created**. See §17.1.

**WebSocket update:** KPI counts update live from WebSocket events — no polling needed.

---

## 4. Section B — Service Queue Columns (Primary View)

**Component: `<ServiceColumnsView />`**

The default view. One column per service that currently has at least one `waiting` entry. Columns are ordered by urgency: services with Emergency entries first, then services with Urgent entries, then Standard-only services.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [Refresh: Live ●]              [Columns: All Services ▼]    [+ Add to Waitlist]       │
├──────────────────────────┬──────────────────────────┬─────────────────────────────────│
│  ECG Test                │  General Consultation    │  Blood Test                     │
│  3 waiting · ~35 min     │  6 waiting · ~52 min     │  1 waiting · ~15 min            │
│                          │                          │                                 │
│  ──── EMERGENCY ────     │  ──── URGENT ────        │  ──── STANDARD ────             │
│  ┌──────────────────┐    │  ┌──────────────────┐    │  ┌──────────────────────────┐   │
│  │ ⚡ #1 Sara Ahmed │    │  │ 🔶 #1 Ali Hassan │    │  │ #1 Maria Lee             │   │
│  │ Any Provider     │    │  │ Dr. Smith pref.  │    │  │ Any Provider             │   │
│  │ 14 min waiting   │    │  │ 8 min waiting    │    │  │ 3 min waiting            │   │
│  │ [Assign] [⋮]    │    │  │ [Assign] [⋮]    │    │  │ [Assign] [⋮]            │   │
│  └──────────────────┘    │  └──────────────────┘    │  └──────────────────────────┘   │
│                          │  ┌──────────────────┐    │                                 │
│  ──── STANDARD ────      │  │ 🔶 #2 Nadia Khan │    │                                 │
│  ┌──────────────────┐    │  │ Any Provider     │    │                                 │
│  │ #1 John Doe      │    │  │ 21 min waiting   │    │                                 │
│  │ Dr. Jones pref.  │    │  │ [Assign] [⋮]    │    │                                 │
│  │ 42 min waiting   │    │  └──────────────────┘    │                                 │
│  │ [Assign] [⋮]    │    │  [+ 4 more standard]      │                                 │
│  └──────────────────┘    │                          │                                 │
└──────────────────────────┴──────────────────────────┴─────────────────────────────────┘
```

### 4.1 Column Header

**Component: `<ServiceColumnHeader />`**

```
ECG Test
3 waiting · ~35 min avg
```

- Service name (bold)
- Total waiting count for this service
- Average estimated wait time for position #1 of this service
- A collapse toggle (⌄) to collapse the column to just the header (useful when monitoring many services)

**Estimated wait time per column:**
```
GET /api/v1/waitlist/estimated-wait/{service_id}
```

### 4.2 Priority Section Headers

Within each column, entries are visually grouped by priority with section dividers:

```
──── EMERGENCY ────    (red label — only shown if emergency entries exist)
──── URGENT ────       (amber label — only shown if urgent entries exist)
──── STANDARD ────     (grey label — only shown if standard entries exist)
```

If a priority group has more than 3 entries, collapse with a "Show N more" toggle. The top 3 of each group are always visible.

### 4.3 Waitlist Entry Card

**Component: `<WaitlistCard />`**

```
┌───────────────────────────────────────────────────────┐
│  ⚡ #1   Sara Ahmed                    14 min waiting │
│          Any Provider · Requested: Today              │
│          Notes: "Chest pain, urgent review"           │
│  [Assign Now]   [⋮ Edit · Escalate · Cancel]         │
└───────────────────────────────────────────────────────┘
```

**Card Elements:**

| Element | Content | Position |
|---|---|---|
| Priority icon + position | ⚡ for Emergency, 🔶 for Urgent, nothing for Standard. `#N` queue position. | Top-left |
| Patient name | Full name, bold | Top-center |
| Wait duration | "14 min waiting" — live-updating relative time | Top-right |
| Provider preference | "Any Provider" or "Dr. Smith preferred" | Second line left |
| Requested date | "Requested: Today" / "Requested: 5 Apr" | Second line right |
| Notes preview | First 60 chars of `waitlist.notes` if set, italicised | Third line — only if notes exist |
| Action buttons | "Assign Now" (primary) + ⋮ dropdown | Card footer |

**Wait duration counter:** Updates every 60 seconds client-side (no API call — derived from `created_at` timestamp loaded with the entry). Turns amber when wait > 30 min, red when wait > 60 min.

**Card states:**
- **Emergency** — distinct red left-border, slightly elevated shadow, name in bold
- **Urgent** — amber left-border
- **Standard** — default style
- **Being assigned (in-flight)** — semi-transparent overlay with loading spinner

**Clicking a card:** Opens Waitlist Entry Detail Drawer (§8).

### 4.4 Card Actions

**"Assign Now" button** — primary action on every card. Opens Manual Assign Modal (§10) pre-filled with this entry's data (patient, service, priority, preferred provider if set).

**⋮ More dropdown:**
- **Edit Entry** — opens Edit Entry Drawer (§11)
- **Escalate Priority** — only shown for Standard and Urgent entries. Opens Priority Override Dialog (§13).
- **Cancel Entry** — opens Cancel Entry Dialog (§12)
- **View Patient** — opens patient detail at `/dashboard/admin/patients?id={patient_id}` in a new tab
- **View Details** — opens Waitlist Entry Detail Drawer (§8)

### 4.5 Auto-Promotion Visual Feedback

When a slot frees up and the backend auto-promotes a waitlist entry, the WebSocket fires a `waitlist_assigned` event. The UI must:

1. Animate the assigned card out of the column (slide up + fade out)
2. Show a brief toast: "✓ Sara Ahmed auto-assigned — ECG Test · 10:30 AM · Dr. Jones"
3. Renumber the remaining cards' positions instantly
4. Update the column header count and estimated wait time

### 4.6 Empty Column State

When a service has no more waiting entries:

```
┌──────────────────────────────────┐
│  ECG Test                        │
│  0 waiting                       │
│                                  │
│  Queue is clear                  │
│  [+ Add Patient] ← shortcut      │
└──────────────────────────────────┘
```

The column does NOT disappear when empty — it stays visible for 60 seconds after clearing so the admin can see it cleared, then fades out if still empty.

---

## 5. Section C — Unified List View

**Component: `<ListView />`**

A flat paginated table of all waitlist entries regardless of service. Optimised for searching, bulk operations, and historical review.

### 5.1 Table Header Controls

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  Waitlist Entries (53 total)       [Select All]  [Bulk Actions ▼]  [Export CSV]  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

- **Result count** — total matching active filters
- **Select All / Bulk Actions** — for bulk cancel operations
- **Export CSV** — export all matching entries

### 5.2 Table Columns

| Column | Content | Sortable |
|---|---|---|
| **☐** | Checkbox for bulk selection | No |
| **#** | Queue position within priority tier | No |
| **Priority** | Badge — Emergency (red) / Urgent (amber) / Standard (muted) | Yes |
| **Patient** | Full name (bold) + phone below | Yes (by name) |
| **Service** | Service name | Yes |
| **Preferred Provider** | Provider name or "Any Available" | No |
| **Requested Date** | Date or "First Available" | Yes (by date) |
| **Waiting Since** | "14 min ago" — relative. Full timestamp on hover. | Yes (default sort) |
| **Est. Wait** | "~22 min" or "Unknown" | No |
| **Status** | Badge — Waiting / Assigned / Cancelled / Expired | Yes |
| **Actions** | Context buttons per status | No |

**Default sort:** `priority DESC, queue_position ASC, created_at ASC` (mirrors server-side queue ordering — the most critical entries appear first).

### 5.3 Status Badge Styles

| Status | Badge Style | Row Style |
|---|---|---|
| `waiting` | Pulsing amber — "Waiting" | Default |
| `assigned` | Solid green — "Assigned" | Muted — pushed to bottom |
| `cancelled` | Muted grey — "Cancelled" | Strikethrough on patient name, greyed |
| `expired` | Red outline — "Expired" | Greyed |

### 5.4 Actions Column per Status

**Status = `waiting`:**
- Primary: **"Assign Now"** — opens Manual Assign Modal (§10)
- ⋮: Edit · Escalate Priority · Cancel

**Status = `assigned`:**
- Text link: **"View Appointment"** → opens appointment detail for `assigned_appointment_id`
- ⋮: View Details

**Status = `cancelled` / `expired`:**
- Text link: **"View Details"** — opens Entry Detail Drawer (§8) in read-only mode

### 5.5 Bulk Operations

**Available when 1+ rows selected:**

**Bulk Cancel:**

```
Cancel Selected (5)
```

Opens compact dialog: "Cancel 5 waiting entries? This will remove them from the queue permanently." Optional shared reason. Fires individual DELETE calls in parallel.

**Export Selected:** Exports selected rows as CSV.

### 5.6 Pagination

```
Showing 1–50 of 53 entries     [< Prev]  1  [Next >]
Rows per page: [25 ▼] [50 ▼] [100 ▼]
```

Default: 50 per page.

---

## 6. Section D — Analytics Panel

**Component: `<AnalyticsView />`**

A dedicated analytics tab showing operational metrics about the waitlist. Not a real-time operational screen — it is for trend analysis and operational improvement decisions.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Waitlist Analytics               Period: [Today ▼]  [This Week] [This Month]│
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │
│  │ Total Added   │  │ Assigned      │  │ Conversion    │  │ Avg Wait Time │ │
│  │     56        │  │     34        │  │    60.7%      │  │   ~28 min     │ │
│  │ this period   │  │ from waitlist │  │ assigned/total│  │ to assignment │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│  BY SERVICE — Waitlist Volume                                                │
│  General Consultation  ████████████████  22  (39%)                          │
│  ECG Test              ████████████      16  (29%)                           │
│  Blood Test            ████████          11  (20%)                           │
│  Echocardiography      ████               7  (12%)                           │
├──────────────────────────────────────────────────────────────────────────────┤
│  WAIT TIME TREND (line chart — avg wait per day over selected period)        │
│                                                                              │
│  40 min ┤                    ╭╮                                              │
│  30 min ┤──────╮╭────────────╯╰────                                          │
│  20 min ┤      ╰╯                                                            │
│         └─────────────────────────────────────────                          │
│           Mon   Tue   Wed   Thu   Fri   Sat                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│  BY PRIORITY — Distribution                                                  │
│  Emergency  ██  4  (7%)                                                      │
│  Urgent     ████████  16  (29%)                                              │
│  Standard   ████████████████████  36  (64%)                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│  OUTCOMES — What happened to waitlist entries?                               │
│  Assigned (auto)  ████████████████  29  (52%)                               │
│  Assigned (manual)████████          12  (21%)                               │
│  Cancelled        ████               8  (14%)                               │
│  Expired          ███                7  (13%)                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Period Selector

Quick presets: Today / This Week / This Month / Last Month / Custom Range.

Changing the period re-fetches analytics data.

### 6.2 Metric Definitions

| Metric | Calculation |
|---|---|
| Total Added | `COUNT(*) WHERE created_at BETWEEN period_start AND period_end` |
| Assigned | `COUNT(*) WHERE status = 'assigned' AND updated_at BETWEEN period` |
| Conversion Rate | `(assigned / total_added) * 100` |
| Avg Wait Time | Average of `(updated_at - created_at)` for assigned entries in the period, in minutes |
| Auto vs. Manual Assignment | Requires an `assignment_method` field — see §17.2 |

### 6.3 Charts

All charts use a lightweight library (Recharts preferred — already in scope per previous specs). No heavy charting libraries.

- **By Service:** Horizontal bar chart, sorted by volume descending
- **Wait Time Trend:** Line chart, one point per day (or hour for Today view), showing average wait time
- **By Priority:** Horizontal bar chart
- **Outcomes:** Horizontal bar chart with assignment method breakdown

**API:**
```
GET /api/v1/waitlist/analytics?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
```
> **Backend note:** This endpoint needs to be **created**. See §17.3.

---

## 7. Filter & Search Toolbar

**Component: `<FilterToolbar />`**

Sticky bar below the Command Bar. Applies to both the Service Columns view and the List view. Not shown in Analytics view (analytics has its own period selector).

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  [Status: Waiting ▼]  [Service: All ▼]  [Priority: All ▼]  [Provider: All ▼]      │
│  [Date: All ▼]  [🔍 Search patient name or phone...]   [Clear]  [Columns|List|Stats]│
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1 Status Filter

Dropdown multi-select:
- **Waiting** (default, selected by default)
- **Assigned**
- **Cancelled**
- **Expired**
- **All**

The default shows only `waiting` entries because that is the operational focus. Historical statuses are secondary.

### 7.2 Service Filter

Multi-select dropdown. Options from `GET /api/v1/services/?is_active=true`.

In Service Columns view: checking/unchecking services shows/hides their columns.

### 7.3 Priority Filter

Multi-select chip row (not a dropdown — chips are faster for toggling):

```
[⚡ Emergency]  [🔶 Urgent]  [Standard]
```

All selected by default. Click individual chips to toggle.

### 7.4 Provider Filter

Single-select dropdown. Options: All Providers / Any Available + each active provider. Filters to entries where `provider_id = selected_provider OR provider_id IS NULL` (show "any available" entries regardless).

### 7.5 Date Filter

Options: All Dates / Today / Tomorrow / This Week / Next 7 Days / Custom Range.

Filters on `waitlist.requested_date` — the patient's preferred date. Entries with `requested_date = NULL` (first available) are shown regardless of this filter.

### 7.6 Search

Free-text. Searches patient name and phone number. Debounced 300ms.

### 7.7 Active Filter Chips

When non-default filters are active, show dismissable chips below the toolbar:

```
Filters:  [Urgent ✕]  [ECG Test ✕]  [Dr. Smith ✕]       [Clear All]
```

### 7.8 URL State Sync

All filter state synced to URL:
```
/dashboard/admin/waitlist?view=columns&status=waiting&priority=urgent,emergency&service_id=uuid
```

---

## 8. Waitlist Entry Detail Drawer

**Component: `<WaitlistEntryDrawer />`** — Right slide-in panel, full height, width 520px.

**Trigger:** Clicking a card in Service Columns view, clicking a row in List view, "View Details" from ⋮ menu.

**API:**
```
GET /api/v1/waitlist/{id}
```
> **Backend note:** This single-entry GET endpoint needs to return a fully joined response including patient name, phone, email; service name and duration; preferred provider name. See §17.4.

### 8.1 Drawer Header

```
┌──────────────────────────────────────────────────────────────────┐
│  Waitlist Entry                      [WAITING — URGENT 🔶]  [✕] │
│  Sara Ahmed                                                      │
│  ECG Test · Any Provider                                         │
│  Waiting 14 min  ·  Position #1 in Urgent queue                  │
│                                                                  │
│  [⚡ Assign Now]  [Edit]  [Cancel Entry]                         │
└──────────────────────────────────────────────────────────────────┘
```

- Status badge prominently shown with priority
- Live-updating "Waiting X min" counter
- Queue position text
- Primary action: "Assign Now" (always) for waiting entries
- "Edit" and "Cancel Entry" for waiting entries
- For assigned/cancelled/expired: read-only header, no actions

### 8.2 Section 1 — Entry Details

Two-column grid:

| Label | Value |
|---|---|
| Service | Service name + duration |
| Priority | Priority badge |
| Queue Position | "#1 (Urgent tier)" |
| Preferred Provider | Provider name or "Any Available" |
| Requested Date | "5 April 2026" or "First Available" |
| Added At | "2 Apr 2026 · 09:00 AM" |
| Added By | Staff name + role (who created the entry) |
| Notes | Notes text or "No notes" |
| Est. Wait | "~22 minutes" or "Unknown" |

### 8.3 Section 2 — Patient Info

```
Patient                                              [View Patient →]
──────────────────────────────────────────────────────────────────
Name          Sara Ahmed
Phone         01712-000001
Email         sara@example.com
Notifications ● Receiving reminders
```

"View Patient →" opens patient detail in a new tab.

### 8.4 Section 3 — Assignment Result (if status = assigned)

Shown only if `status = assigned`:

```
Assignment Result
──────────────────────────────────────────────────────────────────
Method        Auto-promoted (slot freed by cancellation)
Assigned At   2 Apr 2026 · 10:34 AM
Appointment   APT-20260402-018  [View Appointment →]
Provider      Dr. Sarah Smith
Time          2 Apr 2026 · 11:00 AM
```

"View Appointment →" opens the appointment detail drawer at `/dashboard/admin/appointments`.

### 8.5 Section 4 — History Timeline

Chronological events for this waitlist entry:

```
▼ Entry History (3 events)
  09:00 AM  Added to waitlist by Jane Smith (Receptionist)
  09:05 AM  Priority escalated from Standard to Urgent by Admin User (Admin)
  10:34 AM  Auto-promoted — appointment APT-20260402-018 created
```

**API:**
```
GET /api/v1/activity-logs/?entity_type=waitlist&entity_id={id}
```

---

## 9. Add to Waitlist Modal

**Component: `<AddToWaitlistModal />`** — Modal, width 600px.

**Trigger:** "＋ Add to Waitlist" (page header button), "Add Patient" shortcut in empty column footer, keyboard shortcut.

This is a stepped flow with clear progression. Not a single long form.

### Step 1 — Patient

```
┌──────────────────────────────────────────────────────────────────┐
│  Add to Waitlist — Step 1 of 3                                   │
│  ─────────────────────────────────────────────────────────────── │
│  Search patient:  [🔍 Name, phone, or email...                ] │
│                                                                  │
│  Results:                                                        │
│  ○  Sara Ahmed    01712-000001   sara@example.com               │
│  ○  Samuel Adams  01712-000002   s.adams@example.com            │
│                                                                  │
│  [+ Create New Patient] ← inline mini-form if clicked           │
│  ─────────────────────────────────────────────────────────────── │
│  [Cancel]                                         [Next →]       │
└──────────────────────────────────────────────────────────────────┘
```

**Duplicate waitlist check:** After a patient is selected, immediately check if they're already `waiting` for the same service (shown in Step 2). If a duplicate is detected at Step 2 when service is selected, show a warning:

```
⚠ Sara Ahmed is already on the waitlist for ECG Test (Position #1, Urgent).
  Adding another entry is allowed but may create confusion.
  [View existing entry]  [Proceed anyway]
```

**API — patient search:**
```
GET /api/v1/patients/?search={query}&is_active=true&page_size=5
```

### Step 2 — Service & Priority

```
┌──────────────────────────────────────────────────────────────────┐
│  Add to Waitlist — Step 2 of 3                                   │
│  Sara Ahmed                                                      │
│  ─────────────────────────────────────────────────────────────── │
│  Service*                                                        │
│  ┌────────────────────┐  ┌────────────────────┐                 │
│  │ ● ECG Test         │  │ ○ Blood Test        │                 │
│  │   45 min           │  │   15 min            │                 │
│  │   Currently: 3 wt  │  │   Currently: 1 wt   │                 │
│  └────────────────────┘  └────────────────────┘                 │
│  [more services...]                                              │
│                                                                  │
│  Priority*                                                       │
│  ○ Standard          ○ Urgent             ○ Emergency ⚡        │
│    Next available      Needs today          Immediate care       │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│  [← Back]                                         [Next →]       │
└──────────────────────────────────────────────────────────────────┘
```

**Service cards** show current waitlist depth: "Currently: 3 waiting" — so the admin knows how busy each queue is before adding. This uses data already loaded in state (no extra API call).

**Emergency selection:** Shows amber info box:
> "Emergency entries will be placed at the very front of the queue above all Urgent and Standard patients."

**API — services:**
```
GET /api/v1/services/?is_active=true
```

### Step 3 — Details & Confirm

```
┌──────────────────────────────────────────────────────────────────┐
│  Add to Waitlist — Step 3 of 3                                   │
│  Sara Ahmed · ECG Test · Urgent                                  │
│  ─────────────────────────────────────────────────────────────── │
│  Preferred Provider    [Any Available ▼]                         │
│  (optional — leave blank to accept any eligible provider)        │
│                                                                  │
│  Preferred Date        [○ First Available  ○ Specific Date]      │
│  If "Specific Date" selected → date picker appears               │
│                                                                  │
│  Notes (optional)      [                                     ]   │
│                        Reason for visit, special instructions    │
│                        Max 500 characters                        │
│  ─────────────────────────────────────────────────────────────── │
│  Summary:                                                        │
│  Patient: Sara Ahmed · Service: ECG Test · Priority: Urgent      │
│  Position: #2 in Urgent queue (behind 1 other urgent entry)      │
│  Est. wait: ~28 min                                              │
│  ─────────────────────────────────────────────────────────────── │
│  [← Back]                                  [Add to Waitlist]     │
└──────────────────────────────────────────────────────────────────┘
```

**Predicted queue position preview:** Calculated client-side from the current queue state. Shows: "Position: #2 in Urgent queue (behind 1 other urgent entry)." This is informational — the actual position is assigned server-side.

**Preferred Provider dropdown:** Options: "Any Available" (default) + each eligible provider for the selected service. Filtered by `provider_services` join. Pre-filters providers who are not on leave.

**API — submit:**
```
POST /api/v1/waitlist/
Body: {
  patient_id,
  service_id,
  priority,
  provider_id,       ← null if "Any Available"
  requested_date,    ← null if "First Available"
  notes
}
```

**On success:** Modal closes. New card appears in the correct service column at the correct position (Emergency→top, Urgent→after emergency, Standard→after urgent). Card animates in with a slide-down from above. Toast: "Sara Ahmed added to waitlist — ECG Test · Urgent · Position #2."

**On conflict (409 — duplicate detection):** Modal stays open. Show error above the Step 3 summary: "This patient is already waiting for ECG Test." Admin can dismiss and go back.

---

## 10. Manual Assign Modal

**Component: `<ManualAssignModal />`** — Modal, width 640px.

**Trigger:** "Assign Now" button on a card (Service Columns view), "Assign Now" in list view actions, or "Assign Now" in the Entry Detail Drawer header.

Manual assignment creates an appointment from the waitlist entry. This is the admin acting on behalf of the auto-promotion engine when it hasn't fired yet (no eligible slot available) or when the admin wants to manually control the assignment.

### 10.1 Modal Header

```
┌──────────────────────────────────────────────────────────────────┐
│  Assign from Waitlist                                            │
│  Sara Ahmed · ECG Test · Urgent · Waiting 14 min                │
└──────────────────────────────────────────────────────────────────┘
```

### 10.2 Provider Selection

```
┌──────────────────────────────────────────────────────────────────┐
│  Select Provider                                                 │
│  ─────────────────────────────────────────────────────────────── │
│  ○  Dr. Sarah Smith   Cardiology   ████░░ 6/8   Available        │
│  ○  Dr. Alan Jones    Cardiology   ██░░░░ 3/8   Available        │
│  ○  Dr. Kim Park      Cardiology   ████████ 8/8  FULL            │
│                                                                  │
│  ℹ Patient preferred: Any Provider                               │
└──────────────────────────────────────────────────────────────────┘
```

Provider cards show:
- Name + specialization
- Capacity bar (booked/max) — color coded
- Status badge (Available / On Leave / Full)
- "FULL" providers: shown but greyed out — selectable with a confirmation: "Dr. Park is at full capacity (8/8). Assigning will exceed the daily limit. Proceed?" (Admin can override capacity unlike receptionists.)
- If entry has a preferred provider: that provider is highlighted with a "Preferred" badge

**Preference matching:** If the waitlist entry has `provider_id` set and that provider is available, pre-select them and show: "Matching patient's provider preference ✓"

**API — eligible providers:**
```
GET /api/v1/providers/?service_id={id}&date={date}&priority={priority}
```

### 10.3 Date & Slot Selection

Appears after provider selection:

```
┌──────────────────────────────────────────────────────────────────┐
│  Select Date & Time                          [< Apr] [May >]    │
│  ─────────────────────────────────────────────────────────────── │
│  Date:  [○ Today  ○ Tomorrow  ○ Pick date...]                    │
│                                                                  │
│  Available slots — Thursday, 2 April:                            │
│  [08:00]  [08:30]  [09:00]  [─ taken ─]  [10:00]  [10:30]      │
│  [11:00]  [─ taken ─]  [14:00]  [14:30]  [15:00]               │
└──────────────────────────────────────────────────────────────────┘
```

- Defaults to `waitlist.requested_date` if set, otherwise today
- Slot grid loads available slots for the selected provider + date + service
- Taken slots: greyed, not selectable
- Outside working hours: dark background, not selectable

**API — available slots:**
```
GET /api/v1/providers/{id}/available-slots?date=YYYY-MM-DD&service_id={id}
```

### 10.4 Notes & Confirm

```
┌──────────────────────────────────────────────────────────────────┐
│  Appointment Summary                                             │
│  ─────────────────────────────────────────────────────────────── │
│  Patient     Sara Ahmed (01712-000001)                           │
│  Service     ECG Test (45 min)                                   │
│  Provider    Dr. Sarah Smith                                     │
│  Date/Time   2 Apr 2026 · 10:00 AM – 10:45 AM                   │
│  Priority    Urgent                                              │
│  Waitlist    Entry #WL-001234 — assigned from queue              │
│                                                                  │
│  [Cancel]                          [Confirm Assignment]          │
└──────────────────────────────────────────────────────────────────┘
```

**"Confirm Assignment" button:**

```
POST /api/v1/waitlist/{id}/assign
Body: {
  provider_id,
  appointment_start,   ← ISO timestamp
  override_capacity    ← boolean, true only if admin selected a full provider
}
```
> **Backend note:** `POST /api/v1/waitlist/{id}/assign` needs to be **created or verified**. It should: create the appointment record, update the waitlist entry `status = 'assigned'` + `assigned_appointment_id`, recalculate queue positions for remaining entries, send `waitlist_assigned` notification to the patient, and broadcast WebSocket events. See §17.5.

**On success:** Modal closes. Card animates out of the service column. Toast: "Sara Ahmed assigned — APT-20260402-019 · Dr. Smith · 10:00 AM." The appointment now appears in the Appointments page.

---

## 11. Edit Waitlist Entry Drawer

**Component: `<EditEntryDrawer />`** — Right slide-in panel, 440px wide.

**Trigger:** "Edit Entry" from card ⋮ menu or from Entry Detail Drawer header.

**Only available for:** `waiting` status entries. Assigned/cancelled/expired entries are read-only.

### 11.1 Editable Fields

| Field | Editable? | Notes |
|---|---|---|
| Priority | Yes | Admin can escalate or de-escalate. Changing priority recalculates queue position. |
| Preferred Provider | Yes | Change or clear the provider preference. |
| Requested Date | Yes | Update or remove the date preference. |
| Notes | Yes | Update the notes field. |
| Patient | No | Cannot change which patient this entry is for. |
| Service | No | Cannot change the service after creation. |

### 11.2 Priority Change Warning

If priority is changed to a higher level (e.g., Standard → Urgent), show:

```
⚠ Changing priority to Urgent will move Sara Ahmed ahead of
  5 Standard-priority patients already waiting for ECG Test.
  Their queue positions will be recalculated.
```

If changed to lower (Urgent → Standard):

```
⚠ Lowering priority to Standard will move Sara Ahmed behind
  5 Urgent-priority patients waiting for ECG Test.
```

**API — update:**
```
PUT /api/v1/waitlist/{id}
Body: {
  priority,
  provider_id,       ← null to clear preference
  requested_date,    ← null to set to "first available"
  notes
}
```
> **Backend note:** `PUT /api/v1/waitlist/{id}` must trigger queue position recalculation if priority changes. See §17.6.

**On success:** Drawer closes. Card updates in place in the service column (may move to a different priority section if priority changed). Toast: "Waitlist entry updated — Sara Ahmed."

---

## 12. Cancel / Remove Entry Dialog

**Component: `<CancelEntryDialog />`** — Modal, 460px wide.

**Trigger:** "Cancel Entry" from card ⋮ menu, List view actions, or Entry Detail Drawer.

**Only available for:** `waiting` status entries.

```
┌──────────────────────────────────────────────────────────────────┐
│  Remove from Waitlist                                            │
│  ─────────────────────────────────────────────────────────────── │
│  Sara Ahmed · ECG Test · Urgent · Position #2                   │
│                                                                  │
│  Reason for removal (optional):                                  │
│  [                                                          ]    │
│  e.g. Patient decided to leave, booked elsewhere, wrong entry    │
│                                                                  │
│  ℹ Removing this entry will:                                     │
│    · Free the queue position for the next patient               │
│    · Recalculate positions for all entries below                 │
│    · Not cancel any existing appointments                        │
│                                                                  │
│  [Keep in Queue]                        [Remove from Waitlist]   │
└──────────────────────────────────────────────────────────────────┘
```

**API:**
```
DELETE /api/v1/waitlist/{id}
Body: { "reason": "..." }    ← reason stored in activity log
```
> **Backend note:** The DELETE endpoint should accept an optional reason body and store it in `activity_logs.description`. Verify this is supported.

**On success:** Dialog closes. Card fades out from the column. Remaining cards renumber their positions. Toast: "Sara Ahmed removed from waitlist."

---

## 13. Priority Override Dialog

**Component: `<PriorityOverrideDialog />`** — Modal, 460px wide.

**Trigger:** "Escalate Priority" from card ⋮ menu (available for Standard and Urgent entries).

```
┌──────────────────────────────────────────────────────────────────┐
│  Change Priority                                                 │
│  ─────────────────────────────────────────────────────────────── │
│  Sara Ahmed · ECG Test · Currently: Standard                    │
│                                                                  │
│  New Priority:                                                   │
│  ○ Standard    ● Urgent    ○ Emergency ⚡                        │
│                                                                  │
│  ⚠ Changing to Urgent will move Sara ahead of 4 Standard        │
│    patients currently waiting for ECG Test.                     │
│                                                                  │
│  Reason for change (required):                                   │
│  [                                                          ]    │
│  e.g. Condition worsened, doctor's instruction                   │
│                                                                  │
│  [Cancel]                               [Change Priority]        │
└──────────────────────────────────────────────────────────────────┘
```

**Reason field:** Required for all priority changes. Min 10 characters. Stored in activity log.

**Queue impact preview:** Shows how many patients will be displaced by the change. Calculated client-side from loaded queue state.

**Emergency escalation extra step:** If escalating to Emergency, show an additional acknowledgment checkbox:
```
[☐] I confirm this patient requires immediate emergency care
    This action is logged and cannot be undone.
```

**API:**
```
PUT /api/v1/waitlist/{id}
Body: { "priority": "urgent", "notes": "existing notes" }
```
Plus an activity log entry — the backend must log this priority change with the reason. The reason should be sent as part of the request:
```
PUT /api/v1/waitlist/{id}
Body: { "priority": "urgent", "priority_change_reason": "Condition worsened" }
```
> **Backend note:** `priority_change_reason` should be extracted server-side and written to `activity_logs.description`. See §17.6.

**On success:** Dialog closes. Card moves to the correct priority section in its column (animated). Position numbers update for displaced entries. Toast: "Priority changed to Urgent — Sara Ahmed."

---

## 14. Real-Time WebSocket Integration

### 14.1 Connections

On page mount:

```
WS /ws/dashboard:global
WS /ws/waitlist:{service_id}   ← one per service currently in the waitlist
```

The `waitlist:{service_id}` channels are subscribed dynamically based on which services have active waitlist entries. When a new entry is added for a new service, subscribe to that channel. When a service queue empties, unsubscribe.

### 14.2 Event Handlers

| WS Event | Channel | Service Column Action | List View Action | KPI Bar Action |
|---|---|---|---|---|
| `waitlist_entry_added` | `waitlist:{service_id}`, `dashboard:global` | Add card to correct position, animate slide-in. Show service column if new. | Prepend row to list. | Increment Waiting count. |
| `waitlist_assigned` | `waitlist:{service_id}`, `dashboard:global` | Animate card out (slide up + fade). Renumber remaining cards. Show brief "✓ assigned" overlay. | Update row status to Assigned. | Decrement Waiting. Increment Assigned Today. Update Avg Wait. |
| `queue_positions_updated` | `waitlist:{service_id}` | Animate position number changes on all cards in column. | Update `#` column values. | No change. |
| `waitlist_entry_cancelled` | `waitlist:{service_id}`, `dashboard:global` | Animate card fade-out. Renumber remaining. | Update row status. | Decrement Waiting. Increment Cancelled Today. |
| `waitlist_entry_updated` | `waitlist:{service_id}` | Refresh card content (priority badge, notes, etc.). Move card to correct priority section if priority changed. | Refresh row. | No change. |
| `waitlist_entry_expired` | `waitlist:{service_id}`, `dashboard:global` | Animate card fade-out. | Update row status to Expired. | Decrement Waiting. Increment Expired Today. |

### 14.3 Animation Specs for Card Changes

**Card enters (new entry):** Slide in from above within the correct priority section. Duration 250ms ease-out. Brief green flash border for 1 second after appearing.

**Card leaves (assigned/cancelled):** Fade out over 300ms. Remaining cards animate upward to fill the gap (CSS transition on `transform: translateY`). Position number updates animate with a brief number-change highlight.

**Position number changes:** When `queue_positions_updated` fires, all affected cards get a brief number highlight (amber background on the `#N` chip for 500ms) before settling on the new number.

**Priority section movement:** When a card changes priority tier (from Standard to Urgent), it fades out from its current section and fades in at the bottom of the new section. If the move bumps cards in the destination section, those cards animate down.

### 14.4 Emergency Alert Banner

The emergency alert banner in the Command Bar (§3) subscribes to `dashboard:global`. On `waitlist_entry_added` with `priority = emergency`, show the banner immediately. On `waitlist_assigned` or `waitlist_entry_cancelled` for that entry, hide the banner (or update to the next emergency entry if multiple exist).

### 14.5 Reconnection Strategy

1. Reconnect every 3 seconds (first 30 seconds)
2. Then every 15 seconds
3. After 2 minutes of failure: switch to 30-second polling on the waitlist data
4. Show "Live updates paused — reconnecting..." banner
5. On reconnect: re-fetch all waitlist data, re-subscribe to all service channels, dismiss banner

---

## 15. Data Fetching & State Management

### 15.1 On Page Mount (Parallel)

```typescript
await Promise.all([
  GET /api/v1/waitlist/?status=waiting&sort=priority_desc,queue_position_asc,  // active queue
  GET /api/v1/services/?is_active=true,        // for filter dropdown + column headers
  GET /api/v1/providers/,                       // for filter dropdown + assign modal
  GET /api/v1/waitlist/stats/today,             // for KPI command bar
]);
```

### 15.2 State Structure

```typescript
interface WaitlistPageState {
  // Waitlist data
  waitingEntries: WaitlistEntry[];       // status = waiting, sorted by composite key
  historicalEntries: WaitlistEntry[];    // assigned/cancelled/expired — loaded on demand

  // Reference data
  services: Service[];
  providers: Provider[];

  // KPI data
  stats: WaitlistDailyStats;

  // View state
  activeView: 'columns' | 'list' | 'analytics';
  expandedColumns: Set<string>;          // service_ids that are collapsed
  expandedPrioritySections: Record<string, Set<string>>; // service_id → priority levels expanded

  // Filter state
  filters: {
    statuses: WaitlistStatus[];          // default: ['waiting']
    serviceIds: string[];
    priorities: Priority[];
    providerId: string | null;
    datePreference: string | null;       // null = all dates
    search: string;
  };

  // UI state
  selectedEntryId: string | null;       // for detail drawer
  analyticsDateRange: { from: string; to: string };
}
```

### 15.3 Optimistic Updates

| Operation | Optimistic Behaviour |
|---|---|
| Cancel entry | Remove card from column immediately. Add to analytics cancelled count. Revert if API fails. |
| Priority change | Move card to new priority section immediately. Renumber positions. Revert if API fails. |
| Manual assign (confirm modal) | Show loading overlay on card. Remove after success. Do NOT optimistically remove before API confirms. |

Do NOT optimistically update manual assignment — the slot booking involves conflict detection and the card should only disappear when confirmed. Show a loading overlay on the card while the API call is in-flight.

### 15.4 Historical Data Loading

Assigned, cancelled, and expired entries are loaded only when the user switches the Status filter to include those states (or switches to List view with all statuses). They are NOT loaded on page mount.

```typescript
// Triggered when user adds 'assigned' to status filter
GET /api/v1/waitlist/?status=assigned&date_from=today&sort=updated_at_desc&page_size=50
```

---

## 16. UI State Standards

### 16.1 Loading States

| Component | Skeleton |
|---|---|
| KPI Command Bar | 5 rectangular chip skeletons + alert banner area |
| Service Column View | 3 column skeletons, each with 2 card skeletons |
| Service Column Card | Card-shaped skeleton with 3 text lines + 2 button skeletons |
| List View | 8 skeleton rows |
| Analytics View | 4 KPI chip skeletons + 2 bar chart skeletons + 1 line chart skeleton |
| Entry Detail Drawer | Header skeleton + 2 section skeletons |

### 16.2 Empty States

| Scenario | Message | CTA |
|---|---|---|
| All queues empty (Service Columns) | "All clear — no patients currently waiting." | "+ Add to Waitlist" |
| Single service column empty | "Queue is clear" | "+ Add Patient" shortcut |
| List view — no results | "No waitlist entries match your filters." | "Clear Filters" |
| List view — no historical | "No assigned/cancelled entries for this period." | Change date filter |
| Analytics — no data | "No waitlist activity for the selected period." | Change period |

### 16.3 Error States

| Scenario | Response |
|---|---|
| Page data load fails | Full-page error with Retry button |
| Analytics load fails | Error banner within the analytics panel. Other views unaffected. |
| Manual assign fails (conflict) | Modal stays open. Error banner inside modal: "This slot is no longer available. Please select a different time." Slot picker refreshes. |
| Manual assign fails (capacity) | Modal stays open. Warning: "Dr. Smith is at full capacity. Confirm override?" |
| Cancel fails | Dialog stays open. Error: "Failed to remove entry — try again." |
| Priority change fails | Dialog stays open. Error message. Card reverts to original priority. |
| WS disconnect | Grey dot in nav bar. "Live updates paused" banner. |

### 16.4 Toast Notifications

| Action | Toast |
|---|---|
| Entry added | "[Name] added to waitlist — [Service] · [Priority] · Position #[N]" |
| Entry cancelled | "[Name] removed from waitlist" |
| Entry assigned (manual) | "[Name] assigned — [APT#] · [Provider] · [Time]" |
| Entry auto-assigned (WS) | "✓ [Name] auto-assigned — [Service] · [Provider]" |
| Priority changed | "Priority changed to [Priority] — [Name]" |
| Entry updated | "Waitlist entry updated — [Name]" |
| Bulk cancel complete | "Removed [N] entries from waitlist" |
| Entry expired | "[Name]'s waitlist entry expired" |
| Any failure | "Action failed — [reason]. Try again." |

---

## 17. Required Backend Endpoints

---

### 17.1 GET waitlist daily stats

**Endpoint to create:**
```
GET /api/v1/waitlist/stats/today
```

**Response:**
```json
{
  "date": "2026-04-02",
  "waiting_now": 12,
  "assigned_today": 34,
  "cancelled_today": 5,
  "expired_today": 2,
  "avg_wait_minutes_today": 23,
  "emergency_waiting": 1,
  "urgent_waiting": 4,
  "standard_waiting": 7
}
```

Server-side: aggregate on `waitlist` table filtered to today.

---

### 17.2 GET waitlist analytics

**Endpoint to create:**
```
GET /api/v1/waitlist/analytics?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
```

**Response:**
```json
{
  "period": { "date_from": "...", "date_to": "..." },
  "summary": {
    "total_added": 56,
    "assigned": 34,
    "cancelled": 8,
    "expired": 7,
    "conversion_rate_percent": 60.7,
    "avg_wait_minutes": 28,
    "auto_assigned": 24,
    "manually_assigned": 10
  },
  "by_service": [
    { "service_id": "uuid", "service_name": "General Consultation", "count": 22, "percent": 39 }
  ],
  "by_priority": [
    { "priority": "emergency", "count": 4, "percent": 7 },
    { "priority": "urgent", "count": 16, "percent": 29 },
    { "priority": "standard", "count": 36, "percent": 64 }
  ],
  "wait_time_trend": [
    { "date": "2026-04-01", "avg_minutes": 25 },
    { "date": "2026-04-02", "avg_minutes": 31 }
  ],
  "outcomes": [
    { "type": "auto_assigned", "count": 24, "percent": 52 },
    { "type": "manually_assigned", "count": 10, "percent": 21 },
    { "type": "cancelled", "count": 8, "percent": 14 },
    { "type": "expired", "count": 7, "percent": 13 }
  ]
}
```

**Backend note on `auto_assigned` vs `manually_assigned`:** The current `waitlist` table does not distinguish between auto-promotion and manual assignment. Add an `assignment_method` column (`auto` | `manual`) to the `waitlist` table. Set it to `auto` during auto-promotion, `manual` during `POST /waitlist/{id}/assign`.

---

### 17.3 GET waitlist/{id} — full joined response

**Extend existing endpoint:**
```
GET /api/v1/waitlist/{id}
```

Must return a fully joined object including:
```json
{
  "id": "uuid",
  "patient_id": "uuid",
  "patient_name": "Sara Ahmed",
  "patient_phone": "01712-000001",
  "patient_email": "sara@example.com",
  "patient_notification_opt_out": false,
  "service_id": "uuid",
  "service_name": "ECG Test",
  "service_duration_minutes": 45,
  "provider_id": null,
  "provider_name": null,
  "priority": "urgent",
  "queue_position": 1,
  "status": "waiting",
  "requested_date": null,
  "notes": "Chest pain, urgent review",
  "assigned_appointment_id": null,
  "created_at": "...",
  "updated_at": "...",
  "created_by_name": "Jane Smith",
  "created_by_role": "receptionist"
}
```

---

### 17.4 GET waitlist — full filter support

**Extend existing endpoint:**
```
GET /api/v1/waitlist/
```

Ensure these query params are fully supported:
- `status` — comma-separated: `?status=waiting,assigned`
- `service_id` — UUID filter
- `priority` — comma-separated: `?priority=emergency,urgent`
- `provider_id` — filter entries where `provider_id = X OR provider_id IS NULL`
- `patient_id` — UUID filter (used by Patients page)
- `requested_date` — date filter
- `sort` — `priority_desc,queue_position_asc,created_at_asc` (default), `created_at_desc`, `updated_at_desc`
- `page` · `page_size`
- `search` — partial match on joined `patients.name`, `patients.phone`
- `date_from` / `date_to` — filter on `created_at` or `updated_at` for historical views

---

### 17.5 POST waitlist/{id}/assign — manual assignment

**Endpoint to create or verify:**
```
POST /api/v1/waitlist/{id}/assign
Body: {
  "provider_id": "uuid",
  "appointment_start": "ISO 8601 timestamp",
  "override_capacity": false
}
```

**Server-side must:**
1. Validate the waitlist entry is `status = waiting`
2. Check provider availability and conflict (unless `override_capacity = true` and caller is admin)
3. Create an appointment record with `assigned_from_waitlist = true`, `priority` from waitlist entry
4. Update waitlist entry: `status = 'assigned'`, `assigned_appointment_id = new_appointment.id`, `assignment_method = 'manual'`
5. Recalculate queue positions for remaining entries with same `service_id`
6. Send `waitlist_assigned` notification to patient (check `notification_opt_out` first)
7. Log to `activity_logs`
8. Broadcast WebSocket events: `waitlist_assigned`, `queue_positions_updated`, `appointment_created`

Return `409` if conflict detected and `override_capacity = false`.

---

### 17.6 PUT waitlist/{id} — update with position recalculation

**Extend existing endpoint:**
```
PUT /api/v1/waitlist/{id}
Body: {
  "priority": "urgent",
  "provider_id": null,
  "requested_date": null,
  "notes": "...",
  "priority_change_reason": "Condition worsened — doctor's instruction"
}
```

**Server-side must:**
- If `priority` changed: recalculate queue positions for all `waiting` entries with same `service_id`
- Write `priority_change_reason` to `activity_logs.description` as a separate log entry
- Broadcast `waitlist_entry_updated` and `queue_positions_updated` WebSocket events

---

### 17.7 GET waitlist/stats — duplicate entry check

**Endpoint to create (or add param to existing):**
```
GET /api/v1/waitlist/?patient_id={id}&service_id={id}&status=waiting
```

Used during the Add to Waitlist modal Step 2 to detect if a patient is already waiting for the same service. Returns the existing entry if found. Uses already-extended filter params from §17.4.

---

### 17.8 POST waitlist/expire — batch expiry

**Endpoint to create:**
```
POST /api/v1/waitlist/expire
Body: { "before_date": "YYYY-MM-DD" }
```

Marks all `waiting` entries where `requested_date < before_date` as `expired`. Intended to be called by a nightly job, but also triggerable manually by the admin from the Analytics view:

```
[Run Expiry Now]  ← admin button in Analytics view
```

Expiry frees queue positions and recalculates positions for remaining entries.

---

## 18. API Quick Reference

| # | Method | Endpoint | Status | Used In |
|---|---|---|---|---|
| 1 | GET | `/api/v1/waitlist/` | ✅ Extend (add all filter params per §17.4) | Service Columns, List View, filter toolbar |
| 2 | POST | `/api/v1/waitlist/` | ✅ Yes | Add to Waitlist modal |
| 3 | GET | `/api/v1/waitlist/{id}` | ✅ Extend (joined response per §17.3) | Entry Detail Drawer |
| 4 | PUT | `/api/v1/waitlist/{id}` | ✅ Extend (position recalculation, priority_change_reason per §17.6) | Edit Entry Drawer, Priority Override Dialog |
| 5 | DELETE | `/api/v1/waitlist/{id}` | ✅ Yes (verify reason body accepted) | Cancel Entry Dialog |
| 6 | POST | `/api/v1/waitlist/{id}/assign` | ⚠️ **Create / Verify** (full assignment flow per §17.5) | Manual Assign Modal |
| 7 | GET | `/api/v1/waitlist/estimated-wait/{service_id}` | ✅ Yes | Column headers, Entry Detail Drawer |
| 8 | GET | `/api/v1/waitlist/stats/today` | ⚠️ **Create** (per §17.1) | Command Bar KPIs |
| 9 | GET | `/api/v1/waitlist/analytics` | ⚠️ **Create** (per §17.2) | Analytics View |
| 10 | POST | `/api/v1/waitlist/expire` | ⚠️ **Create** (per §17.8) | Admin expiry trigger in Analytics |
| 11 | GET | `/api/v1/services/?is_active=true` | ✅ Yes | Filter toolbar, Add modal, column headers |
| 12 | GET | `/api/v1/providers/` | ✅ Yes | Filter toolbar, Assign modal provider list |
| 13 | GET | `/api/v1/providers/{id}/available-slots` | ⚠️ Create (already flagged in Appointments spec) | Manual Assign Modal slot picker |
| 14 | GET | `/api/v1/patients/` | ✅ Yes | Add modal patient search |
| 15 | POST | `/api/v1/patients/` | ✅ Yes | Add modal inline patient creation |
| 16 | GET | `/api/v1/activity-logs/` | ✅ Yes (verify entity_type=waitlist filter) | Entry Detail Drawer history |
| 17 | WS | `/ws/dashboard:global` | ✅ Yes | Emergency alert, KPI updates |
| 18 | WS | `/ws/waitlist:{service_id}` | ✅ Yes | Per-service column real-time updates |

**Legend:**
- ✅ Yes = endpoint exists and works as-is
- ✅ Extend = endpoint exists but needs new params or response fields
- ✅ Verify = endpoint may exist but needs field/behaviour confirmation
- ⚠️ Create = must be built before this feature can be integrated

---

*MediSync Admin Waitlist Page Frontend Spec — Version 1.0 — April 2026 — Internal Use Only*