import type { EmploymentType } from "@/types";

/* ------------------------------------------------------------------ */
/*  Wizard Step Definitions                                            */
/* ------------------------------------------------------------------ */

export const ONBOARD_STEPS = [
  { key: "basic_info", label: "Basic Info" },
  { key: "org_assignment", label: "Organization" },
  { key: "reporting", label: "Reporting" },
  { key: "role_access", label: "Roles & Access" },
  { key: "employment", label: "Employment" },
  { key: "policy", label: "Policies" },
  { key: "documents", label: "Documents" },
  { key: "review", label: "Review" },
] as const;

export type StepKey = (typeof ONBOARD_STEPS)[number]["key"];

/* ------------------------------------------------------------------ */
/*  Wizard State                                                       */
/* ------------------------------------------------------------------ */

export interface OnboardWizardState {
  // Step 1: Basic Info
  firstName: string;
  lastName: string;
  emailOfficial: string;
  phone: string;
  dateOfJoining: string;
  gender: string;

  // Step 1: Credentials
  password: string;
  passwordConfirmation: string;

  // Step 2: Org Assignment
  companyId: string;
  departmentId: string;
  designationId: string;
  locationId: string;

  // Step 3: Reporting
  reportingManagerId: string;

  // Step 4: Roles
  roleIds: string[];

  // Step 5: Employment
  employmentType: EmploymentType;
  gradeId: string;

  // Step 7: Documents (tracked separately — file refs)
  documentIds: string[];
}

export const INITIAL_WIZARD_STATE: OnboardWizardState = {
  firstName: "",
  lastName: "",
  emailOfficial: "",
  phone: "",
  password: "",
  passwordConfirmation: "",
  dateOfJoining: "",
  gender: "",
  companyId: "",
  departmentId: "",
  designationId: "",
  locationId: "",
  reportingManagerId: "",
  roleIds: [],
  employmentType: "full_time",
  gradeId: "",
  documentIds: [],
};

/* ------------------------------------------------------------------ */
/*  Per-Step Validation                                                */
/* ------------------------------------------------------------------ */

export interface ValidationError {
  field: string;
  message: string;
}

type StepValidator = (state: OnboardWizardState) => ValidationError[];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateBasicInfo: StepValidator = (s) => {
  const errors: ValidationError[] = [];
  if (!s.firstName.trim()) errors.push({ field: "firstName", message: "First name is required" });
  if (!s.lastName.trim()) errors.push({ field: "lastName", message: "Last name is required" });
  if (!s.emailOfficial.trim()) errors.push({ field: "emailOfficial", message: "Email is required" });
  else if (!EMAIL_RE.test(s.emailOfficial)) errors.push({ field: "emailOfficial", message: "Invalid email format" });
  if (!s.dateOfJoining) errors.push({ field: "dateOfJoining", message: "Joining date is required" });
  if (!s.password) errors.push({ field: "password", message: "Password is required" });
  else if (s.password.length < 8) errors.push({ field: "password", message: "Password must be at least 8 characters" });
  if (s.password && s.password !== s.passwordConfirmation) errors.push({ field: "passwordConfirmation", message: "Passwords do not match" });
  return errors;
};

const validateOrgAssignment: StepValidator = (s) => {
  const errors: ValidationError[] = [];
  if (!s.companyId) errors.push({ field: "companyId", message: "Company is required" });
  if (!s.departmentId) errors.push({ field: "departmentId", message: "Department is required" });
  if (!s.designationId) errors.push({ field: "designationId", message: "Designation is required" });
  if (!s.locationId) errors.push({ field: "locationId", message: "Location is required" });
  return errors;
};

const validateReporting: StepValidator = (s) => {
  const errors: ValidationError[] = [];
  if (!s.reportingManagerId) errors.push({ field: "reportingManagerId", message: "Reporting manager is required" });
  return errors;
};

// Steps 4-7 have no mandatory validation (roles auto-assigned, employment has defaults, docs optional)
const noValidation: StepValidator = () => [];

export const STEP_VALIDATORS: Record<StepKey, StepValidator> = {
  basic_info: validateBasicInfo,
  org_assignment: validateOrgAssignment,
  reporting: validateReporting,
  role_access: noValidation,
  employment: noValidation,
  policy: noValidation,
  documents: noValidation,
  review: noValidation,
};

/** Get field error for a specific field from a validation error list. */
export function fieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}
