# Gamma KYE — System Testing Guide

## Test Accounts

| Role | Email | Password | What to expect |
|------|-------|----------|----------------|
| Tenant Admin / CEO | `rajesh.ceo@novatech.com` | `password123` | Full access to everything |
| HR Manager | `kavita.hr@novatech.com` | `password123` | Employee management + settings |
| Department Manager | `techlead@acme.com` | `password123` | View employees, approve for team |
| Regular Employee | `employee1@acme.com` | `password123` | Self-service only |

---

## 1. LOGIN & AUTHENTICATION

### Test: Login flow
1. Go to `http://<tenant>.lvh.me:3000/login`
2. Enter email + password → Click **Login**
3. On success → Redirect to `/dashboard`
4. On failure → Error message under form

### Test: Logout
1. Click **Logout** button in sidebar footer
2. Tokens cleared → Redirect to `/login`
3. Going to any page without login → Redirect to `/login`

### Test: User switch
1. Login as User A → Go to Attendance/Leaves
2. Logout → Login as User B
3. **Verify**: Attendance/Leaves show User B's data (not cached from User A)

---

## 2. SIDEBAR NAVIGATION

### What each role sees:

| Sidebar Item | Employee | Dept Manager | HR Manager | HR Director | Tenant Admin |
|---|---|---|---|---|---|
| Dashboard | Yes | Yes | Yes | Yes | Yes |
| My Profile | Yes | Yes | Yes | Yes | Yes |
| Employees | Yes | Yes | Yes | Yes | Yes |
| Leaves | Yes | Yes | Yes | Yes | Yes |
| Attendance | Yes | Yes | Yes | Yes | Yes |
| Approvals | Yes | Yes | Yes | Yes | Yes |
| Organization | Yes | Yes | Yes | Yes | Yes |
| Payroll | No | No | No | No | Yes |
| Reports | No | No | No | No | Yes |
| Settings | No | No | Yes | Yes | Yes |

### How it works:
- Top 7 items are **always visible** to all authenticated users
- `resource: "payroll"` / `resource: "report"` → Checks `canAccessModule()` (any permission on resource)
- Settings → Visible if user has ANY of: `tenant_settings`, `leave_type`, `shift`, `role`, `workflow`, `audit_log`

---

## 3. DASHBOARD (`/dashboard`)

### Sections visible to everyone:
- **Quick Stats Row**: Total Employees, On Leave Today, Pending Approvals, My Requests
- **Announcements** (dummy data)

### Sections visible to employees only (has Employee role):
- **Today's Attendance Card** — clock in time, clock out time, hours worked
- **Leave Balances** — color-coded cards per leave type
- **Monthly Attendance Summary** — present, absent, on leave, late counts

### Right sidebar widgets:
- **Upcoming Holidays** — next 5 holidays from calendar
- **Team on Leave Today** — only shows direct reports on leave (not entire org)
- **Pending Approvals** — only shows approvals assigned to current user
- **Work Anniversaries** (dummy data)
- **Department Members** — first 6 colleagues in same department

### Test: Data scoping
1. Login as CEO → Dashboard shows CEO's own attendance, CEO's own leave balances
2. "On Leave Today" count → Only CEO's direct reports
3. "Pending Approvals" → Only approvals where CEO is the current step approver

---

## 4. EMPLOYEES (`/employees`)

### Employee List

| Element | Condition | Who sees it |
|---------|-----------|-------------|
| Employee list | Always visible | Everyone |
| **Onboard Employee** button | `canWithScope("employee", "create", "department")` | **Tenant Admin, HR Director, HR Manager** |
| Click on employee row | Always works | Opens detail page |

### Test: Onboard button visibility
1. Login as **Employee** → Go to `/employees` → **NO** "Onboard Employee" button
2. Login as **Department Manager** → Go to `/employees` → **NO** "Onboard Employee" button (team scope only)
3. Login as **HR Manager** → Go to `/employees` → **YES** "Onboard Employee" button visible
4. Login as **HR Director** → Go to `/employees` → **YES** "Onboard Employee" button visible
5. Login as **Tenant Admin** → Go to `/employees` → **YES** "Onboard Employee" button visible

### Test: Data source
- Admin users → Fetches from `/manage/employees` (full data)
- Non-admin users → Falls back to `/employees` directory (limited fields)
- Both show the same list UI

---

## 5. EMPLOYEE DETAIL (`/employees/:id`)

### Section visibility by role:

| Section | Employee (self) | Employee (other) | Dept Manager | HR Manager | HR Director | Tenant Admin |
|---------|----------------|------------------|-------------|-----------|------------|-------------|
| **Contact** (email, phone) | Yes | Yes | Yes | Yes | Yes | Yes |
| **Organization** (designation, dept, location, manager) | Yes | Yes | Yes | Yes | Yes | Yes |
| **Personal Details** (DOB, gender, blood group, nationality) | Yes (self) | **No** | **No** | Yes | Yes | Yes |
| **Employment** (status, type, join date, grade) | Yes (self) | **No** | **No** | Yes | Yes | Yes |
| **User Account** (login email, roles, status) | Yes (self) | **No** | **No** | Yes | Yes | Yes |
| **Shift Assignment** | No | No | **No** | No | Yes (`shift:update`) | Yes |
| **Roles** | No | No | No | No | No | Yes (`role:assign`) |
| **Account Actions** (password, lock) | No | No | No | Yes | Yes | Yes |

### Action buttons (header):

| Button | Permission check | Who sees it |
|--------|-----------------|-------------|
| **Edit** | `employee:update:department` + not self (unless global) | Dept Mgr (own dept), HR Mgr, HR Dir, Admin |
| **Promote** | `employee:update:global` | HR Mgr, HR Dir, Admin |
| **Transfer** | `employee:update:global` | HR Mgr, HR Dir, Admin |
| **Change Manager** | `employee:update:global` | HR Mgr, HR Dir, Admin |
| **Offboard** | `employee:delete` | HR Mgr, HR Dir, Admin |
| **Shift Assignment** | `shift:update` | HR Dir, Admin |
| **Roles** | `role:assign` | Admin only |
| **Account Actions** | `employee:update:global` | HR Mgr, HR Dir, Admin |

### How it works:
```
hasGlobalUpdate = canWithScope("employee", "update", "global")
hasDeptUpdate = canWithScope("employee", "update", "department")
canEditBasic = hasGlobalUpdate || (hasDeptUpdate && !isSelf)
canDoGlobalActions = hasGlobalUpdate
canOffboard = can("employee", "delete")
canManageShift = can("shift", "update")
canAssignRoles = can("role", "assign")
canViewPrivate = isSelf || hasGlobalUpdate
```
- **Tenant Admin (global)**: all sections + all buttons on everyone including self
- **HR Director (global employee, shift:update)**: all sections + most buttons, shift assignment
- **HR Manager (global employee, no shift:update)**: all sections + global actions, NO shift
- **Dept Manager (department employee)**: Edit basic fields only, NO private info, NO global actions
- **Employee (self)**: private info visible, NO action buttons
- **Employee (other)**: public info only

### Test: Self profile vs others
1. Login as Employee A → Go to `/employees/<A's ID>` → See all personal info, NO buttons
2. Login as Employee A → Go to `/employees/<B's ID>` → Only Contact + Organization
3. Login as HR Manager → Go to `/employees/<anyone else>` → Everything visible + all buttons
4. Login as HR Manager → Go to own profile → See private info, NO action buttons
5. Login as Tenant Admin → Go to `/employees/<anyone>` → Everything + buttons
6. Login as Tenant Admin → Go to own profile → Everything + buttons (global can manage self)
7. Login as Dept Manager → Go to `/employees/<team member>` → Only Contact + Organization, NO buttons

### Account Actions section:

| Button | Condition | Action |
|--------|-----------|--------|
| **Set Password** | `user:update:global` scope | Opens password form |
| **Deactivate** | Account status is `active` | Sets status to `inactive` |
| **Activate** | Account status is `inactive` | Sets status to `active` |
| **Lock** | Account status is not `locked` | Sets status to `locked` |
| **Unlock** | Account status is `locked` | Sets status to `active` |

### Shift Assignment panel:

| Button | Condition |
|--------|-----------|
| **Assign Shift** / **Change Shift** | `<Can resource="employee" action="update" minScope="department">` |
| **Remove** | Same as above |
| Shift dropdown | Only shows active shifts |

---

## 6. ONBOARD WIZARD (`/employees/new`)

### Prerequisites:
- Only accessible if `canWithScope("employee", "create", "global")`
- Redirects unauthorized users

### 8 Steps:
1. **Basic Info** — first name, last name, email, phone, date of joining, gender, password
2. **Org Assignment** — company, department (filtered by company), designation, location
3. **Reporting** — manager dropdown (same dept first, then others)
4. **Role & Access** — select system roles (Employee auto-assigned)
5. **Employment** — employment type, grade
6. **Policy** — auto-assigned leave/attendance policies (read-only preview)
7. **Documents** — file upload (optional, skip-able)
8. **Review** — summary of all fields, submit button

### Validation:
- Per-step validation before allowing "Next"
- Backend errors mapped to correct step (auto-navigates to the step with error)

---

## 7. ATTENDANCE (`/attendance`)

### Who sees this page:
- Anyone with `Employee` role in sidebar

### Top Row — 3 cards:

| Card | Content |
|------|---------|
| **Attendance Stats** | Avg hours/day, On-time arrival %, Monthly present/absent/leave/late |
| **Timings** | Shift name, shift hours (e.g. 09:00 AM – 06:00 PM, 8h/day), week day dots (weekly offs struck through), today's progress bar |
| **Actions** | Live clock with seconds, Clock In/Clock Out button, 24h format toggle |

### Clock buttons:

| State | Button shown |
|-------|-------------|
| Not clocked in | **Clock In** (primary) |
| Clocked in, not out | **Clock Out** (secondary) |
| Both done | "Day Complete" badge (green) |

### Logs & Requests section:

Two tabs: **Attendance Log** | **Attendance Requests**

**Attendance Log tab:**

| Column | Content |
|--------|---------|
| Date | "Tue, 14 Apr" + W-OFF/Holiday/Leave badge |
| Attendance Visual | Timeline bar (6 AM – 10 PM scale) with tick marks |
| Gross Hours | "8h 50m" |
| Arrival | Green checkmark "On Time" OR Yellow warning "58m late" |
| Actions | Regularize button / Reg status badge / Regularized badge |

**Regularize button visibility:**

| Condition | Show button |
|-----------|-------------|
| Has anomaly (late, early exit, absent, missing clock) AND not regularized AND no pending/approved reg request | **Yes** |
| Already regularized | Shows "Regularized" badge |
| Pending/approved reg request exists | Shows "Reg: pending" badge with cancel (×) |
| Cancelled/rejected reg request | Shows Regularize button again (re-submit) |

**Month selector:** Pills for last 7 months (e.g. APR, MAR, FEB, JAN, DEC, NOV, OCT)

### Data scoping:
- All attendance data is current user only (`/api/v1/attendance/*` endpoints)
- Shift data from employee's assigned shift, fallback to default shift

---

## 8. LEAVES (`/leaves`)

### Who sees this page:
- Anyone with `Employee` role AND `leave_request` permission

### Layout (top to bottom):

**1. "Request Leave" button** — top right, always visible, opens modal form

**2. Pending Leave Requests** — cards for each pending request:

| Element | Content |
|---------|---------|
| Date range | "17 Apr 2026 - 18 Apr 2026 (2 days)" |
| Leave Type | "Sick Leave" |
| Requested On | "14 Apr 2026" |
| Status | "Pending" + "View Approvers" link |
| Leave Note | Reason text |
| **Cancel** button | Always visible on pending requests |

Cancel flow: Click Cancel → Inline input for cancellation reason → Confirm / Back

**3. My Leave Stats** — 3 visualization cards:

| Card | Visual | Data |
|------|--------|------|
| Weekly Pattern | Bar chart by day of week (Mon-Sun) | Days on leave per weekday |
| Consumed Leave Types | Donut chart | Breakdown by type from approved requests |
| Monthly Stats | Bar chart (Jan-Dec) | Leave days per month |

**4. Leave Balances** — per leave type cards:

| Element | Content |
|---------|---------|
| Ring chart | Available (colored arc) / Consumed (grey) |
| Center text | Available count + "Available" |
| Right side | "Available: X days" + "Consumed: Y days" |
| Bottom grid | AVAILABLE, CONSUMED, ACCRUED SO FAR, ANNUAL QUOTA |

- Consumed = `Math.max(balance.used from API, computed from approved requests)`
- Types with 0 entitled + 0 used → Listed under "Other Leave Types Available"

**5. Leave History** — full table:

| Filter | Options |
|--------|---------|
| Leave Type dropdown | All types from request history |
| Status dropdown | All / Pending / Approved / Rejected / Cancelled |
| Search box | Searches type name and reason |

| Column | Content |
|--------|---------|
| Leave Dates | Date range + day count |
| Leave Type | Type name |
| Status | Colored badge |
| Requested On | Date |
| Leave Note | Reason text |
| Actions | Cancel button (only for `pending` status) |

### Data scoping:
- Leave balances → `/api/v1/leave_requests/balances` (user-scoped)
- Leave requests → Filtered client-side by `employee.id === myEmployeeId`
- Stats computed from approved requests only

### Request Leave modal form:

| Field | Type | Validation |
|-------|------|------------|
| Leave Type | Dropdown (from balances) | Required |
| Start Date | Date picker | Required |
| End Date | Date picker | Required, >= Start Date |
| Half Day (single day) | Dropdown: Full Day / First Half / Second Half | Optional |
| Start Half + End Half (multi-day) | Two dropdowns | Optional |
| Leave Note | Text input | Required |

---

## 9. APPROVALS (`/approvals`)

### Tabs:

| Tab | Visible to | Data |
|-----|-----------|------|
| **My Requests** | Everyone | Workflow instances initiated by current user |
| **Pending Approvals** | Users with `leave_request:approve` permission | Workflow instances awaiting current user's action |
| **All** | Users with `workflow:read:global` scope | All workflow instances (admin only) |

### Approval list:
- Each item shows: entity type, status badge, initiator name, step number, created date
- Click → Opens detail page

### Approval detail (`/approvals/:id`):
- **Step Timeline** — visual timeline showing each step with: step number, approver type, assigned person, status, comments, acted date
- **Action buttons** (only for assigned approver of current pending step):

| Button | Condition |
|--------|-----------|
| **Approve** | Current user is assigned approver of pending step |
| **Reject** | Current user is assigned approver of pending step |
| **Cancel Request** | Current user is initiator OR has `workflow:read:global` scope |

- Comments textarea for approve/reject

---

## 10. ORGANIZATION (`/org-structure`)

### Tabs:

| Tab | Visible to | Content |
|-----|-----------|---------|
| **My Team** | Users with Employee role | Manager → Me → Peers → Direct Reports |
| **Organization Tree** | Users with `employee` module access | Full recursive org tree |

### My Team view:
- **Manager card** at top (or "No reporting manager" if top-level)
- **Connector line** down
- **Current user** (highlighted with ring) + Peers side by side
- **Direct Reports** below current user (if any)
- Click any card → Opens employee detail in new tab

### Organization Tree view:
- **Search bar** — filters by name, designation, department, email
- **Expand All / Collapse All** buttons
- **Employee count** display
- **Recursive tree** — each node shows: expand/collapse chevron, avatar initials, name, designation, department
- Root nodes = employees with no reporting manager
- Current user highlighted in tree

---

## 11. MY PROFILE (`/my-profile`)

### Who sees this:
- Anyone with `Employee` role

### 4 Tabs:
1. **Overview** — employee info + editable phone/email fields
2. **Personal Details** — address, emergency contact
3. **Leave Balances** — color-coded balance cards
4. **Attendance** — month stats summary

---

## 12. SETTINGS (`/settings`)

### Who sees this:
- Any user with at least ONE of these permissions: `tenant_settings`, `leave_type`, `shift`, `role`, `workflow`, `audit_log`
- Typically: Tenant Admin, HR Director, HR Manager

### Settings sub-navigation (per-page permission gating):

| Page | Permission Check | Visible to |
|------|-----------------|------------|
| **General** | `tenant_settings:read` | Admin only |
| **Companies** | `company:read:global` | Admin, HR Dir |
| **Departments** | `company:read:global` | Admin, HR Dir |
| **Designations** | `company:read:global` | Admin, HR Dir |
| **Locations** | `company:read:global` | Admin, HR Dir |
| **Grades** | `company:read:global` | Admin, HR Dir |
| **Business Units** | `company:read:global` | Admin, HR Dir |
| **Shifts** | `shift:read` | Admin, HR Dir, HR Mgr, Dept Mgr |
| **Overtime Rules** | `overtime_rule:read` | Admin, HR Dir, HR Mgr |
| **Leave Types** | `leave_type:read` | Admin, HR Dir, HR Mgr |
| **Leave Policies** | `leave_policy:read` | Admin, HR Dir, HR Mgr |
| **Holiday Calendars** | `holiday_calendar:read` | Admin, HR Dir, HR Mgr |
| **Roles** | `role:read:global` | Admin only |
| **Workflows** | `workflow:read` | Admin, HR Dir, HR Mgr (read-only) |
| **Audit Logs** | `audit_log:read:global` | Admin, HR Dir |

Each page only appears in the left nav if the user has the required permission. Groups with no visible pages are hidden entirely.

### Role list buttons:

| Button | Condition |
|--------|-----------|
| **Create Role** | `can("role", "create")` |
| **Edit** | `can("role", "update")` AND NOT system role |
| **Delete** | `can("role", "delete")` AND NOT system role |

System roles (Tenant Admin, Employee, etc.) cannot be edited or deleted.

---

## 13. PERMISSION SYSTEM REFERENCE

### Scope hierarchy (broadest → narrowest):
```
global > department > team > self
```

### How scope check works:
- `canWithScope("employee", "update", "department")` returns `true` if user has:
  - `employee:update:global` ✓ (global >= department)
  - `employee:update:department` ✓ (exact match)
  - `employee:update:team` ✗ (team < department)
  - `employee:update:self` ✗ (self < department)

### Key permission checks in the app:

| Check | Where used | Who passes |
|-------|-----------|------------|
| `canWithScope("employee", "create", "department")` | Onboard button | HR Mgr, HR Dir, Admin |
| `canWithScope("employee", "update", "department")` | Edit basic fields | Dept Mgr (own dept), HR Mgr, HR Dir, Admin |
| `canWithScope("employee", "update", "global")` | Promote, Transfer, Change Manager, Set Password | HR Mgr, HR Dir, Admin |
| `can("employee", "delete")` | Offboard button | HR Mgr, HR Dir, Admin |
| `can("role", "assign")` | Roles tab on employee detail | Admin only |
| `can("role", "create")` | Create Role button | Admin |
| `can("role", "update")` | Edit Role button | Admin |
| `can("leave_request", "approve") or can("attendance_regularization", "approve")` | Pending Approvals tab | Dept Mgr, HR Mgr, HR Dir, Admin |
| `canWithScope("workflow", "read", "global")` | All Approvals tab | Admin only |
| Any of `[tenant_settings, leave_type, shift, role, workflow, audit_log]` | Settings sidebar | HR Mgr, HR Dir, Admin |
| `canWithScope("employee", "update", "global")` | Account actions (password, lock) | HR Mgr, HR Dir, Admin |

---

## 14. DATA SCOPING RULES

| Data | Scoping method |
|------|---------------|
| **Attendance records** | Backend-scoped by token → `/api/v1/attendance/*` |
| **Leave balances** | Backend-scoped → `/api/v1/leave_requests/balances` |
| **Leave requests** | Client-side filtered by `employee.id === myEmployeeId` (backend may return org-wide for HR/admin — frontend shows only own) |
| **Regularizations** | Backend-scoped → `/api/v1/attendance_regularizations` |
| **Approvals (my requests)** | Backend param `my_requests=true` |
| **Approvals (pending)** | Backend param `my_pending=true` |
| **Team on leave (dashboard)** | Client-side: approved leaves → filtered to direct reports via org tree |
| **Employee list** | Admin → `/manage/employees`; Others → `/employees` (directory) |

---

## 15. EDGE CASES TO TEST

### Authentication
- [ ] Login with wrong password → error message
- [ ] Access protected page without login → redirect to login
- [ ] Token expiry → auto-refresh or redirect to login
- [ ] Login as User A, logout, login as User B → all data refreshes (no stale cache)

### Employee Management
- [ ] Onboard employee with minimal fields → should work
- [ ] Onboard employee with duplicate email → should show error
- [ ] View employee as non-admin → no edit/promote/offboard buttons visible
- [ ] View own employee profile → personal details visible, no admin buttons
- [ ] Admin views own profile → all sections + buttons visible
- [ ] Offboard employee → status changes, action buttons disappear (not active)

### Leave Requests
- [ ] Apply leave with invalid dates (end before start) → field error
- [ ] Apply half-day leave (single day) → half day selector appears
- [ ] Cancel pending leave → requires reason
- [ ] View leave stats after applying → consumed types donut updates
- [ ] Admin sees only own leave requests, not entire org

### Attendance
- [ ] Clock in → button changes to "Clock Out"
- [ ] Clock out → shows "Day Complete"
- [ ] Late arrival → yellow warning badge on log row
- [ ] Regularize button → only on anomaly rows
- [ ] Submit regularization → form disappears, shows "Reg: pending" badge
- [ ] Cancel regularization → button reappears for re-submit

### Approvals
- [ ] Employee sees only "My Requests" tab
- [ ] Manager sees "My Requests" + "Pending Approvals" tabs
- [ ] Admin sees all 3 tabs
- [ ] Approve workflow step → step status changes, moves to next step
- [ ] Reject workflow step → workflow terminates

### Settings
- [ ] Non-admin tries to access /settings → should not see it in sidebar
- [ ] Edit tenant settings → saves timezone, currency, etc.
- [ ] Create/edit/delete leave types → reflects in leave balance cards
- [ ] System roles → Edit and Delete buttons hidden
- [ ] Custom roles → Edit and Delete buttons visible

### Organization
- [ ] Employee with no manager → shows "No reporting manager" in My Team
- [ ] Employee with no direct reports → hides "Direct Reports" section
- [ ] Search in org tree → filters by name/designation/department
- [ ] Expand/collapse nodes → maintains state
