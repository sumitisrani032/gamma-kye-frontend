"use client";

import { useState } from "react";
import { Button, Card, Alert } from "@/components/ui";
import { useSetupWizard } from "../hooks/use-setup-wizard";
import { CompanyList } from "@/features/companies/components/company-list";
import type { SetupStep } from "@/types";

/** Map step keys to their inline config components. Steps without a component show a placeholder. */
const STEP_COMPONENTS: Record<string, React.FC<{ onDataChange: () => void }>> = {
  company: ({ onDataChange }) => <CompanyList onDataChange={onDataChange} />,
};

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

interface StepItemProps {
  step: SetupStep;
  isOpen: boolean;
  onToggle: () => void;
  onDataChange: () => void;
}

function StepItem({ step, isOpen, onToggle, onDataChange }: StepItemProps) {
  const StepContent = STEP_COMPONENTS[step.key];

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-secondary transition-colors"
      >
        {step.completed ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckIcon />
          </span>
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface" />
        )}
        <span className={`flex-1 text-sm ${step.completed ? "text-text-secondary" : "text-text-primary font-medium"}`}>
          {step.label}
        </span>
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 pl-13">
          {StepContent ? (
            <StepContent onDataChange={onDataChange} />
          ) : (
            <p className="text-sm text-text-muted italic">
              This step will be available once its API is integrated.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export function SetupWizard() {
  const { status, loading, completing, error, refresh, handleComplete } = useSetupWizard();
  const [openStep, setOpenStep] = useState<string | null>(null);

  const toggleStep = (key: string) => {
    setOpenStep((prev) => (prev === key ? null : key));
  };

  const handleDataChange = () => {
    refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Alert variant="error">Failed to load setup status. Please refresh.</Alert>
      </div>
    );
  }

  const { mandatory_steps, optional_steps, progress, can_complete } = status;

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            Organization Setup
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Complete the mandatory steps below to unlock your workspace.
          </p>
        </div>

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
            <span>Progress</span>
            <span>{progress.completed} / {progress.total} mandatory steps</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-tertiary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-600 transition-all duration-500"
              style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Mandatory steps */}
        <Card className="mb-6">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-text-primary">
              Mandatory Steps
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Click a step to configure it. All steps must be completed to finish setup.
            </p>
          </div>
          <ul className="divide-y divide-border">
            {mandatory_steps.map((step) => (
              <StepItem
                key={step.key}
                step={step}
                isOpen={openStep === step.key}
                onToggle={() => toggleStep(step.key)}
                onDataChange={handleDataChange}
              />
            ))}
          </ul>
        </Card>

        {/* Optional steps */}
        {optional_steps.length > 0 && (
          <Card className="mb-8">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-text-primary">
                Optional Steps
              </h2>
              <p className="text-xs text-text-muted mt-1">
                These can be configured later from Settings.
              </p>
            </div>
            <ul className="divide-y divide-border">
              {optional_steps.map((step) => (
                <StepItem
                  key={step.key}
                  step={step}
                  isOpen={openStep === step.key}
                  onToggle={() => toggleStep(step.key)}
                  onDataChange={handleDataChange}
                />
              ))}
            </ul>
          </Card>
        )}

        {/* Complete setup button */}
        <Button
          size="lg"
          className="w-full"
          disabled={!can_complete}
          loading={completing}
          onClick={handleComplete}
        >
          {can_complete ? "Complete Setup" : "Complete all mandatory steps to continue"}
        </Button>
      </div>
    </div>
  );
}
