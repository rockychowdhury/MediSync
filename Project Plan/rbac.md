# MediSync — Admin RBAC Page Implementation Spec
**Route:** `http://localhost:3000/dashboard/admin/rbac`
**Version:** 1.0 | **Prepared for:** Frontend Development Team | **Date:** April 2026
**Scope:** End-to-end implementation of the RBAC management page inside the Admin dashboard

---

## Table of Contents

1. [Mental Model & Design Decisions](#1-mental-model--design-decisions)
2. [Page Layout & Structure](#2-page-layout--structure)
3. [Section A — Role Permission Matrix](#3-section-a--role-permission-matrix)
4. [Section B — Permissions CRUD](#4-section-b--permissions-crud)
5. [Section C — Roles CRUD](#5-section-c--roles-crud)
6. [Shared Dialogs](#6-shared-dialogs)
   - 6A. Create / Edit Permission Dialog
   - 6B. Create / Edit Role Dialog
   - 6C. Delete Confirmation Dialog
7. [Data Fetching & State Management](#7-data-fetching--state-management)
8. [UI State Standards](#8-ui-state-standards)
9. [Required Backend Endpoints](#9-required-backend-endpoints)
10. [API Quick Reference](#10-api-quick-reference)

---

## 1. Mental Model & Design Decisions

### 1.1 What This Page Does

The RBAC page manages three related things:

1. **Permissions** — atomic capability strings like `appointments.create`, `providers.edit`. These are the raw building blocks. CRUD operations.
2. **Roles** — named groups (admin, receptionist, provider). CRUD operations.
3. **Role ↔ Permission assignments** — which permissions belong to which role. This is the `role_permissions` join table. Assign and revoke operations.

### 1.2 Layout Strategy: Three Sections on One Page

Everything lives on a **single scrollable page** — no nested routes, no separate pages for permissions vs. roles. Reason: RBAC management is tightly coupled. When you create a permission, you immediately want to assign it to roles. Keeping it on one page eliminates context-switching.

The page is divided into three sections stacked vertically:

```
┌──────────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                     │
├──────────────────────────────────────────────────────────────────┤
│  SECTION A — Role Permission Matrix (primary — top of page)      │
│  The assignment/revoke interface. Central to the RBAC workflow.  │
├──────────────────────────────────────────────────────────────────┤
│  SECTION B — Permissions Management (CRUD table)                 │
├──────────────────────────────────────────────────────────────────┤
│  SECTION C — Roles Management (CRUD table)                       │
└──────────────────────────────────────────────────────────────────┘
```

Section A is placed first because assigning permissions to roles is the **most frequent action** — an admin will do this far more than creating new permissions or roles. Permissions and Roles CRUD is secondary (setup tasks, done once or rarely).

### 1.3 Permission Naming Convention

Permissions follow the pattern `{resource}.{action}`, e.g.:

```
appointments.create
appointments.read
appointments.update
appointments.cancel
providers.read
providers.edit
patients.create
patients.read
rbac.manage
```

The UI must display these grouped by resource prefix. Flat alphabetical lists are unusable once there are 20+ permissions. Grouping by resource makes the matrix scannable.

---

## 2. Page Layout & Structure

### 2.1 File Structure (Next.js App Router)

```
app/
└── dashboard/
    └── admin/
        └── rbac/
            ├── page.tsx                  ← Main page component
            ├── components/
            │   ├── RolePermissionMatrix.tsx
            │   ├── PermissionsTable.tsx
            │   ├── RolesTable.tsx
            │   ├── PermissionDialog.tsx
            │   ├── RoleDialog.tsx
            │   └── DeleteConfirmDialog.tsx
            └── hooks/
                ├── usePermissions.ts     ← fetch + mutation hooks for permissions
                ├── useRoles.ts           ← fetch + mutation hooks for roles
                └── useRolePermissions.ts ← assign/revoke hooks
```

### 2.2 Page Header

```
┌──────────────────────────────────────────────────────────────────┐
│  Roles & Permissions                                             │
│  Manage access control — define permissions and assign them      │
│  to roles.                                                       │
│                                                             [?]  │
└──────────────────────────────────────────────────────────────────┘
```

- Page title: "Roles & Permissions" (H1)
- Subtitle: "Manage access control — define permissions and assign them to roles."
- Help icon `[?]` — clicking opens a small popover explaining the RBAC model:
  > "Permissions are individual capabilities (e.g., `appointments.create`). Roles are named groups (e.g., Receptionist). Assigning a permission to a role grants it to all users with that role."

### 2.3 Section Anchor Navigation

Because this is a long scrollable page, render a sticky secondary nav strip below the page header (only visible when the user has scrolled past the header):

```
[ Role Matrix ]  [ Permissions ]  [ Roles ]
```

Clicking a section link smooth-scrolls to that section. Active section highlights based on scroll position (Intersection Observer).

---

## 3. Section A — Role Permission Matrix

**Component: `<RolePermissionMatrix />`**

This is the most important section of the page. It shows every permission grouped by resource on the Y-axis and every role on the X-axis. Each cell is a checkbox — checked = permission assigned to that role.

### 3.1 Visual Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Role Permission Matrix                                                     │
│  Click checkboxes to assign or revoke permissions per role.                 │
│  Changes save immediately.                                                  │
│                                                       [Expand All Groups]   │
├──────────────────────────────┬───────────┬──────────────┬───────────────────┤
│  PERMISSION                  │  admin    │ receptionist │    provider       │
├──────────────────────────────┼───────────┼──────────────┼───────────────────┤
│  ▼ appointments              │           │              │                   │
│    appointments.create       │    ☑      │      ☑       │        ☐          │
│    appointments.read         │    ☑      │      ☑       │        ☑          │
│    appointments.update       │    ☑      │      ☑       │        ☐          │
│    appointments.cancel       │    ☑      │      ☑       │        ☐          │
│    appointments.override     │    ☑      │      ☐       │        ☐          │
├──────────────────────────────┼───────────┼──────────────┼───────────────────┤
│  ▼ providers                 │           │              │                   │
│    providers.read            │    ☑      │      ☑       │        ☑          │
│    providers.edit            │    ☑      │      ☐       │        ☐          │
│    providers.create          │    ☑      │      ☐       │        ☐          │
├──────────────────────────────┼───────────┼──────────────┼───────────────────┤
│  ...more groups...           │           │              │                   │
└──────────────────────────────┴───────────┴──────────────┴───────────────────┘
```

### 3.2 Grouping Permissions by Resource

Permission names follow `{resource}.{action}`. Extract the resource prefix client-side:

```typescript
// Group permissions by their resource prefix
function groupPermissions(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((acc, perm) => {
    const resource = perm.name.includes('.')
      ? perm.name.split('.')[0]
      : 'general';
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);
}
```

Each group renders as a collapsible section in the matrix. Group header row spans all columns with an expand/collapse toggle chevron. All groups are expanded by default.

The "Expand All / Collapse All" button in the top-right of the matrix header toggles all groups.

### 3.3 Role Columns

Each role from `GET /api/v1/rbac/roles` gets a column. The column header shows:
- Role name (formatted: "Admin" / "Receptionist" / "Provider")
- User count badge below the name: "(3 users)" — total users with this role
  - Source: `GET /api/v1/rbac/roles/{id}` which should include `user_count` — see §9.

### 3.4 Checkbox Behavior

Each cell is a checkbox (`<input type="checkbox" />`). The checked state is derived from whether the permission is in the role's current permission set.

**On check (assign):**
```
POST /api/v1/rbac/roles/{role_id}/permissions
Body: { "permission_id": number }
```

**On uncheck (revoke):**
```
DELETE /api/v1/rbac/roles/{role_id}/permissions/{permission_id}
```

**Optimistic UI:** The checkbox updates immediately on click (don't wait for the API response before toggling the visual state). If the API call fails, revert the checkbox and show an error toast.

**Loading state per cell:** While the API call is in-flight, show the checkbox as indeterminate (`indeterminate` property on the input) and disable it to prevent double-clicks. The indeterminate state signals "saving..." without a spinner.

**Error state:** If the assign/revoke API call fails, revert the checkbox to its previous state and show a toast: "Failed to update permission — try again."

### 3.5 Row-Level and Column-Level Bulk Actions

**Column header row:** Each role column header has a "Select All / Deselect All" toggle below the role name. Clicking it assigns all permissions to that role (or revokes all). Shows a confirmation popover before executing:
> "Assign all [N] permissions to [Role Name]? This will override current settings for this role."

On confirm, fire all assign calls in parallel (Promise.all). Show a loading state on the entire column during the operation.

**Row-level group header:** Each resource group header row (e.g., "appointments") has a small "Grant all to all roles" icon button. Useful for quickly granting a resource group across all roles. Same confirmation popover pattern.

> **Backend note:** Bulk assign/revoke in a single call is not currently in the API. For now, fire individual calls in parallel. If performance is poor with many permissions, request a `POST /api/v1/rbac/roles/{id}/permissions/bulk` endpoint — see §9.

### 3.6 Protected Permissions

Certain permissions should be locked for certain roles and not toggleable (e.g., `rbac.manage` should always be assigned to admin and never to receptionist or provider). Implement a client-side lock list:

```typescript
// Locked cells: cannot be changed via the UI
const LOCKED_ASSIGNMENTS = [
  { role: 'admin', permission: 'rbac.manage', locked: true, reason: 'Admins always have RBAC access' },
  { role: 'receptionist', permission: 'rbac.manage', locked: true, reason: 'Receptionists cannot manage RBAC' },
  { role: 'provider', permission: 'rbac.manage', locked: true, reason: 'Providers cannot manage RBAC' },
];
```

Locked cells render with a lock icon instead of a checkbox, and show a tooltip on hover explaining why it's locked.

### 3.7 Matrix Sticky Headers

On desktop, the **role column headers** should be sticky horizontally (frozen) so when the matrix has many permission rows and the user scrolls down, the column headers remain visible. Use CSS `position: sticky; top: [tabbar height]`.

On the X-axis, if there are more than 4 roles (future-proofing), the permission name column should be sticky on the left: `position: sticky; left: 0`.

### 3.8 Search Filter for the Matrix

A search input above the matrix table:

```
[ 🔍 Filter permissions...          ]
```

Filtering updates which permission rows are visible in the matrix (client-side, instant — no API call). Matching is case-insensitive on permission name and description. Non-matching rows are hidden. If a group has no matching permissions, the group header is also hidden.

---

## 4. Section B — Permissions Management

**Component: `<PermissionsTable />`**

A CRUD table for the `permissions` database table. This is where permissions are created, named, described, and deleted.

### 4.1 Section Header

```
┌──────────────────────────────────────────────────────────────────┐
│  Permissions                                            [+ New Permission] │
│  Define individual capabilities that can be assigned to roles.   │
│  [ 🔍 Search permissions...       ]   [ Resource ▼ ]            │
└──────────────────────────────────────────────────────────────────┘
```

- "＋ New Permission" button — top right — opens Create Permission Dialog (§6A)
- Search input — client-side filter on permission name and description
- Resource dropdown filter — filters by resource prefix ("appointments", "providers", etc.) — options derived by extracting unique prefixes from the permissions list

### 4.2 Permissions Table

**API:**
```
GET /api/v1/rbac/permissions
```

Expected response shape:
```json
[
  { "id": 1, "name": "appointments.create", "description": "Create new appointments" },
  { "id": 2, "name": "appointments.read", "description": "View appointments" }
]
```

**Table columns:**

| Column | Content | Notes |
|---|---|---|
| **Name** | `appointments.create` — monospace font | The resource prefix (`appointments`) rendered in muted text, the action (`.create`) in default weight |
| **Description** | Human-readable description | Truncated at 80 chars, full on hover tooltip |
| **Assigned To** | Role badges showing which roles have this permission | e.g., `Admin` `Receptionist` — derived from role_permissions data already loaded for the matrix |
| **Actions** | Edit · Delete | |

**Sorting:** Default sort by `name` ascending (alphabetical). Column header click toggles sort direction for Name column.

**Grouping (optional, toggle):** A "Group by Resource" toggle above the table. When on, rows are visually grouped under resource headings (same grouping logic as §3.2). When off, flat list sorted alphabetically.

### 4.3 Actions per Row

**Edit button:** Opens Edit Permission Dialog (§6A) pre-filled with this permission's data.

**Delete button:** Opens Delete Confirmation Dialog (§6C).

**Delete rules:**
- If the permission is currently assigned to one or more roles, show a warning in the confirmation dialog: "This permission is currently assigned to [Admin, Receptionist]. Deleting it will revoke it from all roles."
- The delete call should cascade the `role_permissions` deletions server-side. The UI just shows the warning.

**API — delete:**
```
DELETE /api/v1/rbac/permissions/{id}
```

### 4.4 Empty State

```
No permissions defined yet.
Permissions are the building blocks of access control.
Create your first permission to get started.
[+ Create Permission]
```

---

## 5. Section C — Roles Management

**Component: `<RolesTable />`**

A CRUD table for the `roles` database table.

### 5.1 Section Header

```
┌──────────────────────────────────────────────────────────────────┐
│  Roles                                                [+ New Role]│
│  Roles group permissions together and are assigned to users.     │
└──────────────────────────────────────────────────────────────────┘
```

- "＋ New Role" button — opens Create Role Dialog (§6B)

### 5.2 Roles Table

**API:**
```
GET /api/v1/rbac/roles
```

> **Backend note:** The current `GET /api/v1/rbac/roles` should be extended (or a new endpoint added) to include `user_count` and `permission_count` per role. See §9.

**Table columns:**

| Column | Content | Notes |
|---|---|---|
| **Role Name** | Role name, formatted (e.g., "Admin") | Monospace or chip-style for the raw name (`admin`) below the display name |
| **Description** | Human-readable description | Editable inline on double-click or via Edit dialog |
| **Permissions** | Count badge: "12 permissions" | Clicking the count opens a small popover listing all assigned permission names |
| **Users** | Count badge: "3 users" | Clicking opens a small popover listing user names/emails with this role |
| **Actions** | Edit · Delete | |

### 5.3 Permissions Popover (per Role row)

Trigger: clicking the permissions count badge in the roles table.

```
┌──────────────────────────────────────────┐
│  Admin — Permissions (12)               │
│  ─────────────────────────────────────  │
│  appointments.create                    │
│  appointments.read                      │
│  appointments.cancel                    │
│  ...                                    │
│                                         │
│  [Manage in Matrix ↑]                  │
└──────────────────────────────────────────┘
```

"Manage in Matrix ↑" link smooth-scrolls to Section A (the matrix) and highlights the column for this role temporarily (brief yellow flash animation on the column header).

### 5.4 Users Popover (per Role row)

Trigger: clicking the users count badge.

```
┌──────────────────────────────────────────┐
│  Admin — Users (2)                      │
│  ─────────────────────────────────────  │
│  John Smith    john@clinic.com          │
│  Sarah Lee     sarah@clinic.com         │
│                                         │
│  [Manage Users →]                      │
└──────────────────────────────────────────┘
```

"Manage Users →" links to `/dashboard/admin/users` (the user management page).

> **Backend note:** The users-per-role list requires a `GET /api/v1/rbac/roles/{id}/users` endpoint. See §9.

### 5.5 Delete Role Rules

- **Cannot delete a role that has users assigned to it.** The delete button should be disabled with a tooltip: "Cannot delete — [N] users have this role. Reassign them first."
- **Cannot delete seeded/system roles** (`admin`, `receptionist`, `provider`). These are protected. Disable the delete button with tooltip: "System role — cannot be deleted."
- Check both conditions client-side (using `user_count` from the table data) before showing the Delete button as enabled.

**API — delete:**
```
DELETE /api/v1/rbac/roles/{id}
```
> **Backend note:** `DELETE /api/v1/rbac/roles/{id}` needs to be created. See §9.

### 5.6 Empty State

In practice, roles will always exist (seeded). But if somehow empty:
```
No roles defined. Create a role to start assigning permissions.
[+ Create Role]
```

---

## 6. Shared Dialogs

All dialogs use the same base `<Dialog />` component from the UI library (Shadcn Dialog or equivalent). They are modal overlays — they do NOT navigate away from the page.

---

### 6A. Create / Edit Permission Dialog

**Component: `<PermissionDialog />`**
**Trigger:** "＋ New Permission" button (create mode) | "Edit" action on a row (edit mode)

**Dialog title:**
- Create mode: "Create Permission"
- Edit mode: "Edit Permission"

**Width:** 480px

#### Fields

**Permission Name** — Text input. Required.
- Placeholder: `resource.action` (e.g., `appointments.create`)
- The input validates the format on blur: must match the regex `/^[a-z_]+\.[a-z_]+$/`
- If format is invalid, show inline error: "Use format `resource.action` — lowercase letters and underscores only. Example: `appointments.create`"
- In edit mode: the name field is **read-only** (shown as text, not input). Changing a permission name would silently break any code that checks permissions by name. Show a note: "Permission names cannot be changed after creation."
- Resource prefix is auto-detected from the name and shown as a muted label below the input: "Resource: appointments"

**Description** — Textarea. Optional but strongly recommended.
- Placeholder: "Describe what this permission allows..."
- Max 500 characters. Character count shown.
- Help text below: "Use plain language. E.g., 'Allows creating new patient appointments'"

**Preview** (create mode only) — Shows a live preview of how this permission will appear in the matrix:

```
Preview:
  appointments › create
  "Allows creating new patient appointments"
```

#### Footer

- "Cancel" — closes dialog, no changes
- "Save Permission" (create) / "Update Permission" (edit)

#### API

**Create:**
```
POST /api/v1/rbac/permissions
Body: { "name": "appointments.create", "description": "..." }
```

**Update:**
```
PUT /api/v1/rbac/permissions/{id}
Body: { "description": "..." }   ← name is not sent (read-only in edit mode)
```

#### On Success

- Dialog closes
- Permissions table row is added/updated in-place (prepend new row, highlight briefly)
- Matrix re-renders with the new permission row (in its grouped position)
- Toast: "Permission created — `appointments.create`" / "Permission updated"

#### Validation Summary (before submit)

```
✗ Name is required
✗ Name must follow format: resource.action
✗ Name already exists (check client-side against loaded permissions list — instant feedback, no API call)
```

---

### 6B. Create / Edit Role Dialog

**Component: `<RoleDialog />`**
**Trigger:** "＋ New Role" button (create mode) | "Edit" action on roles table row (edit mode)

**Dialog title:**
- Create mode: "Create Role"
- Edit mode: "Edit Role"

**Width:** 480px

#### Fields

**Role Name** — Text input. Required.
- Placeholder: e.g., `nurse`, `billing_staff`
- Validates on blur: `/^[a-z_]+$/` — lowercase letters and underscores only
- If invalid: "Use lowercase letters and underscores only. Example: `billing_staff`"
- In edit mode: **read-only** (same reason as permission name — role names may be used in code). Show note: "Role names cannot be changed after creation."

**Display Name** — Text input. Optional.
- A human-readable label separate from the machine-readable `name`. E.g., name = `billing_staff`, display = "Billing Staff"
- If not provided, the UI will format the `name` automatically by replacing underscores with spaces and capitalizing.
- > **Backend note:** The `roles` table currently has only `name` and `description`. A `display_name` column should be added to support this. Alternatively, the frontend can format `name` on its own without a separate column. Use whichever approach the backend team prefers.

**Description** — Textarea. Optional.
- Placeholder: "Describe what this role does and who it is for..."
- Max 500 characters. Character count shown.

**Initial Permissions (create mode only)** — Multi-select checkbox list.
- Shows all available permissions grouped by resource (same grouping as matrix)
- Optional: admin can pre-select permissions while creating the role rather than going to the matrix separately
- Select All / Deselect All per group toggle
- This is purely a UX convenience — under the hood it creates the role first, then fires individual assign calls for each selected permission

#### Footer

- "Cancel"
- "Create Role" / "Save Changes"

#### API

**Create (two-step):**
```
POST /api/v1/rbac/roles
Body: { "name": "billing_staff", "description": "..." }
```
> **Backend note:** `POST /api/v1/rbac/roles` needs to be created. See §9.

Then for each pre-selected permission (fired in parallel):
```
POST /api/v1/rbac/roles/{new_role_id}/permissions
Body: { "permission_id": number }
```

**Update:**
```
PUT /api/v1/rbac/roles/{id}
Body: { "description": "..." }
```
> **Backend note:** `PUT /api/v1/rbac/roles/{id}` needs to be created. See §9.

#### On Success

- Dialog closes
- New role column appears in the matrix (fade in)
- Roles table row added/updated
- Toast: "Role created — `billing_staff`" / "Role updated"

---

### 6C. Delete Confirmation Dialog

**Component: `<DeleteConfirmDialog />`**
**Trigger:** "Delete" action on permissions table row | "Delete" action on roles table row (when enabled)

**Width:** 440px

#### Layout

```
┌──────────────────────────────────────────────────────┐
│  Delete [Permission / Role]?                         │
│  ─────────────────────────────────────────────────   │
│                                                      │
│  ⚠ You are about to delete:                          │
│                                                      │
│  [Entity name in monospace box]                      │
│  [Entity description]                                │
│                                                      │
│  [Impact warning — contextual]                       │
│                                                      │
│  This action cannot be undone.                       │
│                                                      │
│  [Cancel]               [Delete]                     │
└──────────────────────────────────────────────────────┘
```

**Impact warning (permission delete):**
```
⚠ This permission is currently assigned to:
  · Admin (will be revoked)
  · Receptionist (will be revoked)
Deleting it will remove it from all roles immediately.
```
If not assigned to any roles: "This permission is not assigned to any roles."

**Impact warning (role delete):**
```
⚠ This role has [N] permission(s) assigned.
All role-permission assignments will be removed.
```

**"Delete" button:** Styled as a danger/destructive button. Shows a loading spinner during the API call. After success, closes dialog and removes the row from the table with a fade-out animation.

---

## 7. Data Fetching & State Management

### 7.1 Data Loading Strategy

The page needs three data sets loaded in parallel on mount:

```typescript
// In page.tsx — parallel fetch on mount
const [permissions, roles, rolePermissionsMap] = await Promise.all([
  fetchPermissions(),    // GET /api/v1/rbac/permissions
  fetchRoles(),          // GET /api/v1/rbac/roles (with user_count, permission_count)
  fetchRolePermissions() // GET /api/v1/rbac/roles/permissions/all  ← see §9
]);
```

**`rolePermissionsMap`** is the key derived structure. It maps every `role_id` to the set of `permission_id`s currently assigned:

```typescript
type RolePermissionsMap = Record<number, Set<number>>;
// Example:
// {
//   1: new Set([1, 2, 3, 4, 5]),         // admin has permissions 1-5
//   2: new Set([2, 3]),                  // receptionist has permissions 2, 3
//   3: new Set([2]),                     // provider has permission 2
// }
```

This map is the source of truth for checkbox states in the matrix. Avoid re-fetching the full matrix data on every assign/revoke — update this map locally on success (optimistic update).

### 7.2 State Updates on CRUD Operations

**Permission created:**
- Add to `permissions` list in local state
- Matrix gains a new row at the correct sorted/grouped position (animate in)
- All role cells for the new permission start as unchecked

**Permission updated:**
- Update the specific permission in `permissions` list (update description, display in table)
- Matrix row description tooltip updates

**Permission deleted:**
- Remove from `permissions` list
- Matrix row disappears (animate out)
- `rolePermissionsMap`: remove this permission_id from all role sets

**Role created:**
- Add to `roles` list in local state
- Matrix gains a new column (animate in, all cells unchecked)
- If initial permissions were selected during creation, mark those cells as checked after the assign API calls succeed

**Role updated:**
- Update `roles` list (description)

**Role deleted:**
- Remove from `roles` list
- Matrix column disappears (animate out)
- `rolePermissionsMap`: remove the key for this role_id

**Permission assigned (checkbox checked):**
- Optimistically: `rolePermissionsMap[role_id].add(permission_id)`
- On API failure: `rolePermissionsMap[role_id].delete(permission_id)` + revert checkbox

**Permission revoked (checkbox unchecked):**
- Optimistically: `rolePermissionsMap[role_id].delete(permission_id)`
- On API failure: `rolePermissionsMap[role_id].add(permission_id)` + revert checkbox

### 7.3 Custom Hooks

```typescript
// hooks/usePermissions.ts
export function usePermissions() {
  // State: permissions[]
  // Actions: createPermission, updatePermission, deletePermission
  // Loading and error states per operation
}

// hooks/useRoles.ts
export function useRoles() {
  // State: roles[] (with user_count, permission_count)
  // Actions: createRole, updateRole, deleteRole
}

// hooks/useRolePermissions.ts
export function useRolePermissions() {
  // State: rolePermissionsMap: Record<number, Set<number>>
  // Actions: assignPermission, revokePermission
  // pendingCells: Set<string>  ← track "role_id:permission_id" cells in-flight
}
```

The `pendingCells` set is used to drive the indeterminate checkbox state. A cell is pending when its API call is in-flight.

```typescript
// Derive checkbox state
function getCellState(roleId: number, permissionId: number) {
  const key = `${roleId}:${permissionId}`;
  const isPending = pendingCells.has(key);
  const isAssigned = rolePermissionsMap[roleId]?.has(permissionId) ?? false;
  return { isAssigned, isPending };
}
```

---

## 8. UI State Standards

### 8.1 Page-Level Loading (Initial Load)

While all three parallel fetches are in-flight, show:

```
┌──────────────────────────────────────────────────────────────────┐
│  [Skeleton: Matrix header with 3 column skeletons]               │
│  [Skeleton: 5 permission row skeletons across 3 columns]         │
├──────────────────────────────────────────────────────────────────┤
│  [Skeleton: 5 table row skeletons for Permissions section]       │
├──────────────────────────────────────────────────────────────────┤
│  [Skeleton: 3 table row skeletons for Roles section]             │
└──────────────────────────────────────────────────────────────────┘
```

Use staggered skeleton animation so the three sections don't pulse in perfect sync (looks mechanical). Add `animation-delay: 0.1s` to Section B skeleton and `animation-delay: 0.2s` to Section C.

### 8.2 Individual Cell Loading (Matrix Checkbox)

While a single assign/revoke is in-flight:
- Set `indeterminate` property on the checkbox
- Disable the checkbox (prevent double-click)
- Do NOT show a spinner inside the cell — it's too small and too noisy with many rapid clicks

### 8.3 Bulk Operation Loading (Column-level assign all)

While a bulk column assign/revoke is running:
- Overlay a semi-transparent loading layer over the entire column
- Show a small spinner inside the column header
- Disable all checkboxes in that column
- Show progress text in the column header: "Saving... (7/12)"

```typescript
// Track bulk progress
const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
```

### 8.4 Error States

| Scenario | UI Response |
|---|---|
| Initial page load fails | Full-page error state with "Retry" button and error description |
| Single checkbox assign/revoke fails | Revert checkbox + toast "Failed to update — try again" |
| Create permission fails (name conflict) | Inline error in dialog: "A permission named `appointments.create` already exists" |
| Create role fails (name conflict) | Inline error in dialog: "A role named `billing_staff` already exists" |
| Delete fails (server error) | Toast error, row remains in table |
| Bulk assign partially fails | Toast: "Updated [X] of [N] permissions. [N-X] failed — reload and try again." |

### 8.5 Toast Notifications

All toasts: top-right, 4-second auto-dismiss.

| Action | Toast |
|---|---|
| Permission created | "Permission created — `appointments.create`" |
| Permission updated | "Permission updated" |
| Permission deleted | "Permission deleted" |
| Role created | "Role created — `billing_staff`" |
| Role updated | "Role updated" |
| Role deleted | "Role deleted" |
| Permission assigned | "Assigned `appointments.create` to Receptionist" |
| Permission revoked | "Revoked `appointments.create` from Receptionist" |
| Bulk assign complete | "All [N] permissions assigned to [Role]" |
| Any operation failed | "Operation failed — [reason]" |

Do not toast on every individual checkbox change if the user is rapidly clicking (it would be noise). Toast only on failures, and on bulk operations completing.

---

## 9. Required Backend Endpoints

The following endpoints do not exist yet or need to be extended. These are **required** for the RBAC page to function completely. Prioritize them before starting frontend integration.

---

### 9.1 GET all role-permission assignments in one call

**Why needed:** The matrix needs to know which permissions are assigned to which roles. Without this, the frontend would need to call `GET /api/v1/rbac/roles/{id}` (with permissions) per role separately — N+1 pattern that becomes slow as roles grow.

**Endpoint to create:**
```
GET /api/v1/rbac/roles/permissions/all
```

**Expected response:**
```json
{
  "assignments": [
    { "role_id": 1, "permission_id": 1 },
    { "role_id": 1, "permission_id": 2 },
    { "role_id": 2, "permission_id": 2 },
    { "role_id": 2, "permission_id": 3 }
  ]
}
```

This is a flat list of all rows in the `role_permissions` join table. The frontend converts it to the `RolePermissionsMap` structure. This avoids N+1 and is very fast to generate server-side (single `SELECT * FROM role_permissions`).

---

### 9.2 GET roles with user_count and permission_count

**Why needed:** The Roles table shows how many users have each role and how many permissions are assigned. This needs to come from the API — it cannot be derived from the loaded data without joining `users`.

**Extend existing endpoint:**
```
GET /api/v1/rbac/roles
```

**Add to each role object in response:**
```json
[
  {
    "id": 1,
    "name": "admin",
    "description": "Full system access",
    "user_count": 2,
    "permission_count": 24
  }
]
```

Server-side: add a subquery or JOIN to count `users WHERE role_id = roles.id` and count `role_permissions WHERE role_id = roles.id`.

---

### 9.3 GET users for a specific role

**Why needed:** The "Users" count badge in the Roles table opens a popover listing the users. The frontend needs the user list per role.

**Endpoint to create:**
```
GET /api/v1/rbac/roles/{id}/users
```

**Expected response:**
```json
[
  { "id": "uuid", "name": "John Smith", "email": "john@clinic.com", "is_active": true },
  { "id": "uuid", "name": "Sarah Lee", "email": "sarah@clinic.com", "is_active": true }
]
```

This popover is lazy-loaded — only fetched when the user clicks the badge, not on page load.

---

### 9.4 POST create a new role

**Why needed:** The current API has no endpoint to create roles (only `GET /api/v1/rbac/roles` exists).

**Endpoint to create:**
```
POST /api/v1/rbac/roles
Body: { "name": "billing_staff", "description": "Manages billing operations" }
Response: { "id": 4, "name": "billing_staff", "description": "..." }
```

Validation server-side: `name` must be unique, lowercase, no spaces.

---

### 9.5 PUT update a role

**Why needed:** Editing a role's description requires an update endpoint.

**Endpoint to create:**
```
PUT /api/v1/rbac/roles/{id}
Body: { "description": "Updated description" }
Response: { "id": 1, "name": "admin", "description": "Updated description" }
```

Note: `name` should NOT be updatable via this endpoint (same reason as permissions — names are used in code).

---

### 9.6 DELETE a role

**Why needed:** The Roles table needs a delete action.

**Endpoint to create:**
```
DELETE /api/v1/rbac/roles/{id}
Response: 204 No Content
```

Server-side guard: return `409 Conflict` if any users are still assigned to this role. Response body: `{ "error": "Cannot delete role — 3 users are assigned to it" }`. The frontend shows this error message in the confirmation dialog.

---

### 9.7 POST bulk assign permissions to a role (optional but recommended)

**Why needed:** The "Assign All" column action and the initial permissions selection in the Create Role dialog fire many individual assign calls in parallel. This works but generates N HTTP requests. A bulk endpoint reduces this to 1.

**Endpoint to create (optional):**
```
POST /api/v1/rbac/roles/{id}/permissions/bulk
Body: { "permission_ids": [1, 2, 3, 4, 5] }
Response: { "assigned": [1, 2, 3], "already_assigned": [4, 5], "failed": [] }
```

**Delete bulk (optional):**
```
DELETE /api/v1/rbac/roles/{id}/permissions/bulk
Body: { "permission_ids": [1, 2, 3] }
```

If these are not implemented, the frontend falls back to parallel individual calls. Flag this as a performance optimization, not a blocker.

---

## 10. API Quick Reference

| # | Method | Endpoint | Exists? | Used In |
|---|---|---|---|---|
| 1 | GET | `/api/v1/rbac/permissions` | ✅ Yes | Permissions table, Matrix rows |
| 2 | POST | `/api/v1/rbac/permissions` | ✅ Yes | Create Permission dialog |
| 3 | PUT | `/api/v1/rbac/permissions/{id}` | ✅ Yes | Edit Permission dialog |
| 4 | DELETE | `/api/v1/rbac/permissions/{id}` | ✅ Yes | Delete Permission dialog |
| 5 | GET | `/api/v1/rbac/roles` | ✅ Yes (extend with user_count, permission_count) | Roles table, Matrix columns |
| 6 | POST | `/api/v1/rbac/roles/{id}/permissions` | ✅ Yes | Matrix checkbox (assign) |
| 7 | DELETE | `/api/v1/rbac/roles/{id}/permissions/{permission_id}` | ✅ Yes | Matrix checkbox (revoke) |
| 8 | GET | `/api/v1/rbac/roles/permissions/all` | ⚠️ **Create** | Matrix initial load — all assignments flat list |
| 9 | GET | `/api/v1/rbac/roles/{id}/users` | ⚠️ **Create** | Roles table — users popover (lazy) |
| 10 | POST | `/api/v1/rbac/roles` | ⚠️ **Create** | Create Role dialog |
| 11 | PUT | `/api/v1/rbac/roles/{id}` | ⚠️ **Create** | Edit Role dialog |
| 12 | DELETE | `/api/v1/rbac/roles/{id}` | ⚠️ **Create** | Delete Role dialog |
| 13 | POST | `/api/v1/rbac/roles/{id}/permissions/bulk` | ⚠️ **Optional** | Column bulk assign |
| 14 | DELETE | `/api/v1/rbac/roles/{id}/permissions/bulk` | ⚠️ **Optional** | Column bulk revoke |

**Legend:**
- ✅ Yes = endpoint exists
- ⚠️ Create = must be built before frontend integration
- ⚠️ Optional = improves performance but has a fallback

---

*MediSync Admin RBAC Page Frontend Spec — Version 1.0 — April 2026 — Internal Use Only*