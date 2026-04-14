"use client";

import { Card, CardContent, Alert } from "@/components/ui";
import type { OnboardWizardState } from "../../types/onboard";
import type { CompanySummary, DepartmentSummary, Designation, Grade, LocationSummary, EmployeeListItem, RoleSummary } from "@/types";

interface ReviewStepProps {
  state: OnboardWizardState;
  companies: CompanySummary[];
  departments: DepartmentSummary[];
  designations: Designation[];
  grades: Grade[];
  locations: LocationSummary[];
  managers: EmployeeListItem[];
  roles: RoleSummary[];
  submitError: string;
  submitFieldErrors: Record<string, string[]>;
}

function resolve<T extends { id: string; name: string }>(items: T[], id: string): string {
  return items.find((i) => i.id === id)?.name || "—";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
        <dl className="space-y-1">{children}</dl>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="text-text-primary font-medium">{value || "—"}</dd>
    </div>
  );
}

export function ReviewStep({
  state, companies, departments, designations, grades, locations, managers, roles,
  submitError, submitFieldErrors,
}: ReviewStepProps) {
  const manager = managers.find((m) => m.id === state.reportingManagerId);
  const selectedRoles = roles.filter((r) => state.roleIds.includes(r.id));
  const fieldErrorList = Object.entries(submitFieldErrors).flatMap(([field, msgs]) =>
    msgs.map((msg) => `${field}: ${msg}`)
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Review & Confirm</h3>
        <p className="text-sm text-text-secondary mt-1">Please review all details before submitting.</p>
      </div>

      {submitError && <Alert variant="error">{submitError}</Alert>}
      {fieldErrorList.length > 0 && (
        <Alert variant="error">
          <ul className="list-disc list-inside space-y-0.5">
            {fieldErrorList.map((msg, i) => <li key={i}>{msg}</li>)}
          </ul>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Personal Information">
          <Row label="Name" value={`${state.firstName} ${state.lastName}`} />
          <Row label="Email" value={state.emailOfficial} />
          <Row label="Phone" value={state.phone} />
          <Row label="Gender" value={state.gender || "Not specified"} />
          <Row label="Date of Joining" value={state.dateOfJoining} />
          <Row label="Login Password" value={state.password ? "Set" : "Not set"} />
        </Section>

        <Section title="Organization">
          <Row label="Company" value={resolve(companies, state.companyId)} />
          <Row label="Department" value={resolve(departments, state.departmentId)} />
          <Row label="Designation" value={resolve(designations, state.designationId)} />
          <Row label="Location" value={resolve(locations, state.locationId)} />
        </Section>

        <Section title="Reporting & Roles">
          <Row label="Reporting Manager" value={manager ? `${manager.full_name} (${manager.employee_number})` : "—"} />
          <Row label="Roles" value={["Employee", ...selectedRoles.map((r) => r.name)].join(", ")} />
        </Section>

        <Section title="Employment">
          <Row label="Type" value={state.employmentType.replace("_", " ")} />
          <Row label="Grade" value={state.gradeId ? resolve(grades, state.gradeId) : "Not assigned"} />
        </Section>
      </div>
    </div>
  );
}
