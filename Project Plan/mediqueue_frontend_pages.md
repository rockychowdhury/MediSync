# MediSync - Frontend Pages & Routes
## Page Structure & Access Control

**Project:** MediSync - Healthcare Appointment Management System  
**Version:** 1.0  
**Purpose:** Frontend page definitions and role-based routing

---

## 1. Route Structure Overview

### 1.1 Route Categories
- **Public Routes:** Accessible without authentication
- **Private Routes:** Require authentication (any role)
- **Role-Based Routes:** Require specific user role

### 1.2 Role Hierarchy
- **Admin:** Full system access (all pages)
- **Receptionist:** Appointment management and operations
- **Provider:** Personal schedule and availability management

---

## 2. Public Routes (No Authentication Required)

### `/login`
**Page:** Login Page  
**Purpose:** User authentication with email and password  
**Features:**
- Email and password input fields
- "Remember me" checkbox
- Demo login button (auto-fills credentials)
- Link to password reset page
- Form validation and error messages

### `/signup`
**Page:** Registration Page  
**Purpose:** New user account creation  
**Features:**
- Full name, email, password fields
- Password strength indicator
- Role selection (admin/receptionist/provider)
- Terms and conditions checkbox
- Redirect to login after successful signup

### `/forgot-password`
**Page:** Password Reset Request  
**Purpose:** Initiate password recovery process  
**Features:**
- Email input field
- Send reset link button
- Success/error message display
- Back to login link

### `/reset-password/:token`
**Page:** Password Reset Form  
**Purpose:** Set new password using reset token  
**Features:**
- New password and confirm password fields
- Password strength validator
- Submit button
- Token expiration handling

---

## 3. Private Routes (All Authenticated Users)

### `/dashboard`
**Page:** Main Dashboard  
**Purpose:** Central hub showing key metrics and quick actions  
**Features:**
- Today's appointment summary (total, completed, pending, cancelled)
- Waitlist queue count
- Provider utilization overview (visual capacity indicators)
- Quick action buttons (New Appointment, View Queue)
- Recent activity log (last 10 entries)
- Role-based content (different widgets per role)

### `/profile`
**Page:** User Profile Management  
**Purpose:** View and edit personal account information  
**Features:**
- Display user details (name, email, role)
- Edit profile form
- Change password section
- Account settings (notifications preferences)
- Logout button

---

## 4. Admin Routes

### `/admin/users`
**Page:** User Management  
**Purpose:** Manage system users and their roles  
**Features:**
- User list table (name, email, role, status)
- Add new user button
- Edit/deactivate user actions
- Search and filter by role
- Bulk actions (activate/deactivate multiple users)

### `/admin/users/create`
**Page:** Create New User  
**Purpose:** Add new system user with role assignment  
**Features:**
- User details form (name, email, role)
- Generate temporary password option
- Send invitation email checkbox
- Save and return to list

### `/admin/users/:id/edit`
**Page:** Edit User  
**Purpose:** Modify existing user details and permissions  
**Features:**
- Pre-filled user information form
- Change role dropdown
- Activate/deactivate toggle
- Reset password option
- Update and cancel buttons

### `/admin/providers`
**Page:** Provider Management  
**Purpose:** Manage healthcare providers and their configurations  
**Features:**
- Provider list table (name, specialization, capacity, status)
- Add new provider button
- Edit/delete provider actions
- Filter by specialization and availability
- Quick status toggle (available/on leave)

### `/admin/providers/create`
**Page:** Create New Provider  
**Purpose:** Add new healthcare provider to system  
**Features:**
- Provider details form (name, specialization, contact)
- Daily capacity setting (slider/input)
- Working hours configuration
- Link to user account (optional)
- Save button

### `/admin/providers/:id/edit`
**Page:** Edit Provider  
**Purpose:** Update provider information and settings  
**Features:**
- Pre-filled provider form
- Availability status toggle
- Capacity adjustment
- Schedule management link
- Delete provider option (with confirmation)

### `/admin/services`
**Page:** Service Management  
**Purpose:** Configure available medical services  
**Features:**
- Service list table (name, duration, required specialization, status)
- Add new service button
- Edit/delete service actions
- Activate/deactivate toggle
- Search and filter options

### `/admin/services/create`
**Page:** Create New Service  
**Purpose:** Add new service type to catalog  
**Features:**
- Service name input
- Duration selector (15/30/45/60 minutes)
- Required specialization dropdown
- Active status checkbox
- Save button

### `/admin/services/:id/edit`
**Page:** Edit Service  
**Purpose:** Modify existing service details  
**Features:**
- Pre-filled service form
- Update duration and requirements
- Deactivate service option
- Save changes button

### `/admin/reports`
**Page:** Analytics & Reports  
**Purpose:** View system performance metrics and generate reports  
**Features:**
- Date range picker
- Key performance indicators (KPIs):
  - Total appointments (daily/weekly/monthly)
  - Completion rate percentage
  - No-show rate with trend chart
  - Average wait time
  - Provider utilization heatmap
- Export buttons (PDF, CSV, Excel)
- Interactive charts and graphs
- Comparison filters (by provider, service, date range)

### `/admin/activity-logs`
**Page:** System Activity Logs  
**Purpose:** View complete audit trail of system actions  
**Features:**
- Paginated log entries table
- Filter by: user, action type, entity type, date range
- Search functionality
- Log detail view (click to expand metadata)
- Export logs option

---

## 5. Receptionist Routes

### `/appointments`
**Page:** Appointments List  
**Purpose:** View and manage all appointments  
**Features:**
- Appointment list table (patient, service, provider, date/time, status)
- Tabs: All, Today, Upcoming, Completed, Cancelled
- Search by patient name or appointment number
- Filter by date range, provider, status
- Quick actions: Check-in, Complete, Cancel, Reschedule
- Pagination

### `/appointments/create`
**Page:** Create New Appointment  
**Purpose:** Book new patient appointment  
**Features:**
- Patient information form (name, phone, email)
- Service selection dropdown
- Date picker (calendar view)
- Available time slots display
- Provider selection (auto-suggest based on availability)
- Conflict warning display
- Special notes textarea
- Add to queue if no provider available
- Save appointment button

### `/appointments/:id`
**Page:** Appointment Details  
**Purpose:** View complete appointment information  
**Features:**
- Full appointment details display
- Patient contact information
- Service and provider details
- Timeline of status changes
- Edit appointment button
- Cancel with reason modal
- Mark as no-show button
- Print appointment slip option

### `/appointments/:id/edit`
**Page:** Edit Appointment  
**Purpose:** Modify existing appointment details  
**Features:**
- Pre-filled appointment form
- Change service, date, time, provider
- Conflict detection on save
- Update notes field
- Save changes or cancel

### `/queue`
**Page:** Waitlist Queue Management  
**Purpose:** Manage appointments waiting for provider assignment  
**Features:**
- Queue list ordered by priority and time
- Queue position display (1st, 2nd, 3rd...)
- Patient and service information
- Priority badges (standard/urgent/emergency)
- "Assign to Provider" button for each entry
- Bulk assign options
- Remove from queue action
- Real-time queue count

### `/queue/:id/assign`
**Page:** Assign Provider from Queue  
**Purpose:** Manually assign provider to queued appointment  
**Features:**
- Appointment summary
- Available providers list (filtered by specialization)
- Provider capacity indicators
- Time slot suggestions
- Conflict warnings
- Assign and notify patient button
- Return to queue option

### `/schedule`
**Page:** Schedule Calendar View  
**Purpose:** Visual overview of all appointments  
**Features:**
- Calendar views: Day, Week, Month
- Color-coded appointments by status
- Provider filter dropdown
- Time slot grid with appointments
- Click appointment to view details
- Drag-and-drop rescheduling (optional)
- Print schedule option

---

## 6. Provider Routes

### `/provider/schedule`
**Page:** My Schedule  
**Purpose:** View personal appointment schedule  
**Features:**
- Calendar view (day/week/month)
- Personal appointments only
- Appointment details on click
- Filter by date range
- Print my schedule button
- Today's appointment count indicator

### `/provider/appointments`
**Page:** My Appointments List  
**Purpose:** List view of provider's assigned appointments  
**Features:**
- Appointment table (patient, service, date/time, status)
- Tabs: Today, Upcoming, Completed
- Mark as completed button
- View patient notes
- Search within my appointments

### `/provider/availability`
**Page:** Manage Availability  
**Purpose:** Update working status and schedule  
**Features:**
- Current status toggle (Available/On Leave/Busy)
- Set unavailable dates (date range picker)
- Working hours configuration
- Daily capacity adjustment
- Save unavailability with reason
- Upcoming unavailability list
- Delete scheduled leave option

### `/provider/statistics`
**Page:** My Performance Stats  
**Purpose:** View personal performance metrics  
**Features:**
- Total appointments (today/week/month)
- Completion rate percentage
- Average appointment duration
- Utilization chart (% of capacity used)
- Patient feedback summary (if enabled)
- Monthly trend graph

---

## 7. Shared Component Pages

### `/appointments/:id/cancel`
**Modal:** Cancel Appointment  
**Purpose:** Cancel appointment with reason  
**Features:**
- Cancellation reason dropdown
- Additional notes textarea
- Notify patient checkbox
- Confirm cancel button

### `/appointments/:id/reschedule`
**Modal:** Reschedule Appointment  
**Purpose:** Change appointment date/time  
**Features:**
- New date picker
- Available time slots
- Provider selection (if needed)
- Notify patient checkbox
- Confirm reschedule button

### `/notifications`
**Page:** Notification Center  
**Purpose:** View system notifications and alerts  
**Features:**
- Notification list (unread highlighted)
- Mark as read/unread actions
- Clear all notifications
- Filter by type (appointment, queue, system)
- Notification preferences link

---

## 8. Error & Utility Pages

### `/404`
**Page:** Not Found  
**Purpose:** Handle invalid routes  
**Features:**
- 404 error message
- Helpful navigation links
- Go to dashboard button
- Search functionality

### `/403`
**Page:** Access Denied  
**Purpose:** Handle unauthorized access attempts  
**Features:**
- Permission denied message
- Explanation of required role
- Contact admin option
- Return to dashboard link

### `/500`
**Page:** Server Error  
**Purpose:** Handle system errors gracefully  
**Features:**
- Error message
- Retry button
- Report issue link
- Go back button

### `/loading`
**Component:** Loading State  
**Purpose:** Show during data fetching  
**Features:**
- Spinner/skeleton loader
- Optional loading message
- Consistent across all pages

---

## 9. Route Protection Summary

### Public Access
```
/login
/signup
/forgot-password
/reset-password/:token
```

### Authenticated (All Roles)
```
/dashboard
/profile
/notifications
```

### Admin Only
```
/admin/*
/admin/users
/admin/providers
/admin/services
/admin/reports
/admin/activity-logs
```

### Receptionist + Admin
```
/appointments
/appointments/create
/appointments/:id
/appointments/:id/edit
/queue
/queue/:id/assign
/schedule
```

### Provider + Admin
```
/provider/schedule
/provider/appointments
/provider/availability
/provider/statistics
```

---

## 10. Navigation Structure

### Admin Navigation Menu
- Dashboard
- Appointments
- Queue Management
- Providers
- Services
- Users
- Reports & Analytics
- Activity Logs
- Profile

### Receptionist Navigation Menu
- Dashboard
- Appointments
- Create Appointment
- Queue Management
- Schedule
- Profile

### Provider Navigation Menu
- Dashboard
- My Schedule
- My Appointments
- Availability Settings
- My Statistics
- Profile

---

## 11. Mobile-Responsive Considerations

### Priority Pages for Mobile
- Login/Signup
- Dashboard
- Appointments List
- Create Appointment
- Queue Management
- Provider Schedule

### Mobile Navigation
- Bottom navigation bar (mobile)
- Hamburger menu for secondary pages
- Swipe gestures for calendar navigation
- Pull-to-refresh on list pages

---

## 12. Page Load Priorities

### Critical (First Load)
1. Login page
2. Dashboard
3. Appointments list

### High Priority
4. Create appointment
5. Queue management
6. Provider schedule

### Medium Priority
7. Reports and analytics
8. Activity logs
9. User/provider management

### Low Priority
10. Profile settings
11. Statistics pages
12. Documentation/help pages

---

## Summary

**Total Pages:** ~30 pages/routes
- **Public:** 4 pages
- **Private Shared:** 3 pages
- **Admin:** 10 pages
- **Receptionist:** 9 pages
- **Provider:** 4 pages
- **Utility:** 3 pages
- **Modals/Overlays:** 3 components

**Technology Recommendations:**
- **Routing:** React Router, Vue Router, Next.js App Router
- **State Management:** Context API, Redux, Zustand, Pinia
- **UI Components:** Material-UI, Ant Design, Shadcn/ui, Chakra UI
- **Charts:** Recharts, Chart.js, ApexCharts
- **Calendar:** FullCalendar, React Big Calendar, Vue Cal

---

**Document Version:** 1.0  
**Last Updated:** January 2025