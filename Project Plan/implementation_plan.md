# Implementation Plan: Appointment Management System

This document outlines the step-by-step plan to implement the appointment management feature in the MediSync backend, based on the approved system design.

## Goal Description

Build out the full lifecycle of appointments, including creation with conflict detection (checking provider availability, time-off, and overlapping appointments), state transitions (scheduled, checked_in, in_progress, completed, cancelled, no_show), waitlist management with automatic promotion, and real-time WebSocket updates for all state changes.

## Proposed Changes

---
### 1. Database & CRUD Layer Updates

#### [NEW] `c:\Projects\MediSync\backend\app\crud\crud_appointment.py`
- Create `CRUDAppointment` extending `CRUDBase`.
- Implement methods:
  - `get_by_appointment_number`
  - `get_provider_appointments_for_date` (for conflict detection)
  - `get_patient_appointments`
  - `get_appointments_by_date_range`
  - `get_provider_queue`: Retrieve the ordered daily queue for a provider.
  - `get_provider_capacity_metrics`: Calculate utilized vs. max capacity for a date.
  - `create_with_transaction`: Handle the `APT-YYYYMMDD-NNN` number generation safely.

#### [NEW] `c:\Projects\MediSync\backend\app\crud\crud_waitlist.py`
- Create `CRUDWaitlist` extending `CRUDBase`.
- Implement methods:
  - `get_highest_queue_position`: To assign a position to new entries.
  - `get_ordered_waitlist_for_service`: For auto-promotion matching.
  - `recalculate_queue_positions`: Re-index queue positions after an assignment or cancellation.

---
### 2. Service Layer Implementation (Core Logic)

#### [NEW] `c:\Projects\MediSync\backend\app\services\scheduling_service.py`
- Implement provider selection and validation logic:
  - `find_eligible_providers`: Filter by specialization, status, time-off, and availability for a specific service and date.
  - `check_conflicts`: Precise validation incorporating service duration + buffer time against existing appointments, recurring availability, and approved time-off.
  - `select_provider_round_robin`: Assign the provider with the lowest daily utilization.
  - `select_provider_eta`: For emergencies, pick the provider available soonest.

#### [NEW] `c:\Projects\MediSync\backend\app\services\appointment_service.py`
- Implement the core lifecycle operations, wrapped in database transactions:
  - `create_appointment`: Full orchestration (validation -> scheduling service -> DB insert -> WebSocket emit).
  - `update_status`: State machine enforcement. Handle transitions like `scheduled` -> `cancelled` or `no_show`.
  - `handle_cancellation_or_noshow`: Specialized logic that triggers waitlist promotion.
  - `reschedule_appointment`: Atomic cancel + re-book.

#### [NEW] `c:\Projects\MediSync\backend\app\services\waitlist_service.py`
- Implement waitlist management:
  - `add_to_waitlist`: Calculate position and insert.
  - `process_slot_freed_event`: The auto-promotion engine. Find the best matching waitlist entry for a newly available slot and convert it to an appointment.
  - `estimate_wait_time`: Calculate approximate wait based on queue position and average service times.

#### [NEW] `c:\Projects\MediSync\backend\app\services\websocket_manager.py`
- Implement a `ConnectionManager` singleton to handle WebSocket connections.
- Support channels: `provider:{id}`, `queue:{id}`, `waitlist:{id}`, and `dashboard:global`.
- Implement `broadcast` and `broadcast_multi` methods.

---
### 3. API Layer (Routers)

#### [NEW] `c:\Projects\MediSync\backend\app\api\v1\appointments.py`
- Implement REST endpoints:
  - `POST /`: Create appointment.
  - `GET /`: List appointments (with filters).
  - `GET /{id}`: Read specific appointment.
  - `PATCH /{id}/status`: Transition status.
  - `GET /providers/{provider_id}/queue`: Fetch daily queue.
  - `GET /providers/{provider_id}/capacity`: Fetch capacity utilization.

#### [NEW] `c:\Projects\MediSync\backend\app\api\v1\waitlist.py`
- Implement REST endpoints:
  - `POST /`: Add to waitlist.
  - `GET /`: List waitlist.
  - `PATCH /{id}`: Update specific entry.
  - `DELETE /{id}`: Remove from waitlist.
  - `GET /estimated-wait`: Get estimated wait time.

#### [NEW] `c:\Projects\MediSync\backend\app\api\v1\websocket.py`
- Implement the WebSocket endpoint `/ws/{channel}` to accept connections and route them to the `ConnectionManager`.

#### [MODIFY] [c:\Projects\MediSync\backend\app\api\v1\router.py](file:///c:/Projects/MediSync/backend/app/api/v1/router.py)
- Register `appointments`, `waitlist`, and `websocket` routers.

---
## Verification Plan

### Automated Tests
To ensure the complex scheduling logic works correctly, I will add pytest test suites in a new `tests` directory (assuming one doesn't exist comprehensively for this feature yet).

1. **Scheduling Logic Tests (`tests/test_scheduling.py`)**:
   - Create mock providers, availability schedules, and time-off entries.
   - Verify that `check_conflicts` correctly identifies:
     - Overlapping appointments (accounting for buffer times).
     - Appointments booked outside availability hours.
     - Appointments booked during approved time-off.
     - Capacity limit violations.
   - Verify `find_eligible_providers` completely filters out unavailable providers.
   - Verify `select_provider_round_robin` correctly balances load.

2. **State Machine Tests (`tests/test_appointment_state.py`)**:
   - Verify valid transitions (e.g., `scheduled` -> `checked_in`).
   - Verify invalid transitions raise appropriate HTTP exceptions.

3. **Waitlist Auto-Promotion Tests (`tests/test_waitlist.py`)**:
   - Create a waitlist entry.
   - Cancel an existing appointment.
   - Verify that the `WaitlistService` correctly intercepts this and promotes the waitlist entry to an appointment, while recalculating positions for others.

*Execution Command:* `pytest tests/ -v`

### Manual Verification
1. Spin up the backend (`docker compose up` or `uvicorn app.main:app --reload`).
2. Use an API client (or provided Swagger UI at `/docs`) to:
   - Create required prerequisites (Service, Specialization, Provider, Patient, Availability).
   - Test the `POST /api/v1/appointments/` endpoint with a valid slot.
   - Test the same slot again to ensure a 400 Conflict response is generated.
   - Connect to the WebSocket endpoint (using a WS client) and verify events are emitted when appointments are created or cancelled.
