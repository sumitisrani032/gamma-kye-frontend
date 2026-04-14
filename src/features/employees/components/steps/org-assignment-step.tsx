"use client";

import { useEffect } from "react";
import { Select } from "@/components/ui";
import { fieldError, type OnboardWizardState, type ValidationError } from "../../types/onboard";
import type { CompanySummary, DepartmentSummary, Designation, LocationSummary } from "@/types";

interface OrgAssignmentStepProps {
  state: OnboardWizardState;
  updateFields: (fields: Partial<OnboardWizardState>) => void;
  errors: ValidationError[];
  touched: boolean;
  serverErrors?: Record<string, string[]>;
  companies: CompanySummary[];
  departments: DepartmentSummary[];
  designations: Designation[];
  locations: LocationSummary[];
}

const FIELD_MAP: Record<string, string> = {
  companyId: "company_id",
  departmentId: "department",
  designationId: "designation",
  locationId: "location",
};

export function OrgAssignmentStep({
  state, updateFields, errors, touched, serverErrors = {},
  companies, departments, designations, locations,
}: OrgAssignmentStepProps) {
  const err = (field: string) => {
    const serverKey = FIELD_MAP[field];
    const serverMsg = serverKey ? serverErrors[serverKey]?.[0] : undefined;
    return serverMsg || (touched ? fieldError(errors, field) : undefined);
  };

  // Auto-select first company if not set
  useEffect(() => {
    if (!state.companyId && companies.length > 0) {
      updateFields({ companyId: companies[0].id });
    }
  }, [companies, state.companyId, updateFields]);

  const toOptions = (items: { id: string; name: string }[], placeholder: string) =>
    [{ value: "", label: placeholder }, ...items.map((i) => ({ value: i.id, label: i.name }))];

  // Filter departments by selected company
  const filteredDepts = state.companyId
    ? departments.filter((d) => d.company_id === state.companyId)
    : departments;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Organization Assignment</h3>
        <p className="text-sm text-text-secondary mt-1">Map the employee to their organizational unit.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Company"
          name="companyId"
          value={state.companyId}
          onChange={(e) => updateFields({ companyId: e.target.value, departmentId: "" })}
          options={companies.map((c) => ({ value: c.id, label: c.name }))}
          required
          error={err("companyId")}
        />
        <Select
          label="Department"
          name="departmentId"
          value={state.departmentId}
          onChange={(e) => updateFields({ departmentId: e.target.value })}
          options={toOptions(filteredDepts, "Select department...")}
          required
          error={err("departmentId")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Designation"
          name="designationId"
          value={state.designationId}
          onChange={(e) => updateFields({ designationId: e.target.value })}
          options={toOptions(designations, "Select designation...")}
          required
          error={err("designationId")}
        />
        <Select
          label="Location"
          name="locationId"
          value={state.locationId}
          onChange={(e) => updateFields({ locationId: e.target.value })}
          options={toOptions(locations, "Select location...")}
          required
          error={err("locationId")}
        />
      </div>
    </div>
  );
}
