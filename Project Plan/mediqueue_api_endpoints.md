# MediSync - API Endpoints Reference
## RESTful API Specification

**Project:** MediSync - Healthcare Appointment Management System  
**API Version:** v1  
**Base URL:** `/api/v1`

---

## Authentication Endpoints

### `POST /auth/register`
Create new user account with email, password, and role

### `POST /auth/login`
Authenticate user and return JWT token

### `POST /auth/logout`
Invalidate current session token

### `POST /auth/forgot-password`
Send password reset link to user's email

### `POST /auth/reset-password`
Reset password using token from email

### `GET /auth/me`
Get currently authenticated user details

### `PUT /auth/change-password`
Change password for authenticated user

---

## User Management Endpoints (Admin Only)

### `GET /users`
Get list of all users with pagination and filters

### `GET /users/:id`
Get single user details by ID

### `POST /users`
Create new user (admin/receptionist/provider)

### `PUT /users/:id`
Update user information and role

### `DELETE /users/:id`
Deactivate user account (soft delete)

### `PATCH /users/:id/activate`
Activate deactivated user account

### `PATCH /users/:id/deactivate`
Deactivate active user account

---

## Provider Management Endpoints

### `GET /providers`
Get list of all providers with filters (specialization, availability)

### `GET /providers/:id`
Get single provider details with statistics

### `POST /providers`
Create new provider profile

### `PUT /providers/:id`
Update provider information and settings

### `DELETE /providers/:id`
Delete provider (only if no active appointments)

### `PATCH /providers/:id/availability`
Update provider availability status (available/on_leave/busy)

### `GET /providers/:id/appointments`
Get all appointments for specific provider

### `GET /providers/:id/statistics`
Get provider performance metrics and statistics

### `GET /providers/:id/schedule`
Get provider's schedule for date range

### `GET /providers/available`
Get available providers for specific service and date/time

### `GET /providers/:id/capacity`
Get current capacity usage for provider on specific date

---

## Service Management Endpoints

### `GET /services`
Get list of all services with active/inactive filter

### `GET /services/:id`
Get single service details

### `POST /services`
Create new service type

### `PUT /services/:id`
Update service details (name, duration, specialization)

### `DELETE /services/:id`
Delete service (only if not used in appointments)

### `PATCH /services/:id/activate`
Activate inactive service

### `PATCH /services/:id/deactivate`
Deactivate active service

---

## Appointment Management Endpoints

### `GET /appointments`
Get all appointments with filters (date, status, provider, service)

### `GET /appointments/:id`
Get single appointment details

### `POST /appointments`
Create new appointment with conflict detection

### `PUT /appointments/:id`
Update appointment details (reschedule, change provider)

### `DELETE /appointments/:id`
Cancel appointment with reason

### `PATCH /appointments/:id/check-in`
Mark appointment as checked-in

### `PATCH /appointments/:id/complete`
Mark appointment as completed

### `PATCH /appointments/:id/no-show`
Mark appointment as no-show

### `PATCH /appointments/:id/cancel`
Cancel appointment with cancellation reason

### `GET /appointments/today`
Get all appointments for current date

### `GET /appointments/upcoming`
Get upcoming appointments (next 7 days)

### `GET /appointments/search`
Search appointments by patient name or appointment number

### `POST /appointments/check-conflict`
Check for scheduling conflicts before creating appointment

### `GET /appointments/calendar`
Get appointments formatted for calendar view (day/week/month)

---

## Waitlist/Queue Management Endpoints

### `GET /queue`
Get all appointments in waitlist ordered by priority

### `GET /queue/:id`
Get single queue entry details

### `POST /queue`
Add appointment to waitlist manually

### `DELETE /queue/:id`
Remove appointment from queue

### `POST /queue/:id/assign`
Assign provider to queued appointment

### `POST /queue/auto-assign`
Auto-assign next eligible appointment from queue to provider

### `PATCH /queue/:id/priority`
Update queue entry priority (standard/urgent/emergency)

### `GET /queue/statistics`
Get waitlist statistics (count, average wait time, etc.)

---

## Provider Schedule Endpoints

### `GET /schedules`
Get all provider schedules with filters

### `GET /schedules/provider/:providerId`
Get schedule entries for specific provider

### `POST /schedules`
Create provider unavailability/leave entry

### `PUT /schedules/:id`
Update schedule entry

### `DELETE /schedules/:id`
Delete schedule entry (remove leave/unavailability)

### `GET /schedules/provider/:providerId/date/:date`
Get provider schedule for specific date

---

## Dashboard & Analytics Endpoints

### `GET /dashboard/summary`
Get dashboard summary (today's stats, queue count, provider utilization)

### `GET /analytics/appointments`
Get appointment analytics with date range filter

### `GET /analytics/providers`
Get provider performance analytics

### `GET /analytics/services`
Get service usage statistics

### `GET /analytics/no-shows`
Get no-show rate and trend analysis

### `GET /analytics/completion-rate`
Get appointment completion rate over time

### `GET /analytics/wait-time`
Get average wait time statistics

### `GET /analytics/utilization`
Get provider utilization heatmap data

---

## Activity Log Endpoints

### `GET /activity-logs`
Get activity logs with pagination and filters

### `GET /activity-logs/recent`
Get recent 20 activity log entries

### `GET /activity-logs/user/:userId`
Get activity logs for specific user

### `GET /activity-logs/entity/:entityType/:entityId`
Get logs for specific entity (appointment, provider, etc.)

---

## Report Generation Endpoints

### `GET /reports/daily`
Generate daily appointment report

### `GET /reports/weekly`
Generate weekly summary report

### `GET /reports/monthly`
Generate monthly performance report

### `GET /reports/provider/:providerId`
Generate provider-specific report

### `GET /reports/no-shows`
Generate no-show analysis report

### `POST /reports/export`
Export report in specified format (PDF/CSV/Excel)

---

## Notification Endpoints

### `GET /notifications`
Get user notifications (unread/all)

### `PATCH /notifications/:id/read`
Mark notification as read

### `PATCH /notifications/read-all`
Mark all notifications as read

### `DELETE /notifications/:id`
Delete single notification

### `DELETE /notifications/clear-all`
Clear all notifications

### `POST /notifications/send`
Send manual notification (admin only)

---

## Statistics Endpoints

### `GET /statistics/overview`
Get system-wide statistics overview

### `GET /statistics/appointments/count`
Get total appointment counts by status

### `GET /statistics/providers/workload`
Get provider workload distribution

### `GET /statistics/peak-hours`
Get peak appointment hours analysis

### `GET /statistics/service-demand`
Get most demanded services

---

## Search & Filter Endpoints

### `GET /search/patients`
Search patients by name or phone number

### `GET /search/appointments`
Advanced appointment search with multiple filters

### `GET /search/providers`
Search providers by name or specialization

---

## System Configuration Endpoints (Admin Only)

### `GET /config/settings`
Get system configuration settings

### `PUT /config/settings`
Update system settings

### `GET /config/working-hours`
Get default working hours configuration

### `PUT /config/working-hours`
Update default working hours

---

## File Upload Endpoints (Optional)

### `POST /upload/avatar`
Upload user/provider avatar image

### `POST /upload/document`
Upload appointment-related document

### `DELETE /upload/:fileId`
Delete uploaded file

---

## Health Check & Utility Endpoints

### `GET /health`
API health check endpoint

### `GET /version`
Get API version information

### `GET /status`
Get system status (database, services)

---

## Summary

**Total Endpoints:** ~100+ RESTful API endpoints

### Breakdown by Category:
- **Authentication:** 7 endpoints
- **User Management:** 7 endpoints
- **Provider Management:** 12 endpoints
- **Service Management:** 7 endpoints
- **Appointment Management:** 15 endpoints
- **Queue Management:** 8 endpoints
- **Provider Schedules:** 6 endpoints
- **Dashboard & Analytics:** 8 endpoints
- **Activity Logs:** 4 endpoints
- **Reports:** 6 endpoints
- **Notifications:** 6 endpoints
- **Statistics:** 5 endpoints
- **Search:** 3 endpoints
- **Configuration:** 4 endpoints
- **File Upload:** 3 endpoints
- **Utility:** 3 endpoints

### HTTP Methods Used:
- **GET:** Read/Retrieve data
- **POST:** Create new resources
- **PUT:** Update entire resource
- **PATCH:** Partial update
- **DELETE:** Remove resource

### Common Query Parameters:
- `page` - Pagination page number
- `limit` - Items per page
- `sort` - Sort field and order
- `filter` - Filter criteria
- `search` - Search term
- `startDate` / `endDate` - Date range
- `status` - Status filter
- `role` - Role filter

### Common Response Codes:
- **200** - Success
- **201** - Created
- **204** - No Content (successful deletion)
- **400** - Bad Request (validation error)
- **401** - Unauthorized (not authenticated)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **409** - Conflict (scheduling conflict)
- **500** - Internal Server Error

### Authentication:
All endpoints except `/auth/*` and `/health` require JWT token in header:
```
Authorization: Bearer <token>
```

### Rate Limiting:
- **Public endpoints:** 100 requests/hour
- **Authenticated endpoints:** 1000 requests/hour
- **Admin endpoints:** Unlimited

---

**Document Version:** 1.0  
**Last Updated:** February 2025