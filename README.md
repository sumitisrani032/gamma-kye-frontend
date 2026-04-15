# Gamma KYE — Modern HR Management Platform

A production-grade, multi-tenant HRMS frontend built with Next.js 16, React 19, and TypeScript. Designed as a Keka-like HR platform with full RBAC, subdomain-based tenant isolation, and modular feature architecture.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.3 | App Router, SSR, file-based routing |
| React | 19.2.4 | UI framework |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| Rails API | 8.x | Backend (separate repo) |

---

## Prerequisites

- Node.js 20+ and npm/yarn/pnpm
- Rails backend running on port 3001 (separate repo)
- `lvh.me` resolves to `127.0.0.1` (it does by default — no `/etc/hosts` needed)

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd gamma-kye-frontend
npm install
```

### 2. Environment setup

Create `.env.local` (or copy from existing `.env.development`):

```env
NEXT_PUBLIC_BASE_DOMAIN=lvh.me
NEXT_PUBLIC_API_PORT=3001
NEXT_PUBLIC_PROTOCOL=http
```

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_BASE_DOMAIN` | Root domain for subdomain routing | `lvh.me` |
| `NEXT_PUBLIC_API_PORT` | Backend API port | `3001` |
| `NEXT_PUBLIC_PROTOCOL` | `http` for local, `https` for production | `http` |

### 3. Start the backend

Ensure the Rails backend is running:

```bash
cd ../gamma-kye-backend
rails s -p 3001
```

### 4. Start the frontend

```bash
npm run dev
```

The app starts on `http://lvh.me:3000`

### 5. Access a tenant

Navigate to a tenant subdomain:

```
http://acme.lvh.me:3000/login
http://novatech.lvh.me:3000/login
```

---

## Multi-Tenant Architecture

The app uses **subdomain-based tenant isolation**:

```
                  ┌──────────────────────────────────┐
                  │         lvh.me:3000               │
                  │  (Root — Tenant registration)     │
                  └──────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
  acme.lvh.me:3000   novatech.lvh.me   company.lvh.me
  (Tenant A)         (Tenant B)         (Tenant C)
          │               │               │
          └───────┬───────┘               │
                  │                       │
          acme.lvh.me:3001          company.lvh.me:3001
          (API for Tenant A)        (API for Tenant C)
```

- **Frontend** reads subdomain from `window.location.hostname`
- **API calls** include the subdomain in the URL (e.g., `http://acme.lvh.me:3001/api/v1/...`)
- **Backend** resolves tenant from the subdomain header
- **Tokens** stored in localStorage per domain (naturally isolated per subdomain)

---

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── dashboard/                # Dashboard with widgets
│   ├── employees/                # Employee list + detail + onboard wizard
│   │   ├── [id]/                 # Employee detail (dynamic route)
│   │   └── new/                  # Onboard wizard
│   ├── attendance/               # Attendance tracking
│   ├── leaves/                   # Leave management
│   ├── approvals/                # Workflow approvals
│   │   └── [id]/                 # Approval detail
│   ├── my-profile/               # Employee self-service profile
│   ├── my-documents/             # Employee document upload
│   ├── policies/                 # Policy viewing + acknowledgement
│   ├── org-structure/            # Org hierarchy tree + my team
│   ├── login/                    # Authentication
│   ├── register/                 # Tenant registration
│   ├── setup/                    # Org setup wizard
│   └── settings/                 # Admin settings hub
│       ├── layout.tsx            # Shared settings layout with sub-nav
│       ├── companies/
│       ├── departments/
│       ├── designations/
│       ├── locations/
│       ├── grades/
│       ├── business-units/
│       ├── shifts/
│       ├── overtime-rules/
│       ├── leave-types/
│       ├── leave-policies/
│       ├── holiday-calendars/
│       ├── roles/
│       ├── workflows/
│       ├── audit-logs/
│       ├── policy-documents/
│       ├── document-requirements/
│       └── document-verifications/
│
├── features/                     # Feature modules (hooks + components)
│   ├── employees/                # Employee management
│   │   ├── hooks/                #   use-employees, use-employee-detail, use-onboard-wizard
│   │   ├── components/           #   employee-list, employee-detail-view, onboard-wizard, steps/
│   │   └── types/                #   onboard wizard types
│   ├── attendance/               # Attendance + regularization
│   ├── leaves/                   # Leave requests + balances
│   ├── approvals/                # Workflow instance management
│   ├── dashboard/                # Dashboard widgets + hook
│   ├── my-profile/               # Self-service profile
│   ├── my-documents/             # Employee document upload
│   ├── policies/                 # Employee policy view
│   ├── policy-documents/         # Admin policy CRUD
│   ├── document-requirements/    # Admin doc template CRUD
│   ├── document-verifications/   # HR doc verification
│   ├── org-structure/            # Org tree + my team
│   │   ├── services/             #   org-service (data fetching)
│   │   ├── utils/                #   build-tree (pure logic)
│   │   ├── hooks/                #   use-org-tree, use-my-team
│   │   └── components/           #   org-tree, my-team-view, org-node-card
│   ├── notifications/            # Bell + panel
│   ├── auth/                     # Login
│   ├── tenant/                   # Tenant registration
│   ├── setup/                    # Org setup wizard
│   ├── roles/                    # Role management
│   ├── users/                    # User management
│   ├── workflows/                # Workflow definitions
│   ├── audit-logs/               # Audit log viewer
│   ├── companies/                # Company CRUD
│   ├── departments/              # Department CRUD
│   ├── designations/             # Designation CRUD
│   ├── locations/                # Location CRUD
│   ├── grades/                   # Grade CRUD
│   ├── business-units/           # Business unit CRUD
│   ├── shifts/                   # Shift CRUD
│   ├── leave-types/              # Leave type CRUD
│   ├── leave-policies/           # Leave policy CRUD
│   ├── holiday-calendars/        # Holiday calendar CRUD
│   ├── overtime-rules/           # Overtime rule CRUD
│   ├── tenant-settings/          # Tenant settings form
│   └── attachments/              # File upload component + hook
│
├── services/                     # API service layer (32 services)
│   ├── api-client.ts             # Base fetch wrapper with token refresh + 403 intercept
│   ├── auth-service.ts           # Login, logout, register, getMe
│   ├── employee-service.ts       # Employee CRUD + actions
│   ├── attendance-service.ts     # Clock in/out, records, summary
│   ├── leave-request-service.ts  # Leave balances, requests, apply, cancel
│   ├── policy-document-service.ts# Policy CRUD + acknowledge
│   └── ... (30+ more)
│
├── components/                   # Shared UI components
│   ├── ui/                       # Design system (Button, Card, Input, Select, Alert, Stepper)
│   ├── common/                   # Protected route, Can (permission gate), StatusBadge
│   └── layout/                   # TenantSidebar, TopBar, SettingsNav
│
├── contexts/                     # React contexts
│   └── auth-context.tsx          # Auth state, permissions, user, tenant
│
├── lib/                          # Utilities
│   ├── permissions.ts            # RBAC: can, canWithScope, getScope, canAccessModule
│   ├── tokens.ts                 # localStorage token management
│   └── tenant.ts                 # Subdomain routing utilities
│
└── types/
    └── index.ts                  # All TypeScript interfaces (~1200 lines)
```

### Architecture Pattern

```
Page (route) → Feature Component → Hook → Service → API Client → Backend
                     ↑                        ↑
              UI Components            Types (shared)
              (from /components/ui)    (from /types)
```

- **Pages** — Thin route wrappers with layout (sidebar, topbar)
- **Feature Components** — UI rendering, no direct API calls
- **Hooks** — Data fetching, state management, error handling
- **Services** — Pure API call functions, typed request/response
- **API Client** — Base fetch with auth headers, token refresh, 403 redirect

---

## Available Scripts

```bash
npm run dev       # Start dev server (port 3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint check
```

---

## Modules

### Core Modules

| Module | Path | Description |
|---|---|---|
| **Dashboard** | `/dashboard` | Widgets: attendance, leave balances, team on leave, holidays, approvals, announcements |
| **Employees** | `/employees` | Company directory (all roles), onboard wizard (HR+), detail view with tiered actions |
| **Attendance** | `/attendance` | Clock in/out, shift timings, attendance log with visual bars, regularization |
| **Leaves** | `/leaves` | Leave balances with ring charts, apply leave, stats, history table |
| **Approvals** | `/approvals` | My Requests / Pending Approvals / All tabs, step timeline, approve/reject |
| **My Profile** | `/my-profile` | Personal info, leave balances, attendance summary |
| **Organization** | `/org-structure` | My Team view + full org tree with search |
| **Policies** | `/policies` | View published policies, acknowledge with confirmation |
| **My Documents** | `/my-documents` | Requirements checklist, upload documents, re-upload rejected |

### Admin Settings Modules

| Module | Path | Permission |
|---|---|---|
| **General Settings** | `/settings` | `tenant_settings:read` |
| **Companies** | `/settings/companies` | `company:read:global` |
| **Departments** | `/settings/departments` | `company:read:global` |
| **Designations** | `/settings/designations` | `company:read:global` |
| **Locations** | `/settings/locations` | `company:read:global` |
| **Grades** | `/settings/grades` | `company:read:global` |
| **Business Units** | `/settings/business-units` | `company:read:global` |
| **Shifts** | `/settings/shifts` | `shift:read` |
| **Overtime Rules** | `/settings/overtime-rules` | `overtime_rule:read` |
| **Leave Types** | `/settings/leave-types` | `leave_type:read` |
| **Leave Policies** | `/settings/leave-policies` | `leave_policy:read` |
| **Holiday Calendars** | `/settings/holiday-calendars` | `holiday_calendar:read` |
| **Policy Documents** | `/settings/policy-documents` | `policy_document:read:global` |
| **Doc Requirements** | `/settings/document-requirements` | `document_requirement:read:global` |
| **Doc Verifications** | `/settings/document-verifications` | `employee_document:verify` |
| **Roles** | `/settings/roles` | `role:read:global` |
| **Workflows** | `/settings/workflows` | `workflow:read` |
| **Audit Logs** | `/settings/audit-logs` | `audit_log:read:global` |

---

## RBAC System

### Permission Model

```
Permission = { resource, action, scope }

Scope Hierarchy: global > department > team > self
```

### Permission Functions

```typescript
can("employee", "create")                          // Has permission (any scope)
canWithScope("employee", "update", "department")   // Has at least department scope
getScope("employee", "update")                     // Returns broadest scope
canAccessModule("payroll")                         // Any permission on resource
```

### `<Can>` Component

```tsx
<Can resource="employee" action="update" minScope="department">
  <Button>Edit</Button>
</Can>
```

### Role Access Matrix

| Feature | Employee | Dept Manager | HR Manager | HR Director | Tenant Admin |
|---|---|---|---|---|---|
| View employees (directory) | All | All | All | All | All |
| View employee detail | Public only | Public only | Full | Full | Full |
| Edit employee | No | Own dept basic | Global | Global | Global |
| Onboard | No | No | Yes | Yes | Yes |
| Promote/Transfer/Offboard | No | No | Yes | Yes | Yes |
| Assign roles | No | No | No | No | Yes |
| View own attendance/leaves | Yes | Yes | Yes | Yes | Yes |
| Approve requests | No | Team/dept | Dept/global | Global | Global |
| Settings access | No | No | Partial | Most | Full |

---

## Tenant Onboarding Flow

```
1. Register tenant     →  POST /auth/register/tenant
2. Redirect to setup   →  /setup (13-step wizard)
3. Complete setup       →  POST /tenant/complete_setup
4. Dashboard            →  /dashboard
```

### Setup Wizard Steps
1. Companies
2. Locations
3. Departments
4. Designations
5. Grades
6. Business Units
7. Shifts
8. Overtime Rules
9. Leave Types
10. Leave Policies
11. Holiday Calendars
12. Workflows
13. Review & Complete

---

## Employee Onboarding Flow

```
1. HR clicks "Onboard Employee"  →  /employees/new
2. 8-step wizard                 →  Basic Info → Org → Reporting → Roles → Employment → Policy → Documents → Review
3. Employee created              →  Auto-assigned: default shift, leave policies, Employee role
4. Set password                  →  Employee can now login
```

---

## Key Features

### Dashboard
- Time-based greeting ("Good morning, Rajesh")
- Quick stats: Total employees, On leave today, Pending approvals, My requests
- Today's attendance card with clock in/out
- Leave balance cards with color coding
- Monthly attendance summary (present/absent/leave/late)
- Upcoming holidays (next 5)
- Team on leave today (direct reports only)
- Work anniversaries (dummy data)
- Department members
- Announcements feed (dummy data)

### Attendance (Keka-style)
- **Stats card**: Avg hours/day, On-time arrival %
- **Timings card**: Shift name + schedule, week day dots (weekly offs struck through), progress bar
- **Actions card**: Live clock with seconds, Clock In/Out button, 24h format toggle
- **Attendance Log**: Visual timeline bars, gross hours, arrival status (on time/late), regularize action
- **Month pills**: Quick jump last 7 months
- **Regularization**: Inline form on anomaly rows, re-submit after cancel/reject

### Leaves (Keka-style)
- Pending requests as prominent cards with cancel action
- Leave stats: Weekly pattern bars, Consumed types donut, Monthly stats bars
- Balance cards with ring charts: available/consumed/accrued/quota
- Leave history table with type/status/search filters
- Request leave modal with half-day support

### Document Management
- **Policy Documents**: Create draft → Publish → Acknowledge tracking with compliance report
- **Document Requirements**: Define required docs (Aadhaar, PAN, etc.)
- **My Documents**: Requirements checklist, upload, re-upload rejected
- **Document Verifications**: HR verify/reject with reason

### Organization
- **My Team**: Manager → Me (highlighted) → Peers → Direct Reports
- **Org Tree**: Recursive expand/collapse tree with search, current user highlighted

---

## API Integration

### Services (32 total)

The app uses a centralized API client with:
- Auto token refresh on 401
- Global 403 "Setup required" redirect
- Typed request/response wrappers

All services follow the pattern:
```typescript
// services/employee-service.ts
export async function listEmployees(params?: ListParams): Promise<EmployeeListItem[]> {
  const data = await api.get<{ employees: EmployeeListItem[] }>(`${BASE}?${qs}`);
  return data.employees;
}
```

### Data Scoping

| Data | Method |
|---|---|
| Attendance | Backend-scoped by token (`/attendance/*`) |
| Leave balances | Backend-scoped (`/leave_requests/balances`) |
| Leave requests | Client-side filter by `employee.id === myEmployeeId` |
| Monthly summary | Uses `/my_profile/attendance_summary` (always user-scoped) |
| Team on leave | Client-side: filtered to direct reports via org tree |
| Approvals | Backend params: `my_requests=true`, `my_pending=true` |

---

## Deployment

### Production Environment Variables

```env
NEXT_PUBLIC_BASE_DOMAIN=yourdomain.com
NEXT_PUBLIC_API_PORT=443
NEXT_PUBLIC_PROTOCOL=https
```

### Build

```bash
npm run build
npm run start
```

### Docker (example)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### DNS Setup

For production multi-tenancy, configure wildcard DNS:

```
*.yourdomain.com  →  A record → your-server-ip
yourdomain.com    →  A record → your-server-ip
```

### Reverse Proxy (Nginx example)

```nginx
server {
    listen 443 ssl;
    server_name *.yourdomain.com yourdomain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Testing

See [TESTING.md](TESTING.md) for the comprehensive testing guide including:
- Test accounts for each role
- Page-by-page visibility rules
- Button enable/disable conditions
- Data scoping rules
- Edge cases checklist

### Test Accounts (local development)

| Role | Email | Password |
|---|---|---|
| Tenant Admin | `rajesh.ceo@novatech.com` | `password123` |
| HR Manager | `kavita.hr@novatech.com` | `password123` |
| Department Manager | `nisha.design@novatech.com` | `password123` |
| Employee | `amit.design@novatech.com` | `password123` |

---

## Notifications

Real-time notification system with:
- Bell icon in top bar with unread badge
- Polling every 30 seconds
- Type-colored badges (workflow_action, info, warning, system)
- Deep linking to approvals, leaves, employees
- Optimistic mark-as-read
- Mark all as read

---

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

---

## License

Proprietary — All rights reserved.
