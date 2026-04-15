export interface TenantSettings {
  locale: string;
  currency: string;
  timezone: string;
  date_format: string;
  time_format: string;
  financial_year_start: string;
  employee_number_format: string;
  attendance_auto_clockout: boolean;
  leave_requires_reason: boolean;
  max_leave_advance_days: number;
  password_min_length: number;
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
  reference_type: string | null;
  reference_id: string | null;
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
  entity_type: string;
  entity_id: string;
  uploaded_by: UserSummary;
  created_at: string;
}

export interface CreateAttachmentRequest {
  attachment: {
    file_name: string;
    file_type: string;
    file_size: number;
    s3_key: string;
    entity_type: string;
    entity_id: string;
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

/* ------------------------------------------------------------------ */
/*  Locations                                                          */
/* ------------------------------------------------------------------ */

/** Returned by GET /manage/locations (list) */
export interface LocationSummary {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  is_headquarters: boolean;
  status: string;
}

/** Returned by POST, PUT /manage/locations (detail) */
export interface LocationDetail extends LocationSummary {
  address: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface LocationFormData {
  name: string;
  code: string;
  city: string;
  state: string;
  country: string;
  pincode?: string;
  address?: string;
  timezone: string;
  is_headquarters: boolean;
}

/* ------------------------------------------------------------------ */
/*  Departments                                                        */
/* ------------------------------------------------------------------ */

/** Embedded employee summary in department detail */
export interface EmployeeSummaryEmbed {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email_official: string;
  phone: string | null;
  designation: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  employment_status: string;
  profile_photo_url: string | null;
}

/** Returned by GET /manage/departments (list) */
export interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
  company_id: string;
  parent_department_id: string | null;
  head_employee_id: string | null;
  status: string;
  employees_count: number;
}

/** Returned by GET /manage/departments/:id, POST, PUT, PATCH */
export interface DepartmentDetail extends DepartmentSummary {
  description: string | null;
  head_employee: EmployeeSummaryEmbed | null;
  sub_departments: DepartmentSummary[];
  created_at: string;
}

export interface DepartmentFormData {
  name: string;
  code: string;
  company_id: string;
  parent_department_id?: string | null;
  description?: string;
}

/* ------------------------------------------------------------------ */
/*  Designations                                                       */
/* ------------------------------------------------------------------ */

export interface Designation {
  id: string;
  name: string;
  code: string | null;
  level: number;
  description: string | null;
  status: string;
}

export interface DesignationFormData {
  name: string;
  code?: string;
  level: number;
  description?: string;
}

/* ------------------------------------------------------------------ */
/*  Grades                                                             */
/* ------------------------------------------------------------------ */

export interface Grade {
  id: string;
  name: string;
  code: string | null;
  rank: number;
  description: string | null;
  status: string;
}

export interface GradeFormData {
  name: string;
  code?: string;
  rank: number;
  description?: string;
}

/* ------------------------------------------------------------------ */
/*  Shifts                                                             */
/* ------------------------------------------------------------------ */

export type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface Shift {
  id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  grace_minutes: number;
  full_day_hours: string;
  half_day_hours: string;
  is_night_shift: boolean;
  weekly_offs: WeekDay[];
  is_flexible: boolean;
  is_default: boolean;
  is_active: boolean;
}

export interface ShiftFormData {
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  grace_minutes: number;
  full_day_hours: number;
  half_day_hours: number;
  weekly_offs: WeekDay[];
  is_default: boolean;
  is_active: boolean;
}

/* ------------------------------------------------------------------ */
/*  Shift Assignments                                                  */
/* ------------------------------------------------------------------ */

export interface ShiftAssignment {
  id: string;
  employee_id: string;
  shift: Shift;
  effective_from: string;
  effective_to: string | null;
  assigned_by: { id: string; first_name: string; last_name: string } | null;
  created_at: string;
}

export interface ShiftAssignmentFormData {
  employee_id: string;
  shift_id: string;
  effective_from: string;
  effective_to?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Leave Types                                                        */
/* ------------------------------------------------------------------ */

/** Returned by GET /manage/leave_types (list) */
export interface LeaveTypeSummary {
  id: string;
  name: string;
  code: string;
  is_paid: boolean;
  is_carry_forward: boolean;
  is_encashable: boolean;
  is_half_day_allowed: boolean;
  is_active: boolean;
  color_code: string;
}

/** Returned by GET /manage/leave_types/:id, POST, PUT (detail) */
export interface LeaveTypeDetail extends LeaveTypeSummary {
  description: string | null;
  max_carry_forward_days: string;
  max_encashment_days: string;
  is_negative_balance_allowed: boolean;
  max_negative_days: string;
  requires_attachment: boolean;
  min_days_before_application: number;
  max_consecutive_days: number | null;
  gender_applicable: string | null;
  created_at: string;
}

export interface LeaveTypeFormData {
  name: string;
  code: string;
  is_paid: boolean;
  is_carry_forward: boolean;
  is_encashable: boolean;
  is_half_day_allowed: boolean;
  is_active: boolean;
  color_code: string;
  description?: string;
  max_carry_forward_days?: number;
  max_encashment_days?: number;
  is_negative_balance_allowed?: boolean;
  max_negative_days?: number;
  requires_attachment?: boolean;
  min_days_before_application?: number;
  max_consecutive_days?: number | null;
  gender_applicable?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Leave Policies                                                     */
/* ------------------------------------------------------------------ */

export type AccrualType = "annual" | "monthly" | "none";
export type ApplicableTo = "all" | "department" | "designation" | "grade" | "location";

/** Returned by GET /manage/leave_policies (list) */
export interface LeavePolicySummary {
  id: string;
  name: string;
  leave_type_id: string;
  accrual_type: AccrualType;
  annual_quota: string;
  applicable_to: ApplicableTo;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
}

/** Returned by GET /manage/leave_policies/:id, POST, PUT (detail) */
export interface LeavePolicyDetail extends LeavePolicySummary {
  monthly_accrual: string | null;
  prorate_on_joining: boolean;
  prorate_on_exit: boolean;
  proration_basis: string;
  applicable_ids: string[];
  min_days_per_request: number | null;
  max_days_per_request: number | null;
  requires_approval: boolean;
  advance_days_required: number;
  created_at: string;
}

export interface LeavePolicyFormData {
  name: string;
  leave_type_id: string;
  accrual_type: AccrualType;
  annual_quota: number;
  applicable_to: ApplicableTo;
  is_active?: boolean;
  effective_from: string;
  effective_to?: string | null;
  prorate_on_joining?: boolean;
  prorate_on_exit?: boolean;
  requires_approval?: boolean;
  advance_days_required?: number;
  min_days_per_request?: number | null;
  max_days_per_request?: number | null;
}

/* ------------------------------------------------------------------ */
/*  Holiday Calendars + Holidays                                       */
/* ------------------------------------------------------------------ */

export type HolidayType = "mandatory" | "optional";

export interface Holiday {
  id: string;
  name: string;
  date: string;
  holiday_type: HolidayType;
  is_half_day: boolean;
  description: string | null;
}

export interface HolidayFormData {
  name: string;
  date: string;
  holiday_type: HolidayType;
  is_half_day?: boolean;
  description?: string;
}

/** Returned by GET /manage/holiday_calendars (list) and POST */
export interface HolidayCalendarSummary {
  id: string;
  name: string;
  year: number;
  location: string | null;
  is_active: boolean;
  holidays_count: number;
}

/** Returned by GET /manage/holiday_calendars/:id (detail) */
export interface HolidayCalendarDetail extends HolidayCalendarSummary {
  holidays: Holiday[];
}

export interface HolidayCalendarFormData {
  name: string;
  year: number;
}

/* ------------------------------------------------------------------ */
/*  Business Units                                                     */
/* ------------------------------------------------------------------ */

export interface BusinessUnit {
  id: string;
  name: string;
  code: string;
  description: string | null;
  company_id: string;
  status: string;
}

export interface BusinessUnitFormData {
  name: string;
  code: string;
  company_id: string;
  description?: string;
}

/* ------------------------------------------------------------------ */
/*  Overtime Rules                                                     */
/* ------------------------------------------------------------------ */

export interface OvertimeRule {
  id: string;
  name: string;
  threshold_hours: string;
  rate_multiplier: string;
  max_daily_ot_hours: string | null;
  max_monthly_ot_hours: string | null;
  applicable_on_holidays: boolean;
  holiday_rate_multiplier: string;
  is_active: boolean;
}

export interface OvertimeRuleFormData {
  name: string;
  threshold_hours: number;
  rate_multiplier: number;
  max_daily_ot_hours?: number | null;
  max_monthly_ot_hours?: number | null;
  applicable_on_holidays: boolean;
  holiday_rate_multiplier?: number;
  is_active: boolean;
}

/* ------------------------------------------------------------------ */
/*  Employees                                                          */
/* ------------------------------------------------------------------ */

export type EmploymentType = "full_time" | "part_time" | "contract" | "intern" | "consultant";
export type EmploymentStatus = "active" | "on_notice" | "exited" | "absconding";

/** Returned by GET /employees (directory — slim, flat strings) */
export interface DirectoryEmployee {
  id: string;
  employee_number: string;
  full_name: string;
  email_official: string;
  phone: string | null;
  designation: string;
  department: string;
  location: string;
  profile_photo_url: string | null;
}

/** Returned by GET /manage/employees (list) */
export interface EmployeeListItem {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email_official: string;
  phone: string | null;
  designation: { id: string; name: string; level: number } | null;
  department: { id: string; name: string } | null;
  employment_status: EmploymentStatus;
  profile_photo_url: string | null;
}

export interface EmployeeUserAccount {
  id: string;
  email: string;
  status: string;
  roles: { id: string; name: string; is_system_role: boolean }[];
  last_login_at: string | null;
  mfa_enabled: boolean;
}

/** Returned by GET /manage/employees/:id, POST, PUT (detail) */
export interface EmployeeDetail extends EmployeeListItem {
  user_id: string;
  company_id: string;
  grade: Grade | null;
  location: LocationSummary | null;
  business_unit: BusinessUnit | null;
  reporting_manager: EmployeeListItem | null;
  direct_reports_count: number;
  email_personal: string | null;
  date_of_birth: string | null;
  gender: string | null;
  marital_status: string | null;
  blood_group: string | null;
  nationality: string | null;
  date_of_joining: string;
  date_of_confirmation: string | null;
  employment_type: EmploymentType;
  notice_period_days: number;
  date_of_exit: string | null;
  exit_reason: string | null;
  user_account: EmployeeUserAccount;
  created_at: string;
}

export interface EmployeeOnboardData {
  employee: {
    first_name: string;
    last_name: string;
    email_official: string;
    company_id: string;
    department_id: string;
    designation_id: string;
    grade_id?: string;
    location_id: string;
    date_of_joining: string;
    employment_type: EmploymentType;
    gender?: string;
    reporting_manager_id?: string;
    phone?: string;
  };
  password?: string;
  password_confirmation?: string;
  user_id?: string;
  personal_detail?: {
    current_address?: string;
    current_city?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  };
  bank_detail?: {
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
  };
}

export interface PromoteData {
  designation_id: string;
  grade_id?: string;
  effective_date: string;
  remarks?: string;
}

export interface TransferData {
  department_id?: string;
  location_id?: string;
  effective_date: string;
  remarks?: string;
}

export interface OffboardData {
  exit_date: string;
  exit_reason: string;
}

/* ------------------------------------------------------------------ */
/*  My Profile                                                         */
/* ------------------------------------------------------------------ */

export interface PersonalDetail {
  id: string;
  current_address: string | null;
  current_city: string | null;
  current_state: string | null;
  current_country: string | null;
  current_pincode: string | null;
  permanent_address: string | null;
  permanent_city: string | null;
  permanent_state: string | null;
  permanent_country: string | null;
  permanent_pincode: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  pan_number: string | null;
  aadhaar_number: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  uan_number: string | null;
}

export interface PersonalDetailFormData {
  current_address?: string;
  current_city?: string;
  current_state?: string;
  current_country?: string;
  current_pincode?: string;
  permanent_address?: string;
  permanent_city?: string;
  permanent_state?: string;
  permanent_country?: string;
  permanent_pincode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  pan_number?: string;
  aadhaar_number?: string;
  passport_number?: string;
  passport_expiry?: string;
  uan_number?: string;
}

export interface LeaveBalance {
  id: string;
  leave_type: LeaveTypeSummary;
  year: number;
  entitled: string;
  accrued: string;
  used: string;
  carry_forwarded: string;
  adjusted: string;
  balance: string;
}

export interface AttendanceSummary {
  id: string;
  year: number;
  month: number;
  total_working_days: number;
  days_present: number;
  days_absent: number;
  days_half_day: number;
  days_on_leave: number;
  days_holiday: number;
  days_weekly_off: number;
  total_hours_worked: string;
  total_overtime_hours: string;
  late_count: number;
  early_exit_count: number;
}

export interface BankDetail {
  id: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch_name: string | null;
  account_type: string | null;
  is_primary: boolean;
}

export interface MyProfileResponse {
  employee: EmployeeDetail;
  personal_detail: PersonalDetail | null;
}

/* ------------------------------------------------------------------ */
/*  Attendance                                                         */
/* ------------------------------------------------------------------ */

export type AttendanceStatus = "present" | "absent" | "half_day" | "on_leave" | "holiday" | "weekly_off";

export type AttendanceState = "not_started" | "working" | "on_break";

export interface AttendanceSession {
  id: string;
  session_number: number;
  clock_in: string;
  clock_out: string | null;
  hours: number | null;
  source: string;
  open: boolean;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatus;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: string | null;
  effective_hours: string | null;
  source: string;
  is_late: boolean;
  late_minutes: number;
  is_early_departure: boolean;
  overtime_minutes: number;
  is_regularized: boolean;
  remarks: string | null;
  sessions_count?: number;
  sessions?: AttendanceSession[];
}

export type WorkMode = "office" | "wfh" | "hybrid";
export type WeekDayName = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface WfhPolicy {
  id: string;
  name: string;
  description?: string | null;
  requires_approval: boolean;
  max_wfh_per_month: number;
  min_days_advance: number;
  allowed_on_probation: boolean;
  allowed_days: WeekDayName[];
  applicable_to: string;
  applicable_ids: string[];
  priority: number;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface WfhPolicyFormData {
  name: string;
  description?: string;
  requires_approval: boolean;
  max_wfh_per_month: number;
  min_days_advance: number;
  allowed_on_probation: boolean;
  allowed_days: WeekDayName[];
  applicable_to: string;
  applicable_ids: string[];
  priority: number;
  effective_from: string;
  effective_to?: string | null;
  is_active: boolean;
}

export interface TodayAttendanceResponse {
  state: AttendanceState;
  attendance: AttendanceRecord | null;
}

/* ------------------------------------------------------------------ */
/*  Attendance Regularization                                          */
/* ------------------------------------------------------------------ */

export type RegularizationStatus = "pending" | "approved" | "rejected" | "cancelled";

/** Returned by GET /attendance_regularizations (list) */
export interface RegularizationSummary {
  id: string;
  date: string;
  original_clock_in: string | null;
  original_clock_out: string | null;
  requested_clock_in: string;
  requested_clock_out: string;
  reason: string;
  status: RegularizationStatus;
  created_at: string;
}

/** Returned by GET /attendance_regularizations/:id (detail) */
export interface RegularizationDetail extends RegularizationSummary {
  workflow_instance_id: string | null;
}

export interface RegularizationFormData {
  attendance_record_id: string;
  requested_clock_in: string;
  requested_clock_out: string;
  reason: string;
}

/* ------------------------------------------------------------------ */
/*  Leave Requests                                                     */
/* ------------------------------------------------------------------ */

export type LeaveRequestStatus = "pending" | "approved" | "rejected" | "cancelled";
export type HalfDay = "first_half" | "second_half";

export interface LeaveRequest {
  id: string;
  employee: EmployeeListItem;
  leave_type: LeaveTypeSummary;
  start_date: string;
  end_date: string;
  start_half: HalfDay | null;
  end_half: HalfDay | null;
  number_of_days: string;
  reason: string;
  status: LeaveRequestStatus;
  created_at: string;
  workflow_instance_id: string | null;
  approved_by: EmployeeListItem | null;
  approved_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
}

export interface LeaveRequestFormData {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  start_half?: HalfDay | null;
  end_half?: HalfDay | null;
  reason: string;
}

/** Detail — returned by GET /workflow_instances/:id and action responses */
export interface WorkflowInstanceDetail extends WorkflowInstance {
  workflow_name: string;
  step_instances: StepInstance[];
}

/* ------------------------------------------------------------------ */
/*  Org Structure                                                      */
/* ------------------------------------------------------------------ */

export interface OrgNode {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email_official: string;
  designation: { id: string; name: string; level: number } | null;
  department: { id: string; name: string } | null;
  profile_photo_url: string | null;
  reporting_manager_id: string | null;
}

export interface OrgTreeNode extends OrgNode {
  children: OrgTreeNode[];
}

export interface MyTeamData {
  me: OrgNode;
  manager: OrgNode | null;
  peers: OrgNode[];
  directReports: OrgNode[];
}

/* ------------------------------------------------------------------ */
/*  Document Requirements & Employee Documents                         */
/* ------------------------------------------------------------------ */

export interface DocumentRequirement {
  id: string;
  name: string;
  document_type: string;
  description: string | null;
  is_mandatory: boolean;
  is_active: boolean;
  has_expiry: boolean;
  applicable_to: string;
  applicable_ids: string[];
  allowed_file_types: string;
  max_file_size_mb: number;
}

export interface DocumentRequirementFormData {
  name: string;
  document_type: string;
  description?: string;
  is_mandatory: boolean;
  has_expiry: boolean;
  applicable_to: string;
  applicable_ids?: string[];
  allowed_file_types?: string;
  max_file_size_mb?: number;
}

export type EmployeeDocStatus = "pending" | "verified" | "rejected" | "missing";

export interface EmployeeDocument {
  id: string;
  document_type: string;
  document_name: string;
  description: string | null;
  status: EmployeeDocStatus;
  verified: boolean;
  verified_at: string | null;
  rejection_reason: string | null;
  expires_at: string | null;
  attachment: Attachment | null;
  document_requirement_id: string;
  created_at: string;
  verified_by?: UserSummary | null;
  document_requirement?: DocumentRequirement;
  employee?: EmployeeListItem;
}

export interface RequirementWithStatus {
  requirement: Pick<DocumentRequirement, "id" | "name" | "document_type" | "is_mandatory" | "has_expiry">;
  submission: EmployeeDocument | null;
  status: EmployeeDocStatus;
}

/* ------------------------------------------------------------------ */
/*  Policy Documents                                                   */
/* ------------------------------------------------------------------ */

export type PolicyCategory = "hr_policy" | "code_of_conduct" | "compliance" | "safety" | "travel" | "benefits" | "other";
export type PolicyStatus = "draft" | "published" | "archived";
export type AckStatus = "pending" | "acknowledged" | "not_applicable";

export interface PolicyDocument {
  id: string;
  title: string;
  category: PolicyCategory;
  status: PolicyStatus;
  description: string | null;
  effective_date: string | null;
  expiry_date: string | null;
  version_number: number;
  acknowledgement_required: boolean;
  published_at: string | null;
  created_at: string;
  attachment: Attachment;
  published_by: UserSummary | null;
  applicable_to: string;
  applicable_ids: string[];
  previous_version_id: string | null;
  acknowledgement_stats?: { total: number; acknowledged: number; pending: number };
  acknowledgement_status?: AckStatus;
  acknowledged_at?: string | null;
}

export interface PolicyDocumentFormData {
  title: string;
  description?: string;
  category: PolicyCategory;
  acknowledgement_required: boolean;
  effective_date?: string;
  applicable_to: string;
  applicable_ids?: string[];
}

export interface AckReportEntry {
  employee_id: string;
  employee_name: string;
  department: string;
  designation: string;
  acknowledged_at?: string;
  status: string;
}

export interface AckReport {
  policy: { id: string; title: string; version: number };
  stats: { total: number; acknowledged: number; pending: number };
  acknowledged: AckReportEntry[];
  pending: AckReportEntry[];
}
