"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardContent, Alert, Stepper } from "@/components/ui";
import { Can } from "@/components/common/can";
import { useOnboardWizard } from "../hooks/use-onboard-wizard";
import { useOrgLookups } from "../hooks/use-org-lookups";
import { useDepartmentManagers } from "../hooks/use-department-managers";
import { getRoles } from "@/services/role-service";
import type { RoleSummary } from "@/types";

// Steps
import { BasicInfoStep } from "./steps/basic-info-step";
import { OrgAssignmentStep } from "./steps/org-assignment-step";
import { ReportingStep } from "./steps/reporting-step";
import { RoleAccessStep } from "./steps/role-access-step";
import { EmploymentStep } from "./steps/employment-step";
import { PolicyStep } from "./steps/policy-step";
import { DocumentsStep } from "./steps/documents-step";
import { ReviewStep } from "./steps/review-step";

function Unauthorized() {
  return (
    <Alert variant="error">
      You do not have permission to onboard employees. Contact your administrator.
    </Alert>
  );
}

function WizardContent() {
  const wizard = useOnboardWizard();
  const org = useOrgLookups();
  const { managers } = useDepartmentManagers(wizard.state.departmentId);
  const [roles, setRoles] = useState<RoleSummary[]>([]);

  useEffect(() => {
    getRoles().then(setRoles).catch(() => {});
  }, []);

  if (org.loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const renderStep = () => {
    const common = { state: wizard.state, updateFields: wizard.updateFields, errors: wizard.errors, touched: wizard.touched, serverErrors: wizard.submitFieldErrors };

    switch (wizard.currentStepKey) {
      case "basic_info":
        return <BasicInfoStep {...common} />;
      case "org_assignment":
        return (
          <OrgAssignmentStep
            {...common}
            companies={org.companies}
            departments={org.departments}
            designations={org.designations}
            locations={org.locations}
          />
        );
      case "reporting":
        return <ReportingStep {...common} />;
      case "role_access":
        return <RoleAccessStep state={wizard.state} updateFields={wizard.updateFields} />;
      case "employment":
        return <EmploymentStep state={wizard.state} updateFields={wizard.updateFields} grades={org.grades} />;
      case "policy":
        return <PolicyStep />;
      case "documents":
        return <DocumentsStep state={wizard.state} updateFields={wizard.updateFields} />;
      case "review":
        return (
          <ReviewStep
            state={wizard.state}
            companies={org.companies}
            departments={org.departments}
            designations={org.designations}
            grades={org.grades}
            locations={org.locations}
            managers={managers}
            roles={roles}
            submitError={wizard.submitError}
            submitFieldErrors={wizard.submitFieldErrors}
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <Stepper
        steps={wizard.steps}
        currentStep={wizard.currentStep}
        completedSteps={wizard.completedSteps}
        onStepClick={(index) => wizard.goTo(index)}
      />

      {/* Step Content */}
      <Card>
        <CardContent className="p-6 sm:p-8">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="secondary"
          onClick={wizard.back}
          disabled={wizard.isFirstStep}
        >
          Back
        </Button>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          Step {wizard.currentStep + 1} of {wizard.steps.length}
        </div>

        {wizard.isLastStep ? (
          <Button
            onClick={wizard.submit}
            loading={wizard.submitting}
          >
            Onboard Employee
          </Button>
        ) : (
          <Button onClick={() => wizard.next()}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

export function OnboardWizard() {
  return (
    <Can resource="employee" action="create" fallback={<Unauthorized />}>
      <WizardContent />
    </Can>
  );
}
