export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  created_at: string;
  updated_at: string;
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

export interface RegisterUserRequest {
  email: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
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
/*  Paginated list wrapper                                            */
/* ------------------------------------------------------------------ */

export interface PaginatedList<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
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
  step_instances: StepInstance[];
}

/* ------------------------------------------------------------------ */
/*  Workflow Definitions (Admin / Settings)                            */
/* ------------------------------------------------------------------ */

export type RejectAction = "terminate" | "send_back" | "skip";

export interface WorkflowStep {
  id: string;
  step_order: number;
  approver_type: string;
  action_on_reject: RejectAction;
  auto_escalation_hours: number | null;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  entity_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  steps: WorkflowStep[];
}

export interface CreateWorkflowDefinitionRequest {
  name: string;
  entity_type: string;
  is_active: boolean;
  steps: Omit<WorkflowStep, "id">[];
}

export interface CreateStepRequest {
  step_order: number;
  approver_type: string;
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
  filename: string;
  content_type: string;
  byte_size: number;
  attachable_type: string;
  attachable_id: string;
  created_at: string;
}

export interface CreateAttachmentRequest {
  filename: string;
  content_type: string;
  byte_size: number;
  attachable_type: string;
  attachable_id: string;
}
