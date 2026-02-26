# MediSync — Database Schema Reference
**Version:** 1.0 | **Database:** PostgreSQL | **Updated:** February 2026

> **Conventions:**
> - All UUID PKs use `gen_random_uuid()` as default
> - All timestamps use `TIMESTAMPTZ` (timezone-aware)
> - Soft deletion preferred over hard `DELETE` for auditing
> - `[PK]` Primary Key | `[FK]` Foreign Key | `[UQ]` Unique | `[NN]` Not Null | `[IDX]` Indexed

---

## Table of Contents

1. [Users & Access Control](#1-users--access-control)
   - [roles](#roles)
   - [permissions](#permissions)
   - [role_permissions](#role_permissions)
   - [users](#users)
2. [Patients](#2-patients)
   - [patients](#patients)
3. [Specializations & Services](#3-specializations--services)
   - [specializations](#specializations)
   - [services](#services)
4. [Providers](#4-providers)
   - [providers](#providers)
   - [provider_services](#provider_services)
   - [availability](#availability)
   - [provider_time_off](#provider_time_off)
5. [Appointments](#5-appointments)
   - [appointments](#appointments)
6. [Waitlist & Queue](#6-waitlist--queue)
   - [waitlist](#waitlist)
7. [Notifications](#7-notifications)
   - [notifications](#notifications)
8. [Audit & Activity Log](#8-audit--activity-log)
   - [activity_logs](#activity_logs)
9. [Indexes](#9-recommended-indexes)

---

## 1. Users & Access Control

### `roles`
> Defines access levels within the system. Seeded at setup time.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` [PK] | `SERIAL` | NOT NULL | — | Auto-increment integer PK |
| `name` [UQ][NN] | `VARCHAR(50)` | NOT NULL | — | e.g. `admin`, `receptionist`, `provider` |
| `description` | `TEXT` | NULL | — | Human-readable role description |

---

### `permissions`
> Granular permission definitions (action + resource pairs).

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` [PK] | `SERIAL` | NOT NULL | — | Auto-increment PK |
| `name` [UQ][NN] | `VARCHAR(100)` | NOT NULL | — | e.g. `appointments.create`, `providers.edit` |
| `description` | `TEXT` | NULL | — | Human-readable permission description |

---

### `role_permissions`
> Many-to-many join table between roles and permissions. Enables full RBAC.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `role_id` [FK][NN] | `INTEGER` | NOT NULL | — | FK → `roles.id` |
| `permission_id` [FK][NN] | `INTEGER` | NOT NULL | — | FK → `permissions.id` |

> **Note:** Composite PK on `(role_id, permission_id)`. Seed this table during initial deployment.

---

### `users`
> All authenticated system users (admins, receptionists, providers). Created via admin dashboard only.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` [PK] | `UUID` | NOT NULL | `gen_random_uuid()` | Primary key |
| `name` [NN] | `VARCHAR(150)` | NOT NULL | — | Full name |
| `email` [UQ][NN] | `VARCHAR(255)` | NOT NULL | — | Login email; must be unique |
| `password_hash` [NN] | `VARCHAR(255)` | NOT NULL | — | bcrypt hashed password |
| `role_id` [FK][NN] | `INTEGER` | NOT NULL | — | FK → `roles.id` |
| `is_active` | `BOOLEAN` | NOT NULL | `TRUE` | Soft deactivation flag |
| `last_login_at` | `TIMESTAMPTZ` | NULL | — | Used for session timeout logic |
| `failed_login_attempts` | `SMALLINT` | NOT NULL | `0` | Brute-force protection counter |
| `locked_until` | `TIMESTAMPTZ` | NULL | — | Account lock expiry timestamp |
| `password_reset_token` | `VARCHAR(255)` | NULL | — | Hashed reset token |
| `password_reset_expires` | `TIMESTAMPTZ` | NULL | — | Reset token expiry |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | Last update timestamp |

---

## 2. Patients

### `patients`
> Stores patient demographic and contact information. Managed by front-desk staff.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` [PK] | `UUID` | NOT NULL | `gen_random_uuid()` | Primary key |
| `name` [NN] | `VARCHAR(150)` | NOT NULL | — | Full name |
| `phone` [IDX] | `VARCHAR(20)` | NULL | — | Primary contact number |
| `email` [UQ] | `VARCHAR(255)` | NULL | — | Email — required for notification opt-in |
| `date_of_birth` | `DATE` | NULL | — | DOB; use to derive age dynamically |
| `gender` | `VARCHAR(20)` | NULL | — | e.g. `Male`, `Female`, `Other`, `Prefer not to say` |
| `notification_opt_out` | `BOOLEAN` | NOT NULL | `FALSE` | `TRUE` = do not send reminders or notifications |
| `is_active` | `BOOLEAN` | NOT NULL | `TRUE` | Soft delete flag |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | Last update timestamp |


---

## 3. Specializations & Services

### `specializations`
> Lookup table for clinical specializations. Referenced by providers and services.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` [PK] | `SERIAL` | NOT NULL | — | Auto-increment PK |
| `name` [UQ][NN] | `VARCHAR(100)` | NOT NULL | — | e.g. `Cardiology`, `General Practice` |
| `description` | `TEXT` | NULL | — | Optional details about the specialization |

---

### `services`
> Catalog of billable clinical services offered by the facility.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` [PK] | `UUID` | NOT NULL | `gen_random_uuid()` | Primary key |
| `name` [NN] | `VARCHAR(150)` | NOT NULL | — | Service display name e.g. `General Consultation` |
| `description` | `TEXT` | NULL | — | Extended service description |
| `category` | `VARCHAR(100)` | NULL | — | Grouping label e.g. `Diagnostics`, `Therapy` |
| `duration_minutes` [NN] | `SMALLINT` | NOT NULL | — | Net appointment duration (excluding buffers) |
| `buffer_time_minutes` | `SMALLINT` | NOT NULL | `0` | Prep + cleanup time added after each appointment |
| `required_specialization_id` [FK] | `INTEGER` | NULL | — | FK → `specializations.id` |
| `fee` | `NUMERIC(10,2)` | NULL | — | Base consultation/service fee |
| `billing_code` | `VARCHAR(50)` | NULL | — | External billing/insurance code |
| `is_active` | `BOOLEAN` | NOT NULL | `TRUE` | Inactive services cannot be booked |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |

> **Note:** Total slot duration = `duration_minutes + buffer_time_minutes`. Conflict detection must account for the buffer, not just the appointment end time.

---

## 4. Providers

### `providers`
> Extends the `users` table with clinical attributes. One row per provider user.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` [PK][FK] | `UUID` | NOT NULL | — | PK and FK → `users.id` (1-to-1 extension) |
| `specialization_id` [FK][NN] | `INTEGER` | NOT NULL | — | FK → `specializations.id` |
| `consultation_fee` | `NUMERIC(10,2)` | NULL | — | Default fee; can be overridden per service |
| `emergency_enabled` | `BOOLEAN` | NOT NULL | `FALSE` | Provider accepts emergency/urgent cases |
| `max_daily_appointments` [NN] | `SMALLINT` | NOT NULL | `8` | Overbooking cap — configurable per provider |
| `status` [IDX] | `VARCHAR(20)` | NOT NULL | `'available'` | `available` \| `on_leave` \| `busy` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |

---

### `provider_services`
> Many-to-many: which services each provider can deliver.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `provider_id` [FK][NN] | `UUID` | NOT NULL | — | FK → `providers.id` |
| `service_id` [FK][NN] | `UUID` | NOT NULL | — | FK → `services.id` |

> **Note:** Composite PK on `(provider_id, service_id)`. When booking, filter providers by `service_id` to show only eligible providers.

---

### `availability`
> Recurring weekly schedule for each provider. Drives slot generation.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` [PK] | `SERIAL` | NOT NULL | — | Auto-increment PK |
| `provider_id` [FK][NN] | `UUID` | NOT NULL | — | FK → `providers.id` |
| `day_of_week` [NN] | `SMALLINT` | NOT NULL | — | `0` = Sunday … `6` = Saturday |
| `start_time` [NN] | `TIME` | NOT NULL | — | Working day start time |
| `end_time` [NN] | `TIME` | NOT NULL | — | Working day end time |
| `break_start` | `TIME` | NULL | — | Break period start (`NULL` = no break) |
| `break_end` | `TIME` | NULL | — | Break period end |
| `is_working_day` | `BOOLEAN` | NOT NULL | `TRUE` | `FALSE` for regular days off |
| `notes` | `VARCHAR(200)` | NULL | — | e.g. `Half day`, `Clinic B only` |

---

### `provider_time_off`
> Ad-hoc leave periods that override the recurring availability schedule.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` [PK] | `SERIAL` | NOT NULL | — | Auto-increment PK |
| `provider_id` [FK][NN] | `UUID` | NOT NULL | — | FK → `providers.id` |
| `start_date` [NN] | `DATE` | NOT NULL | — | First day of leave |
| `end_date` [NN] | `DATE` | NOT NULL | — | Last day of leave (inclusive) |
| `start_time` | `TIME` | NULL | — | Partial-day leave start; `NULL` = full day from availability start |
| `end_time` | `TIME` | NULL | — | Partial-day leave end; `NULL` = full day until availability end |
| `reason` | `VARCHAR(255)` | NULL | — | e.g. `Annual Leave`, `Sick`, `Conference` |
| `approved_by` [FK] | `UUID` | NULL | — | FK → `users.id` — admin who approved the leave |
| `is_approved` | `BOOLEAN` | NOT NULL | `FALSE` | Approval workflow flag |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |

> **Note:** When building available slots, query `availability` first, then subtract any `provider_time_off` ranges for the requested date. `start_time` / `end_time` default to the provider's `availability.start_time` / `end_time` respectively — handled in application code, not a DB default.

---

## 5. Appointments

### `appointments`
> Core transactional table. Each row is a confirmed or historical appointment slot.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` [PK] | `UUID` | NOT NULL | `gen_random_uuid()` | Primary key |
| `appointment_number` [UQ][IDX] | `VARCHAR(30)` | NOT NULL | — | Human-readable: `APT-YYYYMMDD-NNN`; generated by app |
| `patient_id` [FK][NN] | `UUID` | NOT NULL | — | FK → `patients.id` |
| `provider_id` [FK][NN] | `UUID` | NOT NULL | — | FK → `providers.id` |
| `service_id` [FK][NN] | `UUID` | NOT NULL | — | FK → `services.id` |
| `appointment_start` [NN][IDX] | `TIMESTAMPTZ` | NOT NULL | — | Timezone-aware start datetime |
| `appointment_end` [NN] | `TIMESTAMPTZ` | NOT NULL | — | `= start + duration_minutes`; stored for fast conflict queries |
| `notes` | `TEXT` | NULL | — | Special instructions or clinical notes |
| `status` [NN][IDX] | `VARCHAR(20)` | NOT NULL | `'scheduled'` | `scheduled` \| `checked_in` \| `in_progress` \| `completed` \| `cancelled` \| `no_show` |
| `priority` [NN] | `VARCHAR(20)` | NOT NULL | `'standard'` | `standard` \| `urgent` \| `emergency` |
| `cancellation_reason` | `TEXT` | NULL | — | Required when `status = cancelled` |
| `checked_in_at` | `TIMESTAMPTZ` | NULL | — | Timestamp of check-in action |
| `completed_at` | `TIMESTAMPTZ` | NULL | — | Timestamp of checkout/completion |
| `reminder_24h_sent_at` | `TIMESTAMPTZ` | NULL | — | Prevents duplicate 24-hour reminder sends |
| `reminder_2h_sent_at` | `TIMESTAMPTZ` | NULL | — | Prevents duplicate 2-hour reminder sends |
| `assigned_from_waitlist` | `BOOLEAN` | NOT NULL | `FALSE` | `TRUE` if promoted from the waitlist |
| `created_by` [FK][NN] | `UUID` | NOT NULL | — | FK → `users.id` — staff member who created the booking |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |

> **Note:** Conflict detection query:
> ```sql
> SELECT 1 FROM appointments
> WHERE provider_id = $1
>   AND status NOT IN ('cancelled', 'no_show')
>   AND appointment_start < $end
>   AND appointment_end > $start;
> ```
> Store `appointment_end` explicitly to avoid joining `services` on every conflict check.

---

## 6. Waitlist & Queue

### `waitlist`
> Holds patients waiting for an available slot. Separate from `appointments` — a waitlist entry has no confirmed time yet.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` [PK] | `UUID` | NOT NULL | `gen_random_uuid()` | Primary key |
| `patient_id` [FK][NN] | `UUID` | NOT NULL | — | FK → `patients.id` |
| `service_id` [FK][NN] | `UUID` | NOT NULL | — | FK → `services.id` |
| `provider_id` [FK] | `UUID` | NULL | — | FK → `providers.id`; `NULL` = any available provider |
| `requested_date` | `DATE` | NULL | — | Preferred date; `NULL` = first available |
| `priority` [NN][IDX] | `VARCHAR(20)` | NOT NULL | `'standard'` | `standard` \| `urgent` \| `emergency` |
| `queue_position` [IDX] | `SMALLINT` | NULL | — | Relative position within same priority tier |
| `status` [NN][IDX] | `VARCHAR(20)` | NOT NULL | `'waiting'` | `waiting` \| `assigned` \| `cancelled` \| `expired` |
| `assigned_appointment_id` [FK] | `UUID` | NULL | — | FK → `appointments.id`; populated when assigned |
| `notes` | `TEXT` | NULL | — | Reason for visit or special instructions |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | Used to calculate wait duration |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |

> **Note:** Queue ordering: `ORDER BY priority DESC, queue_position ASC, created_at ASC`. When a provider slot opens, query for `waiting` entries matching `service_id` (and `provider_id` if specified), then promote the top entry. Recalculate `queue_position` after each assignment or cancellation.

---

## 7. Notifications

### `notifications`
> Tracks every outbound notification. Powers delivery status, retry logic, and opt-out enforcement.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` [PK] | `UUID` | NOT NULL | `gen_random_uuid()` | Primary key |
| `recipient_type` [NN] | `VARCHAR(20)` | NOT NULL | — | `patient` \| `user` |
| `recipient_id` [FK][NN] | `UUID` | NOT NULL | — | FK → `patients.id` or `users.id` depending on `recipient_type` |
| `appointment_id` [FK] | `UUID` | NULL | — | FK → `appointments.id`; `NULL` for non-appointment notifications |
| `waitlist_id` [FK] | `UUID` | NULL | — | FK → `waitlist.id`; populated for waitlist notifications |
| `channel` [NN] | `VARCHAR(10)` | NOT NULL | — | `email` \| `sms` |
| `type` [NN][IDX] | `VARCHAR(50)` | NOT NULL | — | `confirmation` \| `reminder_24h` \| `reminder_2h` \| `cancellation` \| `waitlist_assigned` \| `no_show_followup` |
| `status` [NN][IDX] | `VARCHAR(20)` | NOT NULL | `'pending'` | `pending` \| `sent` \| `failed` \| `skipped` |
| `subject` | `VARCHAR(255)` | NULL | — | Email subject line |
| `body_preview` | `TEXT` | NULL | — | First 500 chars of message for logging |
| `sent_at` | `TIMESTAMPTZ` | NULL | — | Actual delivery timestamp |
| `retry_count` | `SMALLINT` | NOT NULL | `0` | Number of send attempts |
| `error_message` | `TEXT` | NULL | — | Last error on failure |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |

> **Note:** Before sending a reminder, check `patients.notification_opt_out = TRUE` — if so, insert with `status = 'skipped'`. Use `appointments.reminder_24h_sent_at` and `reminder_2h_sent_at` to prevent duplicate sends across retries.

---

## 8. Audit & Activity Log

### `activity_logs`
> Immutable append-only audit trail. Never update or delete rows in this table.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` [PK] | `BIGSERIAL` | NOT NULL | — | Auto-increment for insert ordering |
| `user_id` [FK] | `UUID` | NULL | — | FK → `users.id`; `NULL` for system-generated actions |
| `action_type` [NN][IDX] | `VARCHAR(60)` | NOT NULL | — | `create_appointment` \| `cancel_appointment` \| `assign_waitlist` \| `login` \| `logout` \| `update_provider` \| `update_schedule` \| `password_reset` etc. |
| `entity_type` [NN] | `VARCHAR(50)` | NOT NULL | — | `appointment` \| `provider` \| `waitlist` \| `user` \| `service` \| `patient` |
| `entity_id` [IDX] | `VARCHAR(50)` | NULL | — | `VARCHAR` to support both UUID and `SERIAL` PKs |
| `description` | `TEXT` | NULL | — | Human-readable log message |
| `old_values` | `JSONB` | NULL | — | Snapshot of changed fields before update |
| `new_values` | `JSONB` | NULL | — | Snapshot of changed fields after update |
| `ip_address` | `VARCHAR(45)` | NULL | — | Client IP (supports IPv6) |
| `created_at` [IDX] | `TIMESTAMPTZ` | NOT NULL | `NOW()` | Index required for date-range filter queries |

> **Note:** `entity_id` is `VARCHAR(50)` rather than `UUID` to accommodate both UUID-keyed and `SERIAL`-keyed tables (e.g. `roles`, `specializations`). `old_values` / `new_values` JSONB columns enable full before/after diff without a separate audit table. Never grant `UPDATE` or `DELETE` permissions on this table to the application DB role.

---

## 9. Recommended Indexes

Beyond primary key indexes, create the following for query performance:

| Table | Columns | Purpose |
|-------|---------|---------|
| `appointments` | `provider_id, appointment_start, appointment_end` | Conflict detection queries |
| `appointments` | `patient_id` | Patient appointment history |
| `appointments` | `status, appointment_start` | Daily dashboard filters |
| `appointments` | `appointment_number` | Human-readable ID lookup |
| `waitlist` | `status, priority, created_at` | Queue ordering queries |
| `waitlist` | `service_id, provider_id` | Slot matching queries |
| `notifications` | `appointment_id, type` | Reminder deduplication |
| `notifications` | `status, created_at` | Retry job queries |
| `activity_logs` | `entity_type, entity_id` | Entity history lookup |
| `activity_logs` | `user_id, created_at` | User activity filtering |
| `users` | `email` | Login lookup (unique index) |
| `patients` | `phone, email` | Patient search |

---

## Entity Relationship Summary

```
roles ──< role_permissions >── permissions
users >── role_id → roles
providers ──── id → users (1:1 extension)
providers >── specialization_id → specializations
providers ──< provider_services >── services
services >── required_specialization_id → specializations
providers ──< availability
providers ──< provider_time_off
appointments >── patient_id → patients
appointments >── provider_id → providers
appointments >── service_id → services
appointments >── created_by → users
waitlist >── patient_id → patients
waitlist >── service_id → services
waitlist >── provider_id → providers (nullable)
waitlist >── assigned_appointment_id → appointments (nullable)
notifications >── appointment_id → appointments (nullable)
notifications >── waitlist_id → waitlist (nullable)
activity_logs >── user_id → users (nullable)
provider_time_off >── approved_by → users (nullable)
```

---

*MediSync Database Schema — Version 1.0 — February 2026 — CONFIDENTIAL*
