"use client";

import { Select } from "@/components/ui";
import type { OnboardWizardState } from "../../types/onboard";
import type { Grade, EmploymentType } from "@/types";

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
  { value: "consultant", label: "Consultant" },
];

interface EmploymentStepProps {
  state: OnboardWizardState;
  updateFields: (fields: Partial<OnboardWizardState>) => void;
  grades: Grade[];
}

export function EmploymentStep({ state, updateFields, grades }: EmploymentStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Employment Details</h3>
        <p className="text-sm text-text-secondary mt-1">Configure employment type and pay grade.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Employment Type"
          name="employmentType"
          value={state.employmentType}
          onChange={(e) => updateFields({ employmentType: e.target.value as EmploymentType })}
          options={EMPLOYMENT_TYPES}
        />
        <Select
          label="Grade / Level"
          name="gradeId"
          value={state.gradeId}
          onChange={(e) => updateFields({ gradeId: e.target.value })}
          options={[
            { value: "", label: "Select grade..." },
            ...grades.map((g) => ({ value: g.id, label: `${g.name}${g.code ? ` (${g.code})` : ""}` })),
          ]}
        />
      </div>
    </div>
  );
}
