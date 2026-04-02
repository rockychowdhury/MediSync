Here are the API endpoints for the MediSync Backend API, grouped by their respective categories along with their request methods:

**default**
*   GET `/health` - Health Check

**auth**
*   POST `/api/v1/auth/login` - Login
*   POST `/api/v1/auth/logout` - Logout
*   POST `/api/v1/auth/forgot-password` - Forgot Password
*   POST `/api/v1/auth/reset-password` - Reset Password

**users**
*   GET `/api/v1/users/` - Read Users
*   POST `/api/v1/users/` - Create User
*   GET `/api/v1/users/{id}` - Read User By Id
*   PUT `/api/v1/users/{id}` - Update User
*   DELETE `/api/v1/users/{id}` - Delete User
*   PATCH `/api/v1/users/{id}/activate` - Activate User
*   PATCH `/api/v1/users/{id}/deactivate` - Deactivate User
*   GET `/api/v1/users/{id}/audit` - Read User Audit

**profile**
*   GET `/api/v1/profile/me` - Read Current User
*   PUT `/api/v1/profile/me` - Update Current User
*   PUT `/api/v1/profile/change-password` - Change Password

**patients**
*   GET `/api/v1/patients/` - Read Patients
*   POST `/api/v1/patients/` - Create Patient
*   GET `/api/v1/patients/{id}` - Read Patient By Id
*   PUT `/api/v1/patients/{id}` - Update Patient
*   DELETE `/api/v1/patients/{id}` - Delete Patient
*   PATCH `/api/v1/patients/{id}/activate` - Activate Patient
*   GET `/api/v1/patients/{id}/audit` - Read Patient Audit

**rbac**
*   GET `/api/v1/rbac/permissions` - Read Permissions
*   POST `/api/v1/rbac/permissions` - Create Permission
*   PUT `/api/v1/rbac/permissions/{id}` - Update Permission
*   DELETE `/api/v1/rbac/permissions/{id}` - Delete Permission
*   GET `/api/v1/rbac/roles` - Read Roles
*   POST `/api/v1/rbac/roles/{id}/permissions` - Assign Role Permissions
*   DELETE `/api/v1/rbac/roles/{id}/permissions/{permission_id}` - Revoke Role Permission

**activity-logs**
*   GET `/api/v1/activity-logs/` - Read Activity Logs
*   GET `/api/v1/activity-logs/stats` - Read Activity Stats
*   GET `/api/v1/activity-logs/{id}` - Read Activity Log

**specializations**
*   GET `/api/v1/specializations/` - Read Specializations
*   POST `/api/v1/specializations/` - Create Specialization
*   GET `/api/v1/specializations/{id}` - Read Specialization
*   PUT `/api/v1/specializations/{id}` - Update Specialization
*   DELETE `/api/v1/specializations/{id}` - Delete Specialization

**services**
*   GET `/api/v1/services/` - Read Services
*   POST `/api/v1/services/` - Create Service
*   GET `/api/v1/services/categories` - Read Service Categories
*   GET `/api/v1/services/{id}` - Read Service
*   PUT `/api/v1/services/{id}` - Update Service
*   DELETE `/api/v1/services/{id}` - Delete Service

**providers**
*   GET `/api/v1/providers/` - Read Providers
*   POST `/api/v1/providers/` - Promote To Provider
*   GET `/api/v1/providers/{id}` - Read Provider By Id
*   PUT `/api/v1/providers/{id}` - Update Provider Profile
*   GET `/api/v1/providers/{id}/services` - Read Provider Services
*   POST `/api/v1/providers/{provider_id}/services/{service_id}` - Assign Service To Provider
*   DELETE `/api/v1/providers/{provider_id}/services/{service_id}` - Remove Service From Provider

**availability**
*   POST `/api/v1/availability/` - Create Availability
*   GET `/api/v1/availability/{provider_id}` - Read Provider Availability
*   PUT `/api/v1/availability/{id}` - Update Availability
*   DELETE `/api/v1/availability/{id}` - Delete Availability

**time-off**
*   POST `/api/v1/time-off/` - Create Time Off
*   GET `/api/v1/time-off/{provider_id}` - Read Provider Time Offs
*   PUT `/api/v1/time-off/{id}` - Update Time Off
*   DELETE `/api/v1/time-off/{id}` - Delete Time Off
*   PATCH `/api/v1/time-off/{id}/approve` - Approve Time Off

**appointments**
*   POST `/api/v1/appointments/` - Create Appointment
*   GET `/api/v1/appointments/` - Read Appointments
*   GET `/api/v1/appointments/{id}` - Read Appointment
*   PATCH `/api/v1/appointments/{id}/status` - Update Appointment Status
*   GET `/api/v1/appointments/providers/{provider_id}/queue` - Get Provider Queue
*   GET `/api/v1/appointments/providers/{provider_id}/capacity` - Get Provider Capacity

**waitlist**
*   POST `/api/v1/waitlist/` - Create Waitlist Entry
*   GET `/api/v1/waitlist/` - Get Waitlist
*   DELETE `/api/v1/waitlist/{id}` - Cancel Waitlist Entry
*   GET `/api/v1/waitlist/estimated-wait/{service_id}` - Get Estimated Wait Time

**v1**
*   GET `/api/v1/` - Root