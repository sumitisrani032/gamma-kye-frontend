export interface TenantSettings {
  locale: string;
  currency: string;
  timezone: string;
  date_format: string;
  financial_year_start: string;
}

/** Slim tenant returned by /auth/me and /auth/login */
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
}

/** Full tenant returned by GET /tenant and POST /tenant/complete_setup */
export interface TenantDetail extends Tenant {
  domain: string | null;
  settings: TenantSettings;
  setup_completed: boolean;
  setup_completed_at: string | null;
}

export interface Permission {
  resource: string;
  action: string;
  scope: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
  permissions: Permission[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterTenantRequest {
  tenant: {
    name: string;
    subdomain: string;
    plan: string;
  };
  user: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name: string;
    last_name: string;
  };
}

export interface AuthResponse {
  user: User;
  tenant: Tenant;
  tokens: AuthTokens;
}

export interface MeResponse {
  user: User;
  tenant: Tenant;
}

export interface TenantCheckResponse {
  exists: boolean;
  status?: string;
}

export interface ApiError {
  status: number;
  error?: string;
  errors?: Record<string, string[]>;
}

/* ------------------------------------------------------------------ */
/*  Role Management                                                   */
/* ------------------------------------------------------------------ */

export interface PermissionDetail {
  id: string;
  resource: string;
  action: string;
  scope: string;
  key: string;
  description: string;
}

export interface RoleSummary {
  id: string;
  name: string;
  description: string;
  is_system_role: boolean;
  users_count: number;
  permissions_count: number;
  created_at: string;
}

export interface RoleDetail extends RoleSummary {
  permissions: PermissionDetail[];
}

export interface CreateRoleRequest {
  role: {
    name: string;
    description: string;
  };
  permission_ids: string[];
}

export interface RoleAssignment {
  id: string;
  name: string;
  is_system_role: boolean;
}

/* ------------------------------------------------------------------ */
/*  User Management                                                   */
/* ------------------------------------------------------------------ */

export type UserStatus = "active" | "inactive" | "locked";

export interface ManagedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: UserStatus;
  roles: RoleAssignment[];
  last_login_at: string | null;
  created_at: string;
}

export interface ManagedUserDetail {
  user: ManagedUser;
  permissions: PermissionDetail[];
}

/* ------------------------------------------------------------------ */
/*  Notifications                                                     */
/* ------------------------------------------------------------------ */

export type NotificationType =
  | "workflow_action"
  | "workflow_complete"
  | "info"
  | "warning"
  | "system";

export interface Notification {
  id: string;
  title: string;
  body: string;
  notification_type: NotificationType;
  reference_type: string;
  reference_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unread_count: number;
}

/* ------------------------------------------------------------------ */
/*  Workflow Instances (Approvals)                                     */
/* ------------------------------------------------------------------ */

export type WorkflowStatus =
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected"
  | "cancelled";

export interface UserSummary {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
}

export interface StepInstance {
  id: string;
  step_order: number;
  approver_type: string;
  assigned_to: UserSummary | null;
  status: WorkflowStatus;
  comments: string | null;
  acted_at: string | null;
}

export interface WorkflowInstance {
  id: string;
  workflow_definition_id: string;
  entity_type: string;
  entity_id: string;
  current_step_order: number;
  status: WorkflowStatus;
  initiated_by: UserSummary;
  created_at: string;
  completed_at: string | null;
  step_instances?: StepInstance[];
}

/* ------------------------------------------------------------------ */
/*  Workflow Definitions (Admin / Settings)                            */
/* ------------------------------------------------------------------ */

export type RejectAction = "terminate" | "send_back" | "skip";

export interface WorkflowStep {
  id: string;
  step_order: number;
  approver_type: string;
  approver_value: string | null;
  action_on_reject: RejectAction;
  auto_escalation_hours: number | null;
}

/** List serializer — returned by GET /manage/workflow_definitions */
export interface WorkflowDefinitionSummary {
  id: string;
  name: string;
  entity_type: string;
  is_active: boolean;
  steps_count: number;
  created_at: string;
}

/** Detail serializer — returned by GET /manage/workflow_definitions/:id */
export interface WorkflowDefinition extends WorkflowDefinitionSummary {
  updated_at: string;
  steps: WorkflowStep[];
}

export interface CreateWorkflowDefinitionRequest {
  workflow_definition: {
    name: string;
    entity_type: string;
    is_active: boolean;
  };
  steps: CreateStepRequest[];
}

export interface CreateStepRequest {
  step_order: number;
  approver_type: string;
  approver_value?: string | null;
  action_on_reject: RejectAction;
  auto_escalation_hours?: number | null;
}

/* ------------------------------------------------------------------ */
/*  Audit Logs                                                        */
/* ------------------------------------------------------------------ */

export interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes_data: Record<string, [unknown, unknown]>;
  ip_address: string;
  user_agent: string;
  user: UserSummary;
  created_at: string;
}

export interface AuditLogFilters {
  resource_type?: string;
  resource_id?: string;
  user_id?: string;
  action_filter?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

/* ------------------------------------------------------------------ */
/*  File Attachments                                                  */
/* ------------------------------------------------------------------ */

export interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  s3_key: string;
  created_at: string;
}

export interface CreateAttachmentRequest {
  attachment: {
    file_name: string;
    file_type: string;
    file_size: number;
    s3_key: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Tenant Setup                                                       */
/* ------------------------------------------------------------------ */

export interface SetupStep {
  key: string;
  label: string;
  completed: boolean;
}

export interface SetupStatusResponse {
  setup_required: boolean;
  setup_completed_at: string | null;
  mandatory_steps: SetupStep[];
  optional_steps: SetupStep[];
  progress: { completed: number; total: number };
  can_complete: boolean;
}

export interface CompleteSetupResponse {
  message: string;
  tenant: TenantDetail;
}

/* ------------------------------------------------------------------ */
/*  Companies                                                          */
/* ------------------------------------------------------------------ */

/** Returned by GET /manage/companies (list) */
export interface CompanySummary {
  id: string;
  name: string;
  legal_name: string;
  city: string;
  state: string;
  country: string;
  is_primary: boolean;
  status: string;
}

/** Returned by GET /manage/companies/:id (detail), POST, PUT */
export interface CompanyDetail extends CompanySummary {
  registration_number: string | null;
  tax_id: string | null;
  address: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  incorporation_date: string | null;
  created_at: string;
}

export interface CompanyFormData {
  name: string;
  legal_name: string;
  registration_number?: string;
  tax_id?: string;
  country: string;
  state: string;
  city: string;
  address?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  incorporation_date?: string;
  is_primary: boolean;
}
