# MediSync — Admin Providers Page Implementation Spec
**Route:** `http://localhost:3000/dashboard/admin/providers`
**Version:** 1.0 | **Prepared for:** Frontend Development Team | **Date:** April 2026
**Scope:** End-to-end implementation of the Providers management page inside the Admin dashboard — covering provider profiles, weekly availability schedules, time-off requests (approve/reject), and assigned services.

---

## Table of Contents

1. [Mental Model & Design Decisions](#1-mental-model--design-decisions)
2. [Page Layout & File Structure](#2-page-layout--file-structure)
3. [Section A — Provider List (Left Panel)](#3-section-a--provider-list-left-panel)
4. [Section B — Provider Detail (Right Panel)](#4-section-b--provider-detail-right-panel)
   - 4A. Profile Tab
   - 4B. Availability Tab
   - 4C. Time Off Tab
   - 4D. Services Tab
   - 4E. Stats Tab
5. [Promote User to Provider Flow](#5-promote-user-to-provider-flow)
6. [Shared Dialogs & Panels](#6-shared-dialogs--panels)
   - 6A. Edit Provider Profile Dialog
   - 6B. Add / Edit Availability Block Panel
   - 6C. Create / Edit Time Off Panel
   - 6D. Approve / Reject Time Off Dialog
   - 6E. Manage Services Panel
   - 6F. Delete / Deactivate Confirmation Dialog
7. [Data Fetching & State Management](#7-data-fetching--state-management)
8. [UI State Standards](#8-ui-state-standards)
9. [Required Backend Endpoints](#9-required-backend-endpoints)
10. [API Quick Reference](#10-api-quick-reference)

---

## 1. Mental Model & Design Decisions

### 1.1 What This Page Does

The Providers page is the admin's control centre for the entire provider workforce. It manages five interconnected concerns for each provider:

1. **Profile** — the provider's clinical identity: name (from `users`), specialization, capacity, consultation fee, emergency flag, and operational status.
2. **Availability** — the recurring weekly schedule (from the `availability` table). Drives which time slots can be booked on any given day.
3. **Time Off** — ad-hoc leave entries (from `provider_time_off`). The admin creates, edits, approves, and rejects these. Approved time off overrides the weekly schedule for those dates.
4. **Services** — which clinical services this provider can deliver (from the `provider_services` join table). Controls which booking flows the provider appears in.
5. **Stats** — a read-only performance snapshot: appointments completed, no-show rate, utilisation percentage. Helps admins make workload decisions.

### 1.2 Layout Strategy: Master–Detail Split Panel

A **master–detail layout** is the right choice here. The provider list on the left acts as a persistent selector; the right panel renders the selected provider's detail view with tabbed sub-sections.

This is better than a separate detail page (navigating away loses context) and better than modals for deep editing (modals are too constrained for multi-tab detail views with forms).

```
┌───────────────────────┬─────────────────────────────────────────────────────┐
│  PROVIDER LIST        │  PROVIDER DETAIL PANEL                              │
│  (left, ~300px fixed) │  (right, fills remainder)                           │
│                       │                                                     │
│  Search + Filters     │  [Profile] [Availability] [Time Off] [Services]     │
│                       │  [Stats]                                            │
│  [Provider Card]      │                                                     │
│  [Provider Card] ←●   │  Tab content for the selected provider              │
│  [Provider Card]      │                                                     │
│  [Provider Card]      │                                                     │
│                       │                                                     │
│  [+ Add Provider]     │                                                     │
└───────────────────────┴─────────────────────────────────────────────────────┘
```

On mobile (< 1024px), the layout collapses to a single column. The list shows first. Selecting a provider slides the detail panel in from the right (full-width). A "← Back" button returns to the list.

### 1.3 The Provider–User Relationship

Providers are not standalone records. A provider is a `users` row with `role = provider` **plus** a linked `providers` row that extends it with clinical attributes. This 1-to-1 extension means:

- Creating a provider = finding an existing `provider` role user, then calling `POST /api/v1/providers/` to promote them
- Deleting/deactivating a provider does NOT delete the user — it deactivates the user account and removes or archives the provider extension
- The provider's name, email, and contact info come from the `users` table; everything else comes from `providers`

The UI must make this transparent. When an admin edits a provider's name, the call goes to `PUT /api/v1/users/{id}`. When they change specialization, it goes to `PUT /api/v1/providers/{id}`.

---

## 2. Page Layout & File Structure

### 2.1 File Structure (Next.js App Router)

```
app/
└── dashboard/
    └── admin/
        └── providers/
            ├── page.tsx                          ← Root page, renders split-panel shell
            ├── components/
            │   ├── ProviderList.tsx              ← Left panel: list + search + filters
            │   ├── ProviderCard.tsx              ← Individual card in the list
            │   ├── ProviderDetailPanel.tsx       ← Right panel: tab shell
            │   ├── tabs/
            │   │   ├── ProfileTab.tsx
            │   │   ├── AvailabilityTab.tsx
            │   │   ├── TimeOffTab.tsx
            │   │   ├── ServicesTab.tsx
            │   │   └── StatsTab.tsx
            │   ├── dialogs/
            │   │   ├── EditProviderDialog.tsx
            │   │   ├── AvailabilityBlockPanel.tsx
            │   │   ├── TimeOffPanel.tsx
            │   │   ├── ApproveRejectDialog.tsx
            │   │   ├── ManageServicesPanel.tsx
            │   │   └── DeactivateConfirmDialog.tsx
            │   └── PromoteUserDialog.tsx         ← "Add Provider" flow
            └── hooks/
                ├── useProviders.ts               ← provider list + CRUD
                ├── useProviderDetail.ts          ← single provider full detail
                ├── useAvailability.ts            ← availability CRUD for a provider
                ├── useTimeOff.ts                 ← time-off CRUD + approve/reject
                └── useProviderServices.ts        ← assign/remove services
```

### 2.2 Page Header

```
┌──────────────────────────────────────────────────────────────────────┐
│  Providers                                          [+ Add Provider] │
│  Manage provider profiles, schedules, and time off.                  │
└──────────────────────────────────────────────────────────────────────┘
```

- Title: "Providers" (H1)
- Subtitle: "Manage provider profiles, schedules, and time off."
- "＋ Add Provider" button — top right — opens the Promote User to Provider flow (§5)

---

## 3. Section A — Provider List (Left Panel)

**Component: `<ProviderList />`** — Fixed-width left column (~300px), full height, independently scrollable.

### 3.1 Search & Filter Controls

Stacked above the list, always visible:

```
┌──────────────────────────────────────┐
│  🔍 Search providers...              │
├──────────────────────────────────────┤
│  Status: [All ▼]  Spec: [All ▼]     │
└──────────────────────────────────────┘
```

**Search input** — debounced 300ms. Searches provider name (from `users.name`) and specialization name. Client-side filter on the already-loaded list (no new API call per keystroke — the list is small enough to load fully on page mount).

**Status filter** — Dropdown: All / Available / On Leave / Busy. Maps to `providers.status` values.

**Specialization filter** — Dropdown populated from `GET /api/v1/specializations/`. Options: All + each specialization name.

**Active/Inactive toggle** — Small switch at the bottom of the filter bar: "Show inactive". Default OFF (show only active providers). When toggled ON, inactive (deactivated) providers appear with a muted style.

---

### 3.2 Provider Card

**Component: `<ProviderCard />`** — Clickable card for each provider in the list.

```
┌──────────────────────────────────────────┐
│  [Avatar]  Dr. Sarah Smith              │
│            Cardiology                   │
│            ● Available    [3 pending]   │
│            ████░░░░ 6/8 today           │
└──────────────────────────────────────────┘
```

**Elements:**

| Element | Content | Source |
|---|---|---|
| Avatar | Initials circle (first + last name initials) | Derived from `users.name` |
| Name | Full name with "Dr." prefix | `users.name` |
| Specialization | Specialization name | `specializations.name` via `providers.specialization_id` |
| Status badge | "Available" / "On Leave" / "Busy" — color coded | `providers.status` |
| Pending time-off badge | "3 pending" — amber badge, only shown if pending time-off requests exist | Count from `provider_time_off WHERE is_approved = FALSE` |
| Capacity bar | Mini progress bar "6/8 today" — hidden if 0 appointments | From `GET /api/v1/appointments/providers/{id}/capacity` |
| Emergency badge | Small "⚡ Emergency" chip — shown if `emergency_enabled = TRUE` | `providers.emergency_enabled` |

**Selected state:** The active card has a distinct left border and slightly elevated background to show it is selected in the master-detail.

**API — load provider list:**
```
GET /api/v1/providers/
```

> **Backend note:** The response must include joined `users.name`, `users.email`, `users.is_active`, and `specializations.name` so the card can render without N+1 calls per card. Confirm the endpoint returns these joined fields. If it only returns provider-table columns, extend it.

The capacity bar data (today's booked/max) is fetched **lazily** — only for the selected provider, not for every card in the list. Loading capacity for all providers at once would be expensive.

---

### 3.3 List Footer

Below the last card:

```
[+ Add Provider]
```

Secondary "Add Provider" CTA in the list footer — same action as the page header button. Convenient when the user is already browsing the list.

**API — initial list load:**
```
GET /api/v1/providers/
```

**Empty state (no providers):**
```
No providers yet.
Add your first provider to get started.
[+ Add Provider]
```

**Empty state (filtered, no results):**
```
No providers match your filters.
[Clear Filters]
```

---

## 4. Section B — Provider Detail (Right Panel)

**Component: `<ProviderDetailPanel />`** — Right column, fills remaining width.

**Default state (no provider selected):**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│   Select a provider from the list               │
│   to view and manage their details.             │
│                                                 │
└─────────────────────────────────────────────────┘
```

**When a provider is selected**, the panel renders a consistent header followed by tabbed content.

### 4.1 Detail Panel Header

Persistent across all tabs — always visible at the top of the right panel:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Avatar]  Dr. Sarah Smith                                [Edit]  [⋮ More] │
│            Cardiology  ·  ⚡ Emergency                                      │
│            ● Available  ·  Max 8/day  ·  Fee: ৳500                         │
│            sarah.smith@clinic.com                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**"Edit" button** — opens Edit Provider Profile Dialog (§6A)

**"⋮ More" dropdown:**
- "Change Status" — inline status picker (available / on_leave / busy)
- "Deactivate Provider" — opens Deactivate Confirmation Dialog (§6F)
- "View Audit Log" — navigates to `/dashboard/admin/audit?entity_type=provider&entity_id={id}`

**API — load selected provider detail:**
```
GET /api/v1/providers/{id}
```
This should return a merged response: provider fields + linked user fields (name, email, is_active) + specialization name.

> **Backend note:** `GET /api/v1/providers/{id}` must return the full joined object including `users.name`, `users.email`, `users.is_active`, `specializations.name`. If it only returns raw provider columns, extend the response schema.

---

### 4.2 Tab Bar

Five tabs rendered below the detail header, horizontally:

```
[Profile]  [Availability]  [Time Off (3)]  [Services]  [Stats]
```

- **Time Off tab** shows a count badge for pending requests (e.g., "Time Off (3)") — red/amber badge if pending approvals exist. This is the admin's signal that action is needed.
- Default active tab: **Profile** on first selection of a provider.
- Active tab is remembered per provider in local state so switching providers and back doesn't reset the tab.

---

### Tab 4A — Profile

**Component: `<ProfileTab />`**

Displays and allows editing of all provider and user attributes in a clean read-only view with an "Edit" button that opens the dialog (§6A).

```
┌──────────────────────────────────────────────────────────────┐
│  ACCOUNT INFORMATION                                [Edit]    │
│  ─────────────────────────────────────────────────────────── │
│  Full Name           Dr. Sarah Smith                         │
│  Email               sarah.smith@clinic.com                  │
│  Account Status      ● Active                                │
│  Role                Provider                                │
│  Member Since        12 January 2025                         │
├──────────────────────────────────────────────────────────────┤
│  CLINICAL PROFILE                                            │
│  ─────────────────────────────────────────────────────────── │
│  Specialization      Cardiology                              │
│  Consultation Fee    ৳500.00                                 │
│  Daily Capacity      8 appointments / day                    │
│  Emergency Enabled   ⚡ Yes                                  │
│  Current Status      ● Available                             │
├──────────────────────────────────────────────────────────────┤
│  TODAY'S SNAPSHOT                                            │
│  ─────────────────────────────────────────────────────────── │
│  Booked Today        6 of 8  ████████░░ 75%                 │
│  Completed           3                                       │
│  Remaining           3                                       │
└──────────────────────────────────────────────────────────────┘
```

**Today's Snapshot** section uses:
```
GET /api/v1/appointments/providers/{id}/capacity
```

All other fields come from the already-loaded `GET /api/v1/providers/{id}` response. No extra API calls needed for the Profile tab itself.

---

### Tab 4B — Availability

**Component: `<AvailabilityTab />`**

Displays and manages the provider's recurring weekly schedule. This maps directly to the `availability` table — one or more records per provider, one per working day.

#### Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Weekly Availability Schedule              [+ Add Block]     │
│  Defines which days and hours this provider is available     │
│  for appointments.                                           │
├──────────────────────────────────────────────────────────────┤
│  WEEKLY GRID (visual + editable)                             │
│                                                              │
│  Mon   09:00 ────────────── 17:00  Break: 12:00-13:00  [✏] [🗑]│
│  Tue   09:00 ────────────── 17:00  Break: 12:00-13:00  [✏] [🗑]│
│  Wed   09:00 ──── 13:00   (half day)                   [✏] [🗑]│
│  Thu   09:00 ────────────── 17:00  Break: 12:00-13:00  [✏] [🗑]│
│  Fri   09:00 ────────────── 17:00  Break: 12:00-13:00  [✏] [🗑]│
│  Sat   ─── Not Working ───                              [+]      │
│  Sun   ─── Not Working ───                              [+]      │
│                                                              │
│  Notes displayed below each row if `availability.notes` set │
└──────────────────────────────────────────────────────────────┘
```

**API:**
```
GET /api/v1/availability/{provider_id}
```

#### Weekly Grid Details

- Seven rows, one per day (Mon–Sun). Day names shown as full names on desktop, 3-letter abbreviations on mobile.
- **Working day row:** Shows a visual bar spanning from `start_time` to `end_time`. If `break_start` and `break_end` are set, the bar has a gap or a distinct "break" segment in the middle.
- **Non-working day row:** Shown with a muted strikethrough style and a "Not Working" label. Has a "＋" button to quickly add an availability block for that day.
- **Notes:** If `availability.notes` is not null, rendered as muted italic text below the time bar.
- **Edit (✏) button:** Opens Add/Edit Availability Block Panel (§6B) pre-filled with this block's data.
- **Delete (🗑) button:** Opens inline confirmation popover (not a full dialog — small and fast): "Remove [Day] availability? Existing appointments will not be cancelled." Confirm button fires `DELETE /api/v1/availability/{id}`.

**"＋ Add Block" button** (top right): Opens Add/Edit Availability Block Panel (§6B) in create mode, with the day dropdown defaulting to the first non-working day.

#### Conflict Awareness

When deleting an availability block or when editing to reduce hours, the UI should check for existing appointments in the affected window and warn the admin. This is a client-side check using already-loaded appointment data where possible, or a lightweight backend check.

> **Backend note:** A `GET /api/v1/providers/{id}/appointments/conflicts?date_from=&date_to=&day_of_week=` endpoint would enable precise conflict checking when changing availability. This is a **nice-to-have** for v1 — for now, show a generic warning: "Removing this availability block will not cancel existing appointments. Review the provider's schedule for conflicts."

---

### Tab 4C — Time Off

**Component: `<TimeOffTab />`**

The admin's interface to manage all time-off requests for this provider. This is where requests submitted by the provider are approved or rejected, and where the admin can also create time off on behalf of the provider.

#### Layout

```
┌───────────────────────────────────────────────────────────────────┐
│  Time Off                                 [+ Add Time Off]        │
│  Approved time off overrides the weekly schedule for those dates. │
├───────────────────────────────────────────────────────────────────┤
│  PENDING APPROVAL  (collapsible, expanded by default if N > 0)    │
│  ─────────────────────────────────────────────────────────────── │
│  [row] Patient leaves at 5 Jan–10 Jan  Sick Leave  [Approve][Reject]│
│  [row] ...                                                        │
├───────────────────────────────────────────────────────────────────┤
│  UPCOMING APPROVED                                                │
│  ─────────────────────────────────────────────────────────────── │
│  [row] 15 Apr – 19 Apr  Annual Leave  Approved by Admin  [Edit][Delete]│
├───────────────────────────────────────────────────────────────────┤
│  PAST (collapsed by default)                                      │
│  ─────────────────────────────────────────────────────────────── │
│  [row] 1 Jan – 3 Jan  Personal  Approved                         │
│  [row] ...                                                        │
└───────────────────────────────────────────────────────────────────┘
```

**API:**
```
GET /api/v1/time-off/{provider_id}
```

The response is sorted and grouped client-side into three sections:
- **Pending** — `is_approved = FALSE` and `end_date >= today` — shown first, always expanded, amber header badge with count
- **Upcoming Approved** — `is_approved = TRUE` and `start_date >= today` — shown second
- **Past** — `end_date < today` — collapsed by default, click to expand

#### Time Off Table Row

| Column | Content |
|---|---|
| **Dates** | "5 Jan – 10 Jan 2026" or "2 Apr 2026" (single day) |
| **Duration** | "6 days" or "1 day" — calculated from date range |
| **Type / Reason** | Reason text (e.g., "Sick Leave", "Annual Leave", "Conference") |
| **Coverage** | "Full day" or "09:00 – 13:00" (partial day) |
| **Status** | Pending (amber) / Approved (green, + who approved) / Rejected (red) |
| **Actions** | Contextual — see below |

**Actions by status:**

**Pending rows:**
- **"Approve" button** — primary green button. Opens Approve/Reject Dialog (§6D) to confirm and optionally add an approval note.
- **"Reject" button** — secondary/danger outline button. Opens Approve/Reject Dialog (§6D) in reject mode with a required reason field.
- **"Edit" link** — opens Time Off Panel (§6C) to modify dates/reason before deciding.

**Upcoming Approved rows:**
- **"Edit" link** — opens Time Off Panel (§6C). Editing a previously approved entry resets it to pending status (user must re-approve). Show a note in the panel: "Editing this entry will reset it to Pending status."
- **"Delete" link** — opens Delete Confirmation Dialog. Deletes the time-off entry and restores availability for those dates. Show warning if there are appointments scheduled during this period.

**Past rows:**
- **"View" link** only — opens a read-only Time Off Panel showing the record.

**"＋ Add Time Off" button** — Admin creates time off directly without a provider request. Opens Time Off Panel (§6C) in create mode.

#### Pending Section — Admin Actions

When `is_approved = FALSE` entries exist, the "Pending Approval" section header renders with a count badge and a quick action row above the table:

```
⏳ Pending Approval (2)                     [Approve All]
```

"Approve All" — bulk approves all pending entries for this provider. Shows confirmation: "Approve all 2 pending time-off requests for Dr. Smith?" — fires individual `PATCH` calls in parallel.

> **Backend note:** The existing `PATCH /api/v1/time-off/{id}/approve` endpoint handles approval. However, it currently only marks `is_approved = TRUE`. The approve/reject flow requires:
> - `approved_by` to be set to the current admin's user ID
> - Support for **rejection** (not in current API) — see §9.

---

### Tab 4D — Services

**Component: `<ServicesTab />`**

Shows which services this provider is qualified to deliver and allows the admin to add or remove services.

#### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Assigned Services                      [Manage Services]        │
│  This provider can be booked for the following services.         │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ General Consultation    30 min · ৳300   Diagnostics  [✕] │    │
│  │ ECG Test                45 min · ৳500   Cardiology   [✕] │    │
│  │ Echocardiography        60 min · ৳800   Cardiology   [✕] │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Required Specialization Match:                                  │
│  ⚠ 1 service requires Cardiology — provider matches ✓           │
└──────────────────────────────────────────────────────────────────┘
```

**API:**
```
GET /api/v1/providers/{id}/services
```

#### Service Cards

Each assigned service shown as a horizontal card:
- Service name (bold)
- Duration + fee (muted)
- Category chip
- Required specialization badge — green tick if provider's specialization matches, amber warning if mismatch (this should not normally happen but can occur if a provider's specialization is changed after services were assigned)
- **✕ Remove** button — opens inline confirmation popover: "Remove [Service Name] from Dr. Smith's assigned services? Existing appointments for this service won't be affected." On confirm: `DELETE /api/v1/providers/{provider_id}/services/{service_id}`

**Specialization Mismatch Warning:** If any assigned service has a `required_specialization_id` that does not match the provider's `specialization_id`, show a warning banner:
```
⚠ Mismatch: "Blood Test" requires General Practice but this provider is a Cardiologist.
  Patients can still be booked, but the specialization requirement is not met.
  [Review Services]
```

**"Manage Services" button** — Opens Manage Services Panel (§6E) where admin can add/remove services in a checklist interface.

---

### Tab 4E — Stats

**Component: `<StatsTab />`**

Read-only performance overview for this provider. Helps admins assess workload, efficiency, and patterns.

#### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Performance Overview          Period: [This Month ▼]            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Completed   │  │  No-Show     │  │ Cancellation  │          │
│  │     124      │  │   8  (6.1%)  │  │  12  (9.2%)  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Utilisation  │  │  Avg. Apt    │  │   Working    │           │
│  │    73%       │  │  Duration    │  │    Days      │           │
│  │  ████████░░  │  │  28 min      │  │    22 days   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  APPOINTMENTS BY STATUS (bar chart)                              │
│  Completed ████████████████████ 124                             │
│  Cancelled ████░░░░░░░░░░░░░░░░  12                             │
│  No-Show   ██░░░░░░░░░░░░░░░░░░   8                             │
│  Scheduled ██████░░░░░░░░░░░░░░  38                             │
├──────────────────────────────────────────────────────────────────┤
│  DAILY VOLUME (last 7 days, horizontal bar chart)                │
│  Mon  ████████  8                                               │
│  Tue  ██████    6                                               │
│  ...                                                             │
└──────────────────────────────────────────────────────────────────┘
```

**Period selector** — Dropdown: Today / This Week / This Month / Last Month / Custom Range. Changing the period re-fetches stats.

**API:**
```
GET /api/v1/providers/{id}/stats?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
```
> **Backend note:** This endpoint needs to be **created**. See §9.1.

**KPI definitions:**

| KPI | Calculation |
|---|---|
| Completed | `COUNT(*) WHERE status = 'completed'` |
| No-Show | `COUNT(*) WHERE status = 'no_show'` |
| No-Show % | `(no_show / total_scheduled) * 100` |
| Cancellation | `COUNT(*) WHERE status = 'cancelled'` |
| Utilisation % | `(booked_slots / available_slots) * 100` — available slots = working days × max_daily_appointments |
| Avg. Duration | Average of `(appointment_end - appointment_start)` in minutes for completed appointments |
| Working Days | Count of distinct dates with at least one non-cancelled appointment in the period |

Charts are simple horizontal bar charts using a lightweight library (Recharts or a native SVG implementation). Do NOT use heavy charting libraries for this — the data is simple enough for basic bars.

---

## 5. Promote User to Provider Flow

**Component: `<PromoteUserDialog />`** — Modal, width 640px.
**Trigger:** "＋ Add Provider" button (page header or list footer).

Creating a provider is a two-step process: select an existing user, then configure their clinical profile.

### Step 1 — Select User

```
┌──────────────────────────────────────────────────────────────┐
│  Add Provider — Step 1 of 2                                  │
│  Select an existing user to promote to provider role.        │
├──────────────────────────────────────────────────────────────┤
│  Search users:  [ 🔍 Search by name or email...           ]  │
│                                                              │
│  ○  Jane Doe    jane@clinic.com    (Receptionist)           │
│  ○  Mark Lee    mark@clinic.com    (Receptionist)           │
│  ...                                                         │
│                                                              │
│  Don't see the right person?                                 │
│  First create the user at /dashboard/admin/users, then       │
│  return here to promote them.                                │
├──────────────────────────────────────────────────────────────┤
│  [Cancel]                                       [Next →]     │
└──────────────────────────────────────────────────────────────┘
```

**User search:** Live search (300ms debounce) against users who do NOT already have a provider record.

**API:**
```
GET /api/v1/users/?role_exclude=provider&is_active=true&search={query}
```
> **Backend note:** The `role_exclude` filter param needs to be added to `GET /api/v1/users/` to show only non-provider users. See §9.2.

**"Next →" button** — disabled until a user is selected.

### Step 2 — Configure Clinical Profile

```
┌──────────────────────────────────────────────────────────────┐
│  Add Provider — Step 2 of 2                                  │
│  Configure Dr. Jane Doe's clinical profile.                  │
├──────────────────────────────────────────────────────────────┤
│  Specialization*      [Cardiology ▼]                         │
│  Daily Capacity*      [8          ] appointments/day         │
│  Consultation Fee     [500        ] (optional)               │
│  Emergency Enabled    [☐] This provider accepts emergencies  │
│                                                              │
│  Initial Services     (optional — can add later)             │
│  [☐] General Consultation    [☐] ECG Test                   │
│  [☐] Blood Test              [☐] Echocardiography            │
├──────────────────────────────────────────────────────────────┤
│  [← Back]                              [Create Provider]     │
└──────────────────────────────────────────────────────────────┘
```

**Specialization dropdown** — populated from `GET /api/v1/specializations/`

**Initial Services** — multi-select checkbox list of all active services. Optional. Selecting here is a convenience — it fires assign calls after provider creation.

**"Create Provider" button:**

Step 1 — Promote user to provider:
```
POST /api/v1/providers/
Body: {
  user_id,
  specialization_id,
  max_daily_appointments,
  consultation_fee,
  emergency_enabled
}
```

Step 2 (if services selected) — assign each service in parallel:
```
POST /api/v1/providers/{new_provider_id}/services/{service_id}
```

**On success:**
- Dialog closes
- New provider card appears at the top of the provider list (sorted alphabetically after re-sort)
- Provider is auto-selected in the list and detail panel opens on Profile tab
- Toast: "Provider created — Dr. Jane Doe · Cardiology"

---

## 6. Shared Dialogs & Panels

---

### 6A. Edit Provider Profile Dialog

**Component: `<EditProviderDialog />`** — Modal, width 560px.
**Trigger:** "Edit" button in the Provider Detail header.

Two-section form combining user fields and provider-specific fields:

**Section 1 — Account Info** (calls `PUT /api/v1/users/{user_id}`)

| Field | Type | Notes |
|---|---|---|
| Full Name | Text input | Required |
| Email | Text input | Read-only — display only. Note: "Email changes require a separate process." |
| Account Status | Toggle (Active / Inactive) | Deactivating via toggle deactivates the user account |

**Section 2 — Clinical Profile** (calls `PUT /api/v1/providers/{id}`)

| Field | Type | Required | Notes |
|---|---|---|---|
| Specialization | Select dropdown | Yes | Options from `GET /api/v1/specializations/` |
| Daily Appointment Capacity | Number input | Yes | Min 1, max 50. Default 8. |
| Consultation Fee | Number input | No | Decimal. Currency symbol shown as prefix. |
| Emergency Enabled | Toggle | No | "This provider accepts emergency cases" |
| Status | Select | Yes | Available / On Leave / Busy |

**Save strategy:** On click "Save Changes", make **both** API calls in sequence (user first, then provider). If the user call fails, do not proceed to the provider call. Show combined errors inline.

**API — save:**
```
PUT /api/v1/users/{user_id}
Body: { "name": "..." }

PUT /api/v1/providers/{id}
Body: {
  "specialization_id": number,
  "max_daily_appointments": number,
  "consultation_fee": number | null,
  "emergency_enabled": boolean,
  "status": "available" | "on_leave" | "busy"
}
```

**Specialization Change Warning:** If the specialization is changed and the provider has services assigned that require the OLD specialization, show a warning in the dialog before saving:
```
⚠ Changing specialization from Cardiology to General Practice
  will create a mismatch for 2 assigned services:
  · ECG Test (requires Cardiology)
  · Echocardiography (requires Cardiology)
  These services will remain assigned. Review Services tab after saving.
```

**On success:** Dialog closes, detail panel header refreshes with new values, provider list card updates name/specialization, toast: "Provider profile updated."

---

### 6B. Add / Edit Availability Block Panel

**Component: `<AvailabilityBlockPanel />`** — Right slide-in panel, width 440px (not a blocking modal — admin can still see the availability grid behind it).
**Trigger:** "＋ Add Block" button or "✏ Edit" on an existing day row.

#### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Day of Week | Select / Radio buttons | Yes | Mon/Tue/Wed/Thu/Fri/Sat/Sun. In edit mode: read-only (day cannot change — delete and recreate instead). In create mode: multi-select to add same hours across multiple days at once. |
| Start Time | Time picker | Yes | 15-min increments. Min: 06:00. |
| End Time | Time picker | Yes | Must be after Start Time. |
| Break Time | Toggle + two time pickers | No | Enabling shows "Break From" and "Break To" fields. Break window must be within Start–End range. |
| Notes | Text input | No | Max 200 chars. E.g., "Half day", "Clinic B only". Maps to `availability.notes`. |

**Multi-day creation (create mode only):** When multiple days are checked, submitting creates one `availability` record per selected day (fired in parallel). A single spinner shows during the batch creation.

**Inline preview** below the form — updates live as fields change:

```
Preview:
  Thursday
  09:00 ───[Break 12-13]─── 17:00  (7h working, 1h break)
```

**Validation:**
- End time must be after start time
- Break window must fit within start–end range
- Cannot duplicate an existing block for the same provider + day (check client-side against loaded availability list)

**API — create:**
```
POST /api/v1/availability/
Body: {
  provider_id,
  day_of_week,      ← 0-6 (0 = Sunday)
  start_time,       ← "HH:MM"
  end_time,         ← "HH:MM"
  break_start,      ← "HH:MM" | null
  break_end,        ← "HH:MM" | null
  is_working_day: true,
  notes             ← string | null
}
```

**API — update:**
```
PUT /api/v1/availability/{id}
Body: { start_time, end_time, break_start, break_end, notes }
```

**Appointment conflict check on reduce hours:** When editing to move `start_time` later or `end_time` earlier, check if any appointments exist in the newly excluded window. Use:
```
GET /api/v1/appointments/?provider_id={id}&day_of_week={n}&time_from={new_start}&time_to={new_end}
```
> **Backend note:** `day_of_week` and time-of-day filtering on appointments is a non-trivial query. If not implementable quickly, skip this check for v1 and show a static warning instead.

**On success:** Panel closes, availability grid row updates in place (animate the new/updated bar), toast: "Availability updated — [Day Name]."

---

### 6C. Create / Edit Time Off Panel

**Component: `<TimeOffPanel />`** — Right slide-in panel, width 440px.
**Trigger:** "＋ Add Time Off" (admin creates for provider) | "Edit" on a pending/upcoming time-off row.

#### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Date Range | Date range picker | Yes | Min: tomorrow for new entries. Calendar highlights days that already have approved time off (greyed out). |
| Reason | Text input | Yes | E.g., "Annual Leave", "Sick Leave", "Conference". Min 3 chars. |
| Coverage | Toggle: Full Day / Partial Day | No | Full day = covers all working hours. Partial day shows Start Time + End Time pickers. |
| Partial Start Time | Time picker | Conditional | Shown only if Partial Day selected. |
| Partial End Time | Time picker | Conditional | Shown only if Partial Day selected. |
| Auto-Approve | Toggle (admin-only) | No | Default ON when admin creates. If ON, sets `is_approved = TRUE` immediately on creation with `approved_by = current_admin_id`. If OFF, creates as pending (for providers who self-submit via their own dashboard). |

**Duration preview:** "5 working days · 15 Apr – 19 Apr 2026" — live calculated below the date range.

**Appointment conflict check:** After date selection, the panel checks for scheduled appointments in the selected range:
```
GET /api/v1/appointments/?provider_id={id}&date_from=&date_to=&status=scheduled,checked_in
```
If conflicts found:
```
⚠ Dr. Smith has 12 scheduled appointments during this period.
  Approving this time off will NOT automatically cancel them.
  You must manually reschedule or cancel affected appointments.
  [View Appointments →]  ← links to Appointments tab filtered to this provider + date range
```

**API — create:**
```
POST /api/v1/time-off/
Body: {
  provider_id,
  start_date,       ← "YYYY-MM-DD"
  end_date,         ← "YYYY-MM-DD"
  reason,
  start_time,       ← "HH:MM" | null (null = full day)
  end_time,         ← "HH:MM" | null
  is_approved,      ← boolean (true if admin auto-approves)
  approved_by       ← current admin user_id (only if is_approved = true)
}
```

**API — update (pending entries only):**
```
PUT /api/v1/time-off/{id}
Body: { start_date, end_date, reason, start_time, end_time }
```
> **Backend note:** `PUT /api/v1/time-off/{id}` needs to be verified — confirm it exists and accepts these fields.

**On success:** Panel closes, Time Off tab table refreshes, toast: "Time off added for Dr. Smith · 15–19 Apr 2026."

---

### 6D. Approve / Reject Time Off Dialog

**Component: `<ApproveRejectDialog />`** — Modal, width 480px.
**Trigger:** "Approve" or "Reject" buttons on pending time-off rows.

#### Approve Mode

```
┌──────────────────────────────────────────────────────────────┐
│  Approve Time Off                                            │
│  ──────────────────────────────────────────────────────────  │
│  Dr. Sarah Smith · 5 Jan – 10 Jan (Sick Leave)              │
│                                                              │
│  ⚠ This provider has 3 scheduled appointments during        │
│    this period that will NOT be automatically cancelled.     │
│    Please review and handle them manually.                   │
│                                                              │
│  Approval Note (optional):                                   │
│  [________________________________________________]         │
│                                                              │
│  [Cancel]                             [✓ Approve]           │
└──────────────────────────────────────────────────────────────┘
```

**API — approve:**
```
PATCH /api/v1/time-off/{id}/approve
Body: { "approved_by": current_admin_user_id, "note": "..." }
```
> **Backend note:** The existing `PATCH /api/v1/time-off/{id}/approve` endpoint must accept `approved_by` and optionally a `note` field. Verify this is supported.

#### Reject Mode

```
┌──────────────────────────────────────────────────────────────┐
│  Reject Time Off Request                                     │
│  ──────────────────────────────────────────────────────────  │
│  Dr. Sarah Smith · 5 Jan – 10 Jan (Sick Leave)              │
│                                                              │
│  Rejection Reason* (required):                               │
│  [________________________________________________]         │
│  [e.g., Insufficient coverage during this period]           │
│                                                              │
│  [Cancel]                             [✗ Reject]            │
└──────────────────────────────────────────────────────────────┘
```

**API — reject:**
```
PATCH /api/v1/time-off/{id}/reject
Body: { "rejected_by": current_admin_user_id, "rejection_reason": "..." }
```
> **Backend note:** A `PATCH /api/v1/time-off/{id}/reject` endpoint needs to be **created**. It should set `is_approved = FALSE` (or a new `status` field — see §9.3) and store the rejection reason and the admin who rejected it. The current schema only has `is_approved` boolean — a `status` field (`pending` | `approved` | `rejected`) is needed to represent the rejected state distinctly from pending.

**On approve:** Dialog closes, row moves from "Pending" section to "Upcoming Approved" section, badge count decreases, toast: "Time off approved — 5–10 Jan."
**On reject:** Dialog closes, row disappears (or moves to a "Rejected" sub-section), toast: "Time off rejected."

---

### 6E. Manage Services Panel

**Component: `<ManageServicesPanel />`** — Right slide-in panel, width 480px.
**Trigger:** "Manage Services" button in the Services tab.

A checklist of all active services in the system. Currently assigned services are pre-checked. The admin toggles services on/off.

```
┌──────────────────────────────────────────────────────────────┐
│  Manage Services — Dr. Sarah Smith                [✕]        │
│  Cardiology specialization                                   │
│  ──────────────────────────────────────────────────────────  │
│  [ 🔍 Search services...                                 ]   │
│                                                              │
│  CARDIOLOGY                                                  │
│  [☑] ECG Test              45 min · ✓ Specialization match  │
│  [☑] Echocardiography      60 min · ✓ Specialization match  │
│  [☑] Cardiac Consultation  30 min · ✓ Specialization match  │
│                                                              │
│  GENERAL                                                     │
│  [☑] General Consultation  30 min · ⚠ Requires Gen. Practice│
│  [☐] Blood Test            15 min · No specialization req.  │
│  [☐] X-Ray                 20 min · No specialization req.  │
│                                                              │
│  [Cancel]                              [Save Changes]        │
└──────────────────────────────────────────────────────────────┘
```

Services are grouped by category (from `services.category`). Services that match the provider's specialization are shown first within their group.

**Specialization mismatch indicator:** Services with a `required_specialization_id` that does NOT match the provider's specialization show a ⚠ amber warning. Hovering: "This service requires [Specialization] but Dr. Smith is a Cardiologist. Assigning is allowed but may indicate a configuration error."

**Save strategy:** On "Save Changes", diff the current selection against the original assignment:
- Newly checked = call `POST /api/v1/providers/{provider_id}/services/{service_id}` per addition
- Newly unchecked = call `DELETE /api/v1/providers/{provider_id}/services/{service_id}` per removal
- Fire all changes in parallel (Promise.all)

If any individual call fails, show which services failed in an error message without rolling back the successful ones.

**On success:** Panel closes, Services tab refreshes with new assignment list, toast: "Services updated for Dr. Smith."

---

### 6F. Deactivate / Delete Confirmation Dialog

**Component: `<DeactivateConfirmDialog />`** — Modal, width 480px.
**Trigger:** "Deactivate Provider" from the ⋮ More dropdown in the detail header.

> **Note:** MediSync does not hard-delete providers. Deactivation sets `users.is_active = FALSE` which prevents login and removes the provider from booking flows. The provider record and all historical data is preserved.

```
┌──────────────────────────────────────────────────────────────┐
│  Deactivate Provider                                         │
│  ──────────────────────────────────────────────────────────  │
│  You are about to deactivate:                                │
│                                                              │
│  Dr. Sarah Smith · Cardiology                                │
│                                                              │
│  ⚠ This provider has:                                        │
│     · 3 scheduled appointments (will NOT be auto-cancelled)  │
│     · 1 pending time-off request (will be cancelled)         │
│                                                              │
│  After deactivation:                                         │
│  · Dr. Smith cannot log in                                   │
│  · New appointments cannot be booked for Dr. Smith           │
│  · Existing appointments must be handled manually            │
│  · All historical data is preserved                          │
│                                                              │
│  [Cancel]                          [Deactivate Provider]     │
└──────────────────────────────────────────────────────────────┘
```

The impact counts (scheduled appointments, pending time off) are loaded from already-fetched data in the current session.

**API — deactivate:**
```
PATCH /api/v1/users/{user_id}/deactivate
```
(This endpoint already exists in the users API.)

**On success:** Dialog closes, provider card in the list becomes muted/inactive (shown if "Show inactive" toggle is ON, hidden if OFF), detail panel updates to show a red "Inactive" banner at the top, toast: "Dr. Smith has been deactivated."

**Reactivate:** When viewing an inactive provider (with "Show inactive" toggled ON), the detail header ⋮ More menu shows "Reactivate Provider" instead. Calls `PATCH /api/v1/users/{user_id}/activate`.

---

## 7. Data Fetching & State Management

### 7.1 Data Loading Strategy

**On page mount (parallel):**
```typescript
const [providers, specializations, services] = await Promise.all([
  GET /api/v1/providers/,           // full list for left panel
  GET /api/v1/specializations/,     // for dropdowns in edit/create forms
  GET /api/v1/services/,            // for services management panel
]);
```

**On provider selection (sequential — load detail data):**
```typescript
// Fire in parallel after selection
const [providerDetail, availability, timeOff, providerServices] = await Promise.all([
  GET /api/v1/providers/{id},                // full merged profile
  GET /api/v1/availability/{provider_id},   // weekly schedule
  GET /api/v1/time-off/{provider_id},       // all time-off entries
  GET /api/v1/providers/{id}/services,      // assigned services
]);
// Capacity is tab-specific — only load when Profile tab is active
```

**Stats tab (lazy):** Only fetched when the user clicks the Stats tab. Not loaded on provider selection.

### 7.2 State Structure

```typescript
interface ProvidersPageState {
  // List panel
  providers: Provider[];           // full list
  selectedProviderId: string | null;
  listFilters: {
    search: string;
    status: string;
    specialization_id: number | null;
    showInactive: boolean;
  };

  // Detail panel
  selectedProvider: ProviderDetail | null;  // merged provider + user
  availability: Availability[];
  timeOff: ProviderTimeOff[];
  providerServices: Service[];

  // Reference data (loaded once)
  specializations: Specialization[];
  allServices: Service[];

  // Loading states
  listLoading: boolean;
  detailLoading: boolean;
  availabilityLoading: boolean;
  timeOffLoading: boolean;

  // Active tab
  activeTab: 'profile' | 'availability' | 'timeoff' | 'services' | 'stats';
}
```

### 7.3 Optimistic Updates

| Operation | Optimistic Behaviour |
|---|---|
| Change provider status (via ⋮ More) | Update `providers.status` in list card immediately; revert on API failure |
| Remove a service assignment | Remove from providerServices list immediately; revert on failure |
| Delete an availability block | Remove from availability list immediately; revert on failure |
| Cancel a time-off entry | Remove from timeOff list immediately; revert on failure |
| Approve a time-off entry | Move from Pending to Approved section immediately; revert on failure |

Do NOT use optimistic updates for create operations (provider creation, availability block creation, time-off creation) — wait for the API response to get the assigned `id` before adding to local state.

---

## 8. UI State Standards

### 8.1 Loading States

| Component | Skeleton |
|---|---|
| Provider List | 5 skeleton cards (height ~80px each with avatar circle + 3 text lines) |
| Provider Detail Header | Full header skeleton: avatar + 3 text line skeletons + button skeletons |
| Profile Tab | Two section skeletons with field label + value line skeletons |
| Availability Tab | 7-row skeleton grid with varying bar widths |
| Time Off Tab | 3 skeleton rows per section |
| Services Tab | 4 skeleton service cards |
| Stats Tab | 6 KPI card skeletons + 2 chart skeletons |

### 8.2 Empty States

| Component | Message | CTA |
|---|---|---|
| Provider List (no results) | "No providers found" | "Clear Filters" |
| Provider List (no providers) | "No providers yet" | "+ Add Provider" |
| Availability Tab (no blocks) | "No availability set for this provider. Add working hours to enable appointment booking." | "+ Add Block" |
| Time Off Tab (no entries) | "No time off on record for this provider." | "+ Add Time Off" |
| Services Tab (no services) | "No services assigned. This provider cannot be booked until at least one service is assigned." | "Manage Services" |
| Stats Tab (no data) | "No appointment data for the selected period." | Period selector to change range |

### 8.3 Error States

| Scenario | Response |
|---|---|
| Provider list fails to load | Full left panel error with Retry button |
| Provider detail fails to load | Right panel error banner with Retry button |
| Edit profile save fails | Inline error at top of dialog |
| Availability save fails | Inline error at top of panel; form stays open |
| Time off approve fails | Toast error; row reverts to pending |
| Service assign/remove fails | Toast error; checkbox reverts |
| Provider creation fails (user already provider) | Inline error: "This user is already a provider." |

### 8.4 Toast Notifications

| Action | Toast |
|---|---|
| Provider created | "Provider created — Dr. [Name] · [Specialization]" |
| Provider profile updated | "Profile updated — Dr. [Name]" |
| Provider deactivated | "Dr. [Name] has been deactivated" |
| Provider reactivated | "Dr. [Name] has been reactivated" |
| Availability block added | "Availability updated — [Day Name]" |
| Availability block deleted | "Availability removed — [Day Name]" |
| Time off created | "Time off added — [Date range]" |
| Time off approved | "Time off approved — [Date range]" |
| Time off rejected | "Time off rejected" |
| Time off deleted | "Time off entry deleted" |
| Service assigned | "[Service name] assigned to Dr. [Name]" |
| Service removed | "[Service name] removed from Dr. [Name]" |

---

## 9. Required Backend Endpoints

---

### 9.1 GET provider performance stats

**Why needed:** The Stats tab needs aggregated appointment data per provider for a date range. Cannot be derived from existing endpoints without N+1 calls.

**Endpoint to create:**
```
GET /api/v1/providers/{id}/stats?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
```

**Expected response:**
```json
{
  "period": { "date_from": "2026-04-01", "date_to": "2026-04-30" },
  "totals": {
    "scheduled": 162,
    "completed": 124,
    "cancelled": 12,
    "no_show": 8,
    "in_progress": 3
  },
  "rates": {
    "no_show_percent": 6.1,
    "cancellation_percent": 9.2,
    "utilisation_percent": 73.0
  },
  "averages": {
    "appointment_duration_minutes": 28
  },
  "working_days": 22,
  "daily_volumes": [
    { "date": "2026-04-01", "count": 8 },
    { "date": "2026-04-02", "count": 6 }
  ]
}
```

Server-side: aggregate with `WHERE provider_id = $1 AND appointment_start BETWEEN $date_from AND $date_to`.

---

### 9.2 GET users excluding those already providers

**Why needed:** The "Promote to Provider" dialog must show only users who are NOT already providers. Without this filter, the list would include current providers.

**Extend existing endpoint:**
```
GET /api/v1/users/?role_exclude=provider&is_active=true&search={query}
```

Add `role_exclude` query param server-side: `WHERE role_id != (SELECT id FROM roles WHERE name = 'provider')`.

Alternatively, add a dedicated endpoint:
```
GET /api/v1/users/non-providers?search={query}
```

Either approach works. The dedicated endpoint is cleaner.

---

### 9.3 PATCH time-off reject + status field

**Why needed:** The current `provider_time_off` table has only `is_approved BOOLEAN`. This cannot represent "rejected" distinctly from "pending" (both would be `FALSE`). The admin needs to reject requests and have them tracked separately.

**Schema change needed:**
Add a `status` column to `provider_time_off`:
```sql
ALTER TABLE provider_time_off
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Migrate existing data:
UPDATE provider_time_off SET status = 'approved' WHERE is_approved = TRUE;
UPDATE provider_time_off SET status = 'pending' WHERE is_approved = FALSE;

-- Optional: Add rejection tracking columns
ADD COLUMN rejected_by UUID REFERENCES users(id);
ADD COLUMN rejection_reason VARCHAR(500);
ADD COLUMN reviewed_at TIMESTAMPTZ;
```

**New reject endpoint:**
```
PATCH /api/v1/time-off/{id}/reject
Body: { "rejected_by": "uuid", "rejection_reason": "..." }
Response: { updated time_off object with status = "rejected" }
```

**Update existing approve endpoint** to also set `status = 'approved'` and `reviewed_at = NOW()`.

---

### 9.4 GET providers/{id} — merged response

**Why needed:** The provider detail panel needs provider fields AND user fields (name, email, is_active) in a single response. Without this, every provider selection requires two API calls.

**Extend existing endpoint:**
```
GET /api/v1/providers/{id}
```

**Add to response:**
```json
{
  "id": "uuid",
  "specialization_id": 1,
  "specialization_name": "Cardiology",
  "consultation_fee": "500.00",
  "emergency_enabled": true,
  "max_daily_appointments": 8,
  "status": "available",
  "created_at": "...",
  "user": {
    "id": "uuid",
    "name": "Dr. Sarah Smith",
    "email": "sarah@clinic.com",
    "is_active": true,
    "created_at": "..."
  }
}
```

The `user` sub-object is the linked `users` row. Server-side: JOIN `users` on `providers.id = users.id`.

---

### 9.5 GET providers/ — list with joined user data

**Why needed:** The provider list cards need `users.name`, `users.email`, and `specializations.name` to render. Without these joined fields, every card would need a separate user lookup — unusable at scale.

**Extend existing endpoint:**
```
GET /api/v1/providers/
```

Add joined fields to every item in the response list (same shape as `GET /api/v1/providers/{id}` above). The list response can omit heavy fields like `consultation_fee` to keep the payload lightweight.

---

### 9.6 PATCH providers/{id}/status — lightweight status update

**Why needed:** The ⋮ More "Change Status" dropdown in the detail header and the Provider Dashboard's nav toggle both need a lightweight endpoint to update only `providers.status` without sending the full profile payload.

**Endpoint to create:**
```
PATCH /api/v1/providers/{id}/status
Body: { "status": "available" | "on_leave" | "busy" }
Response: { "id": "uuid", "status": "on_leave" }
```

This prevents race conditions where a full `PUT /api/v1/providers/{id}` might accidentally overwrite other fields if the client has stale data.

---

## 10. API Quick Reference

| # | Method | Endpoint | Status | Used In |
|---|---|---|---|---|
| 1 | GET | `/api/v1/providers/` | ✅ Extend (add joined user + specialization fields) | Provider list |
| 2 | GET | `/api/v1/providers/{id}` | ✅ Extend (add joined user sub-object) | Detail panel header, Profile tab |
| 3 | POST | `/api/v1/providers/` | ✅ Yes | Promote User flow |
| 4 | PUT | `/api/v1/providers/{id}` | ✅ Yes | Edit Provider dialog |
| 5 | PATCH | `/api/v1/providers/{id}/status` | ⚠️ **Create** | Status toggle in detail header |
| 6 | GET | `/api/v1/providers/{id}/services` | ✅ Yes | Services tab |
| 7 | POST | `/api/v1/providers/{provider_id}/services/{service_id}` | ✅ Yes | Manage Services panel |
| 8 | DELETE | `/api/v1/providers/{provider_id}/services/{service_id}` | ✅ Yes | Manage Services panel, Services tab |
| 9 | GET | `/api/v1/providers/{id}/stats` | ⚠️ **Create** | Stats tab |
| 10 | GET | `/api/v1/availability/{provider_id}` | ✅ Yes | Availability tab |
| 11 | POST | `/api/v1/availability/` | ✅ Yes | Availability block panel |
| 12 | PUT | `/api/v1/availability/{id}` | ✅ Yes | Availability block panel |
| 13 | DELETE | `/api/v1/availability/{id}` | ✅ Yes | Availability tab |
| 14 | GET | `/api/v1/time-off/{provider_id}` | ✅ Yes | Time Off tab |
| 15 | POST | `/api/v1/time-off/` | ✅ Yes | Time Off panel |
| 16 | PUT | `/api/v1/time-off/{id}` | ✅ Verify (confirm fields accepted) | Time Off panel |
| 17 | DELETE | `/api/v1/time-off/{id}` | ✅ Yes | Time Off tab |
| 18 | PATCH | `/api/v1/time-off/{id}/approve` | ✅ Extend (add `approved_by`, `note`) | Approve dialog |
| 19 | PATCH | `/api/v1/time-off/{id}/reject` | ⚠️ **Create** | Reject dialog |
| 20 | GET | `/api/v1/specializations/` | ✅ Yes | Edit dialog dropdowns, Create flow |
| 21 | GET | `/api/v1/services/` | ✅ Yes | Manage Services panel |
| 22 | GET | `/api/v1/users/` | ✅ Extend (add `role_exclude` param) | Promote User flow |
| 23 | GET | `/api/v1/users/non-providers` | ⚠️ **Create** (alternative to param approach) | Promote User flow |
| 24 | PUT | `/api/v1/users/{id}` | ✅ Yes | Edit Provider dialog (name field) |
| 25 | PATCH | `/api/v1/users/{id}/activate` | ✅ Yes | Reactivate provider |
| 26 | PATCH | `/api/v1/users/{id}/deactivate` | ✅ Yes | Deactivate dialog |
| 27 | GET | `/api/v1/appointments/providers/{id}/capacity` | ✅ Yes | Profile tab — Today's Snapshot |

**Legend:**
- ✅ Yes = endpoint exists and can be used as-is
- ✅ Extend = endpoint exists but response schema or params need to be updated
- ✅ Verify = endpoint exists but needs confirmation it supports the required fields
- ⚠️ Create = endpoint does not exist and must be built before frontend integration

---

*MediSync Admin Providers Page Frontend Spec — Version 1.0 — April 2026 — Internal Use Only*