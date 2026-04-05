# MediSync — Admin Patients Page Implementation Spec
**Route:** `http://localhost:3000/dashboard/admin/patients`
**Version:** 1.0 | **Prepared for:** Frontend Development Team | **Date:** April 2026
**Scope:** End-to-end design and implementation guide for the Patients management page inside the Admin dashboard — covering patient records CRUD, appointment history, notification management, waitlist history, audit trail, and patient-level analytics.

---

## Table of Contents

1. [Mental Model & Design Decisions](#1-mental-model--design-decisions)
2. [Page Layout & File Structure](#2-page-layout--file-structure)
3. [Patient List (Left Panel)](#3-patient-list-left-panel)
4. [Patient Detail Panel (Right Panel)](#4-patient-detail-panel-right-panel)
   - 4A. Profile Tab
   - 4B. Appointments Tab
   - 4C. Waitlist Tab
   - 4D. Notifications Tab
   - 4E. Audit Tab
5. [Create / Edit Patient Drawer](#5-create--edit-patient-drawer)
6. [Deactivate & Reactivate Patient](#6-deactivate--reactivate-patient)
7. [Bulk Operations](#7-bulk-operations)
8. [Data Fetching & State Management](#8-data-fetching--state-management)
9. [UI State Standards](#9-ui-state-standards)
10. [Required Backend Endpoints](#10-required-backend-endpoints)
11. [API Quick Reference](#11-api-quick-reference)

---

## 1. Mental Model & Design Decisions

### 1.1 What This Page Does

The Admin Patients page is the **single source of truth** for patient records in MediSync. It gives the admin complete visibility and control over every patient's profile, their entire appointment history, waitlist participation, notification delivery status, and the audit trail of all changes made to their record.

This page serves three distinct admin jobs:

1. **Record Management** — Create, edit, view, and deactivate patient records. Correct data errors (name misspellings, wrong phone numbers, duplicate records).
2. **Patient Activity Overview** — See every appointment a patient has had or has coming up, their waitlist entries, and the full notification log sent on their behalf.
3. **Compliance & Auditing** — Review the complete audit trail of who changed what and when on a patient's record. Required for HIPAA compliance considerations.

### 1.2 Layout Strategy: Master–Detail Split Panel

The same **master–detail split panel** used on the Providers page is the right choice here. The patient list on the left acts as a persistent selector; the right panel renders tabbed detail for the selected patient.

This is significantly better than navigating to a separate route per patient — admins frequently compare patients, switch between records, and need to maintain list context (filters, scroll position) while viewing a detail.

```
┌──────────────────────────┬──────────────────────────────────────────────────┐
│  PATIENT LIST            │  PATIENT DETAIL PANEL                           │
│  (left, ~320px fixed)    │  (right, fills remainder)                       │
│                          │                                                 │
│  Search + Filters        │  [Profile] [Appointments] [Waitlist]            │
│                          │  [Notifications] [Audit]                        │
│  [Patient Card]          │                                                 │
│  [Patient Card]  ←●      │  Tab content for the selected patient           │
│  [Patient Card]          │                                                 │
│                          │                                                 │
│  [+ New Patient]         │                                                 │
└──────────────────────────┴──────────────────────────────────────────────────┘
```

On mobile (< 1024px): single column. List first. Selecting a patient slides the detail panel in full-width. A "← Back" button returns to the list.

### 1.3 Patient Data Sensitivity

Patient records contain PII (Personally Identifiable Information) — name, phone, email, date of birth, gender. The UI must:

- Never expose patient data in URL parameters visible in browser history. Use patient UUIDs only (not names or phone numbers) in URLs.
- Never log patient PII to the browser console.
- Show a data sensitivity reminder in the page header: "Patient data is confidential — handle in accordance with your clinic's privacy policy."
- Export functionality must be restricted to admins and require explicit confirmation before download.

---

## 2. Page Layout & File Structure

### 2.1 File Structure (Next.js App Router)

```
app/
└── dashboard/
    └── admin/
        └── patients/
            ├── page.tsx                          ← Root page, split-panel shell
            ├── components/
            │   ├── PatientList.tsx               ← Left panel: list + search + filters
            │   ├── PatientCard.tsx               ← Individual card in the list
            │   ├── PatientDetailPanel.tsx        ← Right panel: tab shell + header
            │   ├── tabs/
            │   │   ├── ProfileTab.tsx
            │   │   ├── AppointmentsTab.tsx
            │   │   ├── WaitlistTab.tsx
            │   │   ├── NotificationsTab.tsx
            │   │   └── AuditTab.tsx
            │   ├── PatientFormDrawer.tsx         ← Create + Edit form (shared)
            │   ├── DeactivateDialog.tsx
            │   ├── MergePatientDialog.tsx        ← Duplicate merge flow
            │   └── BulkActionsBar.tsx
            └── hooks/
                ├── usePatients.ts                ← list + CRUD
                ├── usePatientDetail.ts           ← single patient full profile
                ├── usePatientAppointments.ts     ← appointment history
                ├── usePatientNotifications.ts    ← notification log
                └── usePatientAudit.ts            ← audit trail
```

### 2.2 Page Header

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Patients                                                   [+ New Patient]  │
│  Manage patient records, appointments, and notification preferences.         │
│  ⚠ Patient data is confidential — handle per your clinic's privacy policy.  │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Title: "Patients" (H1)
- Subtitle: "Manage patient records, appointments, and notification preferences."
- Privacy notice: amber info chip with lock icon and policy note
- "＋ New Patient" button — top right — opens Create Patient Drawer (§5)

---

## 3. Patient List (Left Panel)

**Component: `<PatientList />`** — Fixed-width (~320px), full height, independently scrollable.

### 3.1 Search Bar

```
┌──────────────────────────────────────────┐
│  🔍  Search by name, phone, or email...  │
└──────────────────────────────────────────┘
```

- Debounced 300ms after last keystroke
- Minimum 1 character before search fires
- Searches across `patients.name` (partial), `patients.phone` (partial), `patients.email` (exact and partial)
- Clears with ✕ button when query is present

**API:**
```
GET /api/v1/patients/?search={query}&is_active={true|false}&page=1&page_size=30
```

### 3.2 Filter Controls

Below the search bar, a compact filter row:

```
┌──────────────────────────────────────────────┐
│  [Active ▼]   [Sort: Name A–Z ▼]            │
│  [☐ Notification Opt-Out]  [☐ Has Upcoming] │
└──────────────────────────────────────────────┘
```

**Status filter dropdown:** Active (default) / Inactive / All

**Sort dropdown:**
- Name A–Z (default)
- Name Z–A
- Newest First (by `patients.created_at DESC`)
- Oldest First
- Most Recent Visit (by most recent `appointments.appointment_start DESC`)

> **Backend note:** "Most Recent Visit" sort requires a join to the `appointments` table. Support a `sort=last_visit` param on `GET /api/v1/patients/`. See §10.1.

**Notification Opt-Out filter toggle:** When checked, shows only patients with `notification_opt_out = TRUE`. Useful for reviewing who is excluded from reminder emails.

**Has Upcoming Appointments filter toggle:** When checked, shows only patients who have at least one upcoming `scheduled` appointment.

> **Backend note:** "Has Upcoming" filter requires a subquery or join. Support `has_upcoming=true` param. See §10.1.

### 3.3 Patient Card

**Component: `<PatientCard />`** — Clickable card.

```
┌────────────────────────────────────────────────────┐
│  [Avatar]   John Doe                          [⋮]  │
│             01711-000000 · john@example.com        │
│             DOB: 12 Jan 1985 (41)                  │
│             🔕 Opt-Out   ● Active                  │
│             Next: 5 Apr · General Consult          │
└────────────────────────────────────────────────────┘
```

**Elements:**

| Element | Content | Notes |
|---|---|---|
| Avatar | Initials circle (first + last name initials) | Generated from `patients.name` |
| Name | Full name — bold | Primary identifier |
| Contact | Phone · Email — muted | Truncated if both present |
| DOB + Age | "DOB: 12 Jan 1985 (41)" | Age derived dynamically from `date_of_birth` |
| Opt-out badge | "🔕 Opt-Out" — amber chip | Only shown if `notification_opt_out = TRUE` |
| Status | "● Active" / "○ Inactive" | Green / muted dot |
| Next appointment | "Next: 5 Apr · General Consult" — muted | Only shown if upcoming appt exists. Derived from `appointments` data. |

**⋮ Actions menu (top-right of card):**
- Edit Patient
- Book Appointment (opens booking modal pre-filled with this patient)
- Deactivate (or Reactivate if inactive)
- View Audit

**Selected state:** Active card has a left border accent + slightly elevated background.

**API — initial list load:**
```
GET /api/v1/patients/?is_active=true&sort=name_asc&page=1&page_size=30
```

### 3.4 Infinite Scroll / Pagination

The patient list uses **infinite scroll** rather than pagination. As the user scrolls near the bottom of the list, the next page loads automatically and appends to the list.

This is better than pagination for a list panel — admins browse the list, they do not think in pages.

**Load trigger:** When the user scrolls within 100px of the list bottom, fetch the next page.

**Load indicator:** A subtle spinner at the bottom of the list during fetch.

**Total count display:** Above the list cards: "1,243 patients"

### 3.5 List Footer

```
[+ New Patient]
```

Secondary CTA at bottom of list (mirrors page header button). Visible even when scrolling within the list.

### 3.6 No Results States

**No search results:**
```
No patients found for "john sm".
Try a different name, phone, or email.
[+ Create New Patient]
```

**No patients at all:**
```
No patient records yet.
Create the first patient to get started.
[+ New Patient]
```

**Filtered (inactive / opt-out) with no results:**
```
No inactive patients found.
[Clear Filters]
```

---

## 4. Patient Detail Panel (Right Panel)

**Component: `<PatientDetailPanel />`** — Right column, fills remaining width.

**Default state (no patient selected):**
```
┌─────────────────────────────────────────┐
│                                         │
│   Select a patient from the list        │
│   to view their complete record.        │
│                                         │
└─────────────────────────────────────────┘
```

### 4.1 Detail Panel Header

Persistent across all tabs. Always visible at the top of the right panel.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Avatar]   John Doe                           [Edit]  [Book Appt]  [⋮] │
│             01711-000000 · john@example.com                              │
│             DOB: 12 Jan 1985 (41 yrs) · Male                            │
│             ● Active   🔕 Notifications Off                              │
│             Patient since: 12 Jan 2025 · 14 total appointments           │
└──────────────────────────────────────────────────────────────────────────┘
```

**"Edit" button** → opens Edit Patient Drawer (§5)

**"Book Appointment" button** → opens the Book Appointment Modal pre-filled with this patient (navigates to the appointments page flow)

**"⋮ More" dropdown:**
- Toggle Notification Opt-Out (quick toggle without opening the full edit form)
- Deactivate Patient / Reactivate Patient
- Export Patient Record (PDF — see §10.5)
- View in Audit Log (links to `/dashboard/admin/audit?entity_type=patient&entity_id={id}`)

**"Patient since" + total appointments** — summary stats loaded from patient detail API.

**API — load selected patient:**
```
GET /api/v1/patients/{id}
```

> **Backend note:** The patient detail response should include `total_appointments_count` as an aggregated field. See §10.2.

### 4.2 Tab Bar

Five tabs below the header:

```
[Profile]  [Appointments (14)]  [Waitlist (2)]  [Notifications]  [Audit]
```

- **Appointments** tab shows count of total appointments
- **Waitlist** tab shows count of active (`waiting`) entries — badge only shown if > 0
- Active tab persists per selected patient
- Default tab: **Profile** on first selection

---

### Tab 4A — Profile

**Component: `<ProfileTab />`**

Read-only view of all patient demographic fields. Clean two-column layout. "Edit" button opens the form drawer.

```
┌──────────────────────────────────────────────────────────────────┐
│  Personal Information                                    [Edit]   │
│  ──────────────────────────────────────────────────────────────  │
│  Full Name            John Doe                                   │
│  Phone                01711-000000                               │
│  Email                john@example.com                           │
│  Date of Birth        12 January 1985                            │
│  Age                  41 years old                               │
│  Gender               Male                                       │
├──────────────────────────────────────────────────────────────────┤
│  Account Settings                                                │
│  ──────────────────────────────────────────────────────────────  │
│  Status               ● Active                                   │
│  Notification Pref.   🔕 Opted Out — no reminders sent          │
│  Patient ID           a1b2c3d4-...  (UUID, monospace, copyable)  │
│  Created              12 Jan 2025 · 09:14 AM                     │
│  Last Updated         2 Apr 2026 · 11:30 AM                      │
├──────────────────────────────────────────────────────────────────┤
│  Quick Stats                                                     │
│  ──────────────────────────────────────────────────────────────  │
│  Total Appointments   14                                         │
│  Completed            11                                         │
│  Cancelled            2                                          │
│  No-Show              1  (7.1% no-show rate)                     │
│  Last Visit           2 Apr 2026 · General Consultation          │
│  Next Appointment     5 Apr 2026 · ECG Test · 10:30 AM           │
└──────────────────────────────────────────────────────────────────┘
```

**Patient ID field:** Shows the UUID in monospace with a "Copy" icon button. Useful for admins referencing a specific record in support tickets or exports.

**Quick Stats:** All derived from appointments data. Loaded as part of:
```
GET /api/v1/patients/{id}/stats
```
> **Backend note:** This lightweight stats endpoint needs to be **created**. See §10.3.

**Notification Preference:** "🔕 Opted Out" shown in amber if `notification_opt_out = TRUE`. If opted in: "🔔 Receiving reminders" in default style. An inline toggle allows the admin to flip this without opening the full edit form:

```
Notification Pref.   [🔔 ON ●───○ OFF]  ← toggle switch
```

Toggle fires immediately:
```
PATCH /api/v1/patients/{id}
Body: { "notification_opt_out": true | false }
```

---

### Tab 4B — Appointments

**Component: `<AppointmentsTab />`**

Complete appointment history for this patient — past, present, and future. The admin's view into every interaction this patient has had with the clinic.

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Appointments (14)                      [+ Book Appointment]    │
│  [Upcoming ●] [Past] [Cancelled] [No-Show]   [Export CSV]       │
├─────────────────────────────────────────────────────────────────┤
│  UPCOMING (3)                                                   │
│  [row] [row] [row]                                              │
├─────────────────────────────────────────────────────────────────┤
│  PAST — COMPLETED (8)                                           │
│  [row] [row] [row] ...  [show more ▼]                          │
├─────────────────────────────────────────────────────────────────┤
│  CANCELLED (2)  [collapsed, click to expand]                    │
├─────────────────────────────────────────────────────────────────┤
│  NO-SHOW (1)    [collapsed, click to expand]                    │
└─────────────────────────────────────────────────────────────────┘
```

**Filter tabs:** Upcoming (default, always expanded) / Past / Cancelled / No-Show. Each tab header shows count. Click to expand/collapse each section.

**"＋ Book Appointment" button** — opens the booking modal pre-filled with this patient.

**"Export CSV" button** — exports this patient's complete appointment history as CSV.

**API:**
```
GET /api/v1/appointments/?patient_id={id}&sort=appointment_start_desc&page_size=50
```

#### Appointment Row

```
┌──────────────────────────────────────────────────────────────────────┐
│  APT-20260402-007  ·  2 Apr 2026 · 09:30 AM  ·  30 min              │
│  General Consultation  ·  Dr. Sarah Smith  ·  ● Completed           │
│  [Standard]                                      [View Details]  [⋮]│
└──────────────────────────────────────────────────────────────────────┘
```

| Field | Content |
|---|---|
| Appointment number | Monospace, first line |
| Date & time | "2 Apr 2026 · 09:30 AM" |
| Duration | "30 min" |
| Service | Service name, bold |
| Provider | "Dr. Sarah Smith" |
| Status | Status badge — color coded |
| Priority | Badge — only shown for Urgent and Emergency |
| Actions | "View Details" (opens appointment detail drawer) · ⋮ (Cancel, Reschedule — if status allows) |

**Clicking a row:** Expands inline to show additional detail (appointment notes, from waitlist flag, check-in time, completion time). Click again to collapse.

#### Expanded Row Detail

```
  Notes:          No notes
  Checked In:     09:28 AM by Jane Smith (Receptionist)
  Completed:      10:02 AM by Dr. Sarah Smith (Provider)
  From Waitlist:  No
  Booked By:      Jane Smith (Receptionist) on 1 Apr 2026
```

---

### Tab 4C — Waitlist

**Component: `<WaitlistTab />`**

Shows all waitlist entries for this patient — current and historical.

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Waitlist History (2)                     [+ Add to Waitlist]   │
├─────────────────────────────────────────────────────────────────┤
│  ACTIVE (1)                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  #3 in queue · ECG Test · Any Provider                  │    │
│  │  Priority: Urgent · Waiting since: 2 Apr 2026 09:00 AM  │    │
│  │  Est. wait: ~45 min                                     │    │
│  │  [Cancel Entry]                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  PAST (1)  [collapsed]                                          │
│  Assigned: 29 Mar · Blood Test → APT-20260329-004              │
└─────────────────────────────────────────────────────────────────┘
```

**Active entries** — always expanded. Shows:
- Queue position within priority tier (#3)
- Service name
- Preferred provider or "Any Provider"
- Priority badge
- Waiting since (timestamp + "X hours ago")
- Estimated wait time
- "Cancel Entry" button → fires `DELETE /api/v1/waitlist/{id}` with inline confirmation popover

**Past entries (assigned / cancelled / expired)** — collapsed by default, expandable.

**"＋ Add to Waitlist" button** — opens the Add to Waitlist modal pre-filled with this patient.

**API:**
```
GET /api/v1/waitlist/?patient_id={id}&sort=created_at_desc
```
> **Backend note:** `patient_id` filter on `GET /api/v1/waitlist/` needs to be supported. See §10.4.

---

### Tab 4D — Notifications

**Component: `<NotificationsTab />`**

A complete log of every notification sent (or attempted, or skipped) to this patient. Critical for debugging delivery issues and verifying HIPAA-compliant communication records.

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Notification Log                     [Channel: All ▼] [Type ▼] │
├─────────────────────────────────────────────────────────────────┤
│  Channel    Type              Status      Sent At              │
│  ─────────────────────────────────────────────────────────────  │
│  Email      Confirmation      ✓ Sent      2 Apr 09:12 AM       │
│  Email      Reminder (24h)   ✓ Sent      4 Apr 10:30 AM       │
│  Email      Reminder (2h)    ✗ Failed    5 Apr 08:00 AM       │
│  SMS        Confirmation      ↷ Skipped   2 Apr 09:12 AM       │
│  Email      No-Show Follow   ✓ Sent      3 Mar 04:00 PM       │
└─────────────────────────────────────────────────────────────────┘
```

#### Filter Controls

**Channel filter:** All / Email / SMS

**Type filter:** All / Confirmation / Reminder 24h / Reminder 2h / Cancellation / Waitlist Assigned / No-Show Follow-Up

#### Notification Row

| Column | Content |
|---|---|
| **Channel** | Email / SMS icon + label |
| **Type** | Human-readable notification type |
| **Status** | ✓ Sent (green) / ✗ Failed (red) / ↷ Skipped (amber) / ⏳ Pending (muted) |
| **Sent At** | Timestamp, relative on hover |
| **Subject** | Email subject line (for email channel only, truncated) |
| **Retry Count** | Only shown if `retry_count > 0`: "Retried 2×" |

**Expandable row detail:** Click a row to expand and show:
```
  Subject:     MediSync Appointment Reminder — 5 April 2026 · 10:30 AM
  Preview:     "Hi John, this is a reminder that you have an appointment..."
  Error:       (if failed) "SMTP connection timeout — retried 3 times"
  Appointment: APT-20260405-012 (link)
```

**Skipped notifications explanation:** If status = `skipped`, show a tooltip: "Skipped because this patient has opted out of notifications." This helps admins explain to patients why they didn't receive reminders.

**"Resend" action (admin-only, failed notifications):** A "Resend" link on `failed` status rows. Opens a confirmation popover: "Resend [notification type] to [email/phone]?" On confirm:
```
POST /api/v1/notifications/{id}/resend
```
> **Backend note:** Resend endpoint to be **created**. See §10.6.

**API:**
```
GET /api/v1/notifications/?recipient_id={patient_id}&recipient_type=patient&sort=created_at_desc&page_size=50
```
> **Backend note:** `recipient_id` + `recipient_type` filter combination must be supported. See §10.7.

---

### Tab 4E — Audit

**Component: `<AuditTab />`**

Immutable chronological log of every change made to this patient's record. Maps directly to the `activity_logs` table filtered by `entity_type = 'patient'` and `entity_id = {patient_id}`.

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Audit Trail                                    [Date Range ▼]  │
├─────────────────────────────────────────────────────────────────┤
│  2 Apr 2026 · 11:30 AM                                          │
│  Updated by Jane Smith (Receptionist)                           │
│  Changed: phone 01711-111111 → 01711-000000                     │
│                                                                 │
│  12 Jan 2025 · 09:14 AM                                         │
│  Created by Jane Smith (Receptionist)                           │
│  Patient record created with name "John Doe"                    │
│                                                                 │
│  3 Mar 2026 · 04:00 PM                                          │
│  Notification opt-out toggled by Admin User (Admin)             │
│  Changed: notification_opt_out false → true                     │
└─────────────────────────────────────────────────────────────────┘
```

**Each entry shows:**
- Timestamp (full date + time)
- Actor name + role in brackets
- Action description (human-readable from `activity_logs.description`)
- Before/after diff if `old_values` and `new_values` are present — render as a small two-column table:
  ```
  Field         Before              After
  phone         01711-111111        01711-000000
  ```

**Date Range filter:** Dropdown presets — Last 7 days / Last 30 days / Last 3 months / All time (default)

**API:**
```
GET /api/v1/activity-logs/?entity_type=patient&entity_id={id}&sort=created_at_desc&page_size=50
```

---

## 5. Create / Edit Patient Drawer

**Component: `<PatientFormDrawer />`** — Right slide-in panel, full height, width 480px.

**Trigger:**
- "＋ New Patient" (page header or list footer) → create mode
- "Edit" button in patient detail header or card ⋮ menu → edit mode

### 5.1 Drawer Header

- Create mode: "New Patient"
- Edit mode: "Edit Patient — [Name]"
- Close (X) button top-right

### 5.2 Form Fields

```
┌──────────────────────────────────────────────────────────────┐
│  PERSONAL INFORMATION                                        │
│  ──────────────────────────────────────────────────────────  │
│  Full Name *            [                               ]   │
│                         e.g. John Doe                       │
│                                                              │
│  Phone                  [                               ]   │
│                         e.g. 01711-000000                   │
│                                                              │
│  Email                  [                               ]   │
│                         Required for appointment reminders  │
│                                                              │
│  Date of Birth          [   DD / MM / YYYY              ]   │
│                                                              │
│  Gender                 [Select ▼]                          │
│                         Male / Female / Other /             │
│                         Prefer not to say                   │
├──────────────────────────────────────────────────────────────┤
│  COMMUNICATION PREFERENCES                                   │
│  ──────────────────────────────────────────────────────────  │
│  Appointment Reminders  [🔔 ON ●──── OFF]                   │
│                         Patient will receive email/SMS      │
│                         reminders for upcoming appointments  │
│                                                              │
│  ⚠ If opt-out is ON, no reminders will be sent regardless   │
│    of appointment priority.                                  │
├──────────────────────────────────────────────────────────────┤
│  [Cancel]                                [Save Patient]      │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Field Specifications

| Field | Type | Required | Validation |
|---|---|---|---|
| Full Name | Text input | Yes | Min 2 chars, max 150 chars |
| Phone | Tel input | No | Digits, spaces, hyphens, `+` allowed. Show formatted preview below. |
| Email | Email input | No | Valid email format. If provided, must be unique — checked against existing patients. |
| Date of Birth | Date picker | No | Max: today (cannot be future). Min: 120 years ago. Shows calculated age in real-time: "(41 years old)" |
| Gender | Select | No | Male / Female / Other / Prefer not to say |
| Notification Opt-Out | Toggle | No | Default: OFF (notifications enabled) |

### 5.4 Duplicate Detection

After the user fills in phone or email, the system checks for existing patients with the same contact info (debounced 500ms after field blur):

```
GET /api/v1/patients/?phone={phone}&page_size=3
GET /api/v1/patients/?email={email}&page_size=3
```

If a match is found, show a warning below the field:

```
⚠ A patient with this phone number already exists:
  John Doe · john@example.com · DOB: 12 Jan 1985
  [View Existing Patient]  [Use Different Number]
```

This prevents duplicate records without blocking the admin — they can proceed if it's genuinely a different patient.

### 5.5 Age Calculation Preview

Below the Date of Birth field, show a live-calculated age:

```
Date of Birth:  [ 12 / 01 / 1985 ]
                → 41 years old
```

Updates in real time as the admin types. If DOB results in an age < 1 year: "X months old". If age > 120: inline error "Date of birth appears invalid."

### 5.6 API — Save

**Create:**
```
POST /api/v1/patients/
Body: {
  "name": "John Doe",
  "phone": "01711-000000",
  "email": "john@example.com",
  "date_of_birth": "1985-01-12",
  "gender": "Male",
  "notification_opt_out": false
}
```

**Update:**
```
PUT /api/v1/patients/{id}
Body: { ...same fields... }
```

### 5.7 On Success

**Create:** Drawer closes. New patient card prepended to the top of the patient list (regardless of sort). Patient auto-selected in the list. Detail panel opens on Profile tab. Toast: "Patient record created — John Doe."

**Edit:** Drawer closes. Patient list card updates in-place with new data. Detail panel header refreshes. Toast: "Patient record updated."

### 5.8 Validation Error Handling

- All validation errors shown inline below the relevant field
- A summary banner at the top of the form if the API returns validation errors: "Please fix the errors below and try again."
- The "Save Patient" button shows a loading spinner while the API call is in-flight and is disabled to prevent double-submission
- Email uniqueness conflict (409): "This email address is already used by another patient record."

---

## 6. Deactivate & Reactivate Patient

**Component: `<DeactivateDialog />`** — Modal, 480px wide.

**Trigger:**
- "Deactivate Patient" from the detail panel header ⋮ menu
- "Deactivate" from the patient card ⋮ menu

> **Note:** MediSync uses soft deletion — `patients.is_active = FALSE`. The patient record, all appointments, all notifications, and the audit trail are fully preserved. Deactivation prevents new appointments from being booked for this patient.

### 6.1 Deactivate Dialog

```
┌──────────────────────────────────────────────────────────────┐
│  Deactivate Patient Record                                   │
│  ──────────────────────────────────────────────────────────  │
│  You are about to deactivate:                                │
│                                                              │
│  John Doe  ·  01711-000000  ·  john@example.com              │
│                                                              │
│  ⚠ This patient has:                                         │
│     · 3 upcoming appointments (will NOT be auto-cancelled)   │
│     · 1 active waitlist entry (will be cancelled)            │
│                                                              │
│  After deactivation:                                         │
│  · New appointments cannot be booked for this patient        │
│  · This patient will not appear in search results by default │
│  · All historical data is preserved                          │
│  · Existing upcoming appointments must be handled manually   │
│                                                              │
│  Reason (optional):                                          │
│  [                                                       ]   │
│  e.g. Transferred to another clinic, deceased, duplicate...  │
│                                                              │
│  [Cancel]                         [Deactivate Patient]       │
└──────────────────────────────────────────────────────────────┘
```

**Impact counts** loaded from already-fetched data in the session:
- Upcoming appointments count: from `AppointmentsTab` data
- Active waitlist entries: from `WaitlistTab` data

**Reason field** — optional but recommended. Stored in the activity log.

**API:**
```
PATCH /api/v1/patients/{id}/deactivate
Body: { "reason": "Transferred to another clinic" }
```
> **Backend note:** A `PATCH /api/v1/patients/{id}/deactivate` endpoint (or `PATCH /api/v1/patients/{id}/activate`) needs to exist. Currently the API has `PATCH /api/v1/patients/{id}/activate`. Verify the deactivate endpoint also exists. See §10.8.

**Side effects on deactivate:**
- Active waitlist entries (`status = waiting`) → set to `cancelled`
- Active upcoming appointments → NOT auto-cancelled (admin must handle manually)
- Activity log entry created with reason

**On success:** Dialog closes. Patient list card style changes to inactive (muted). If "Show inactive" toggle is OFF, card disappears from list. Detail panel shows a prominent "Inactive" banner at the top. Toast: "Patient record deactivated — John Doe."

### 6.2 Reactivate

When viewing an inactive patient (with the "Inactive" filter active), the ⋮ More menu in the detail header shows "Reactivate Patient" instead of Deactivate.

**API:**
```
PATCH /api/v1/patients/{id}/activate
```

No confirmation dialog needed for reactivation — it is a non-destructive action. Show a simple inline confirmation in the menu: "Reactivate John Doe?" with Yes / No buttons.

**On success:** Toast: "Patient record reactivated — John Doe." Patient card transitions back to active style.

---

## 7. Bulk Operations

**Component: `<BulkActionsBar />`** — Appears below the filter controls when 1+ patients are selected in the list.

> **Note:** Bulk selection in the master–detail layout is a secondary interaction. The primary workflow is single-patient selection. Bulk operations are accessed via a "Select" mode toggle.

### 7.1 Select Mode Toggle

A "Select" button in the list header (next to the filter row). Click it enters Select Mode:
- Checkboxes appear on each patient card
- A "Cancel Select" button replaces it to exit Select Mode
- The detail panel is hidden in Select Mode — full width used for the list + action bar

### 7.2 Bulk Action Bar

```
┌──────────────────────────────────────────────────────────────────────────┐
│  3 patients selected     [Select All 1,243]     [Clear]                 │
│  [Toggle Notifications Off]  [Export Selected]  [Deactivate Selected]   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Toggle Notifications Off / On** — bulk toggle `notification_opt_out`. Opens confirmation: "Turn off notifications for 3 patients? They will no longer receive appointment reminders." Fires individual `PATCH` calls in parallel with progress tracking.

**Export Selected** — export only the selected patients' data as CSV. See §7.3.

**Deactivate Selected** — bulk deactivation. Opens a confirmation dialog listing the selected patients. Shows combined impact: "These patients have N total upcoming appointments that will NOT be auto-cancelled."

### 7.3 Export

**Available from:**
- Detail panel header ⋮ menu → "Export Patient Record" (single patient)
- Bulk Actions bar → "Export Selected" (multiple patients)
- Top-level filter area → "Export All" (all matching current filters)

**Export formats:**

**CSV — Patient List:**
- Columns: Patient ID, Name, Phone, Email, Date of Birth, Gender, Notifications, Status, Created Date, Last Updated, Total Appointments, Last Visit
- Filename: `medisync-patients-YYYY-MM-DD.csv`

**PDF — Individual Patient Record:**
- Formatted report: Profile section + Appointment history table + Notification summary
- Header: clinic name + patient name + generated date
- Suitable for physical file or secure email attachment
- Filename: `medisync-patient-{name}-YYYY-MM-DD.pdf`

**API — Export:**
```
GET /api/v1/patients/export?format=csv&patient_ids=id1,id2,id3   ← selected
GET /api/v1/patients/export?format=csv&is_active=true&...filters  ← all matching
GET /api/v1/patients/{id}/export?format=pdf                        ← single PDF
```
> **Backend note:** Export endpoints to be **created**. See §10.5.

---

## 8. Data Fetching & State Management

### 8.1 On Page Mount (Parallel)

```typescript
await Promise.all([
  GET /api/v1/patients/?is_active=true&sort=name_asc&page=1&page_size=30,
]);
// No other data needed at mount — everything else is loaded on demand
```

The patient list is the only data loaded on mount. All detail data is loaded when a patient is selected.

### 8.2 On Patient Selection (Parallel)

```typescript
await Promise.all([
  GET /api/v1/patients/{id},                              // profile
  GET /api/v1/patients/{id}/stats,                        // quick stats for header
  GET /api/v1/appointments/?patient_id={id}&page_size=50, // appointment history
]);
// Waitlist, Notifications, and Audit are lazy-loaded when their tab is first clicked
```

### 8.3 Lazy Tab Loading

Three tabs load data only when first activated:

| Tab | Trigger | API |
|---|---|---|
| Waitlist | First click on Waitlist tab | `GET /api/v1/waitlist/?patient_id={id}` |
| Notifications | First click on Notifications tab | `GET /api/v1/notifications/?recipient_id={id}&recipient_type=patient` |
| Audit | First click on Audit tab | `GET /api/v1/activity-logs/?entity_type=patient&entity_id={id}` |

Once loaded, data is cached for the duration of the session. A "Refresh" icon button appears in each of these tab headers to force a reload.

### 8.4 State Structure

```typescript
interface PatientsPageState {
  // List
  patients: Patient[];
  totalCount: number;
  listPage: number;
  hasNextPage: boolean;
  listLoading: boolean;
  filters: {
    search: string;
    isActive: boolean | null;   // null = all
    sort: string;
    notificationOptOut: boolean;
    hasUpcoming: boolean;
  };

  // Selection
  selectedPatientId: string | null;
  selectMode: boolean;
  selectedIds: Set<string>;

  // Detail
  selectedPatient: Patient | null;
  patientStats: PatientStats | null;
  appointments: Appointment[];
  waitlistEntries: WaitlistEntry[];
  notifications: Notification[];
  auditLogs: ActivityLog[];

  // Tab lazy-load state
  waitlistLoaded: boolean;
  notificationsLoaded: boolean;
  auditLoaded: boolean;

  // Active tab
  activeTab: 'profile' | 'appointments' | 'waitlist' | 'notifications' | 'audit';
}
```

### 8.5 Optimistic Updates

| Operation | Optimistic Behaviour |
|---|---|
| Toggle notification opt-out (profile tab toggle) | Update `notification_opt_out` in local patient state immediately |
| Cancel waitlist entry | Remove from waitlist list immediately |
| Deactivate patient | Update `is_active` in local patient state immediately; remove from list if filter = active |
| Reactivate patient | Update `is_active` immediately |

Do NOT optimistically update create or edit operations — wait for API response with assigned ID and updated timestamps.

---

## 9. UI State Standards

### 9.1 Loading States

| Component | Skeleton |
|---|---|
| Patient List | 8 skeleton cards (height ~90px each) |
| Patient detail header | Avatar circle skeleton + 3 text line skeletons + 2 button skeletons |
| Profile tab | Two section skeletons with field label + value pairs |
| Appointments tab | 4 skeleton rows with varying width content |
| Waitlist tab | 1 active card skeleton + collapsed past section |
| Notifications tab | 5 skeleton table rows |
| Audit tab | 3 skeleton timeline entries |

### 9.2 Empty States

| Component | Message | CTA |
|---|---|---|
| Patient list — no patients | "No patient records yet." | "+ New Patient" |
| Patient list — no search results | "No patients found for '[query]'." | "+ Create New Patient" |
| Patient list — filtered, no results | "No patients match your filters." | "Clear Filters" |
| Appointments tab — no appointments | "No appointments on record for this patient." | "+ Book Appointment" |
| Appointments tab — no upcoming | "No upcoming appointments." | "+ Book Appointment" |
| Waitlist tab — no entries | "This patient is not on any waitlist." | "+ Add to Waitlist" |
| Notifications tab — no notifications | "No notifications sent to this patient yet." | None |
| Audit tab — no log entries | "No audit entries for this patient." | None |

### 9.3 Error States

| Scenario | Response |
|---|---|
| Patient list load fails | Inline error banner with Retry button inside the list panel |
| Patient detail load fails | Error banner in the right panel with Retry button |
| Save fails (create/edit) | Drawer stays open. Error banner at top of form. Field-level errors inline. |
| Duplicate email (409) | Inline field error: "This email is already linked to another patient." |
| Deactivate fails | Dialog stays open. Error message inside dialog. |
| Notification resend fails | Toast error: "Failed to resend — check the notification log for details." |
| Export fails | Toast error: "Export failed — try again." |

### 9.4 Toast Notifications

| Action | Toast |
|---|---|
| Patient created | "Patient record created — John Doe" |
| Patient updated | "Patient record updated — John Doe" |
| Patient deactivated | "John Doe has been deactivated" |
| Patient reactivated | "John Doe has been reactivated" |
| Notification opt-out toggled ON | "Notifications disabled for John Doe" |
| Notification opt-out toggled OFF | "Notifications enabled for John Doe" |
| Waitlist entry cancelled | "Removed from waitlist — ECG Test" |
| Notification resent | "Notification resent to john@example.com" |
| Export started | "Preparing export... download will begin shortly" |
| Bulk deactivate complete | "Deactivated [N] patient records" |
| Bulk notification toggle | "Notifications updated for [N] patients" |
| Any API failure | "Action failed — [reason]. Try again." |

---

## 10. Required Backend Endpoints

---

### 10.1 GET patients — extended filter params

**Extend existing endpoint:**
```
GET /api/v1/patients/
```

Ensure all these query params are supported:
- `search` — partial match on `name`, `phone`, `email`
- `is_active` — boolean filter (`true` / `false` / omit for all)
- `notification_opt_out` — boolean filter
- `has_upcoming` — boolean. Filter to patients with at least one `scheduled` appointment in the future. Requires subquery: `WHERE id IN (SELECT patient_id FROM appointments WHERE status = 'scheduled' AND appointment_start > NOW())`
- `sort` — values: `name_asc`, `name_desc`, `created_at_desc`, `created_at_asc`, `last_visit_desc`. The `last_visit_desc` sort requires joining to `appointments` and sorting by `MAX(appointment_start) WHERE status = 'completed'`
- `page` · `page_size` — pagination
- `phone` — exact match (for duplicate detection during create)
- `email` — exact/partial match (for duplicate detection)

---

### 10.2 GET patient detail with total_appointments_count

**Extend existing endpoint:**
```
GET /api/v1/patients/{id}
```

Add `total_appointments_count` as an aggregated field in the response:
```json
{
  "id": "uuid",
  "name": "John Doe",
  "phone": "01711-000000",
  "email": "john@example.com",
  "date_of_birth": "1985-01-12",
  "gender": "Male",
  "notification_opt_out": false,
  "is_active": true,
  "created_at": "...",
  "updated_at": "...",
  "total_appointments_count": 14
}
```

Server-side: `SELECT COUNT(*) FROM appointments WHERE patient_id = $1`.

---

### 10.3 GET patient stats

**Endpoint to create:**
```
GET /api/v1/patients/{id}/stats
```

**Response:**
```json
{
  "total_appointments": 14,
  "completed": 11,
  "cancelled": 2,
  "no_show": 1,
  "no_show_rate_percent": 7.1,
  "last_visit": {
    "date": "2026-04-02",
    "service_name": "General Consultation",
    "provider_name": "Dr. Sarah Smith"
  },
  "next_appointment": {
    "date": "2026-04-05",
    "time": "10:30",
    "service_name": "ECG Test",
    "appointment_number": "APT-20260405-003"
  }
}
```

Server-side: aggregate queries on `appointments WHERE patient_id = $1`.

---

### 10.4 GET waitlist — patient_id filter

**Extend existing endpoint:**
```
GET /api/v1/waitlist/?patient_id={uuid}&sort=created_at_desc
```

Add `patient_id` as a supported filter param. Currently the waitlist endpoint likely only supports `service_id`, `status`, and `priority` filters.

---

### 10.5 GET export patients

**Endpoint to create:**
```
GET /api/v1/patients/export?format=csv&is_active=true&...other_filters
GET /api/v1/patients/export?format=csv&patient_ids=id1,id2,id3
GET /api/v1/patients/{id}/export?format=pdf
```

**CSV:** Stream a CSV file with patient demographic fields + appointment summary counts.

**PDF (single patient):** A formatted patient record report. Use a server-side PDF library (WeasyPrint, ReportLab, or equivalent). Include: patient info section, appointment history table, notification delivery summary.

**Response headers:**
```
Content-Type: text/csv  or  application/pdf
Content-Disposition: attachment; filename="medisync-patients-2026-04-02.csv"
```

---

### 10.6 POST resend notification

**Endpoint to create:**
```
POST /api/v1/notifications/{id}/resend
Response: { "id": "uuid", "status": "pending", "retry_count": 1 }
```

Server-side: reset `status = 'pending'`, increment `retry_count`, re-queue the notification for sending. Check `patients.notification_opt_out` before resending — if opt-out is now true, set status to `skipped` instead.

---

### 10.7 GET notifications — recipient filter

**Extend existing endpoint:**
```
GET /api/v1/notifications/?recipient_id={uuid}&recipient_type=patient&sort=created_at_desc&page_size=50
```

Ensure `recipient_id` + `recipient_type` combination is supported as a filter. Also support `channel` (email/sms) and `type` (confirmation, reminder_24h, etc.) filters for the tab's filter controls.

---

### 10.8 PATCH patient deactivate

**Verify or create:**
```
PATCH /api/v1/patients/{id}/deactivate
Body: { "reason": "optional reason string" }
Response: { ...updated patient object with is_active: false... }
```

Side effects server-side:
- Set `patients.is_active = FALSE`
- Set `patients.updated_at = NOW()`
- Cancel active waitlist entries: `UPDATE waitlist SET status = 'cancelled' WHERE patient_id = $1 AND status = 'waiting'`
- Log to `activity_logs` with `action_type = 'deactivate_patient'`, `description` including the reason if provided

The existing `PATCH /api/v1/patients/{id}/activate` endpoint handles reactivation — verify it exists and sets `is_active = TRUE`.

---

### 10.9 PATCH patient — partial update

**Verify or create:**
```
PATCH /api/v1/patients/{id}
Body: { "notification_opt_out": true }   ← only the fields being changed
```

The toggle in the Profile tab fires a `PATCH` with only the single changed field — not a full `PUT` with all fields. This prevents accidentally overwriting data. Verify the existing API supports partial updates via `PATCH`. If only `PUT` exists, either add a `PATCH` endpoint or ensure the frontend always sends the full patient object on toggle.

---

## 11. API Quick Reference

| # | Method | Endpoint | Status | Used In |
|---|---|---|---|---|
| 1 | GET | `/api/v1/patients/` | ✅ Extend (add sort, has_upcoming, notification_opt_out filters per §10.1) | Patient list |
| 2 | POST | `/api/v1/patients/` | ✅ Yes | Create Patient drawer |
| 3 | GET | `/api/v1/patients/{id}` | ✅ Extend (add total_appointments_count per §10.2) | Detail panel header, Profile tab |
| 4 | PUT | `/api/v1/patients/{id}` | ✅ Yes | Edit Patient drawer |
| 5 | PATCH | `/api/v1/patients/{id}` | ✅ Verify (partial update per §10.9) | Notification opt-out toggle |
| 6 | PATCH | `/api/v1/patients/{id}/activate` | ✅ Yes | Reactivate patient |
| 7 | PATCH | `/api/v1/patients/{id}/deactivate` | ✅ Verify / Create (per §10.8) | Deactivate dialog |
| 8 | GET | `/api/v1/patients/{id}/stats` | ⚠️ **Create** (per §10.3) | Profile tab quick stats |
| 9 | GET | `/api/v1/patients/export` | ⚠️ **Create** (per §10.5) | Bulk export CSV |
| 10 | GET | `/api/v1/patients/{id}/export` | ⚠️ **Create** (per §10.5) | Single patient PDF export |
| 11 | GET | `/api/v1/appointments/` | ✅ Extend (ensure `patient_id` filter supported) | Appointments tab |
| 12 | GET | `/api/v1/waitlist/` | ✅ Extend (add `patient_id` filter per §10.4) | Waitlist tab |
| 13 | DELETE | `/api/v1/waitlist/{id}` | ✅ Yes | Cancel waitlist entry |
| 14 | GET | `/api/v1/notifications/` | ✅ Extend (add recipient_id + recipient_type filter per §10.7) | Notifications tab |
| 15 | POST | `/api/v1/notifications/{id}/resend` | ⚠️ **Create** (per §10.6) | Notification resend action |
| 16 | GET | `/api/v1/activity-logs/` | ✅ Yes (verify entity_type + entity_id filter supported) | Audit tab |

**Legend:**
- ✅ Yes = endpoint exists and works as-is
- ✅ Extend = endpoint exists but needs new filter params or response fields
- ✅ Verify = endpoint may exist but needs confirmation of specific behaviour
- ⚠️ Create = endpoint must be built before that feature can be integrated

---

*MediSync Admin Patients Page Frontend Spec — Version 1.0 — April 2026 — Internal Use Only*