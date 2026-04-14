"use client";

import { Select, Alert } from "@/components/ui";
import { useDepartmentManagers } from "../../hooks/use-department-managers";
import { fieldError, type OnboardWizardState, type ValidationError } from "../../types/onboard";

interface ReportingStepProps {
  state: OnboardWizardState;
  updateFields: (fields: Partial<OnboardWizardState>) => void;
  errors: ValidationError[];
  touched: boolean;
  serverErrors?: Record<string, string[]>;
}

export function ReportingStep({ state, updateFields, errors, touched, serverErrors = {} }: ReportingStepProps) {
  const err = (field: string) => {
    if (field === "reportingManagerId") {
      const serverMsg = serverErrors["reporting_manager_id"]?.[0];
      if (serverMsg) return serverMsg;
    }
    return touched ? fieldError(errors, field) : undefined;
  };
  const { managers, allEmployees, loading } = useDepartmentManagers(state.departmentId);

  const sameDeptCount = managers.filter((m) => m.department?.id === state.departmentId).length;
  const isFirstEmployee = allEmployees.length === 0 && !loading;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Reporting Structure</h3>
        <p className="text-sm text-text-secondary mt-1">
          Define who this employee reports to.
          {state.departmentId && sameDeptCount > 0 && (
            <span className="text-primary-600"> Same-department employees are listed first.</span>
          )}
        </p>
      </div>

      {isFirstEmployee ? (
        <Alert variant="info">
          This will be the first employee in the system. No reporting manager is available yet.
          You can assign one later from the employee detail page.
        </Alert>
      ) : (
        <>
          {sameDeptCount === 0 && state.departmentId && (
            <Alert variant="warning">
              No employees found in the selected department. Showing employees from other departments.
            </Alert>
          )}

          <Select
            label="Reporting Manager"
            name="reportingManagerId"
            value={state.reportingManagerId}
            onChange={(e) => updateFields({ reportingManagerId: e.target.value })}
            options={[
              { value: "", label: "Select manager..." },
              ...managers.map((m) => ({
                value: m.id,
                label: `${m.full_name} (${m.employee_number}) — ${m.designation?.name || ""} · ${m.department?.name || ""}`,
              })),
            ]}
            required
            error={err("reportingManagerId")}
          />
        </>
      )}
    </div>
  );
}
