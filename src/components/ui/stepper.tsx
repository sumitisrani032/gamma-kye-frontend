interface Step {
  key: string;
  label: string;
}

interface StepperProps {
  steps: readonly Step[];
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, currentStep, completedSteps, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Onboarding progress" className="mb-8">
      <ol className="flex items-center gap-1">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps.has(index);
          const isPast = index < currentStep;
          const isClickable = isPast || isCompleted || index === currentStep;

          return (
            <li key={step.key} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={`
                  flex items-center gap-2 text-xs font-medium transition-colors rounded-lg px-2 py-1.5 w-full
                  ${isActive ? "text-primary-700 bg-primary-50" : ""}
                  ${isCompleted && !isActive ? "text-green-700" : ""}
                  ${!isActive && !isCompleted ? "text-text-muted" : ""}
                  ${isClickable ? "cursor-pointer hover:bg-surface-secondary" : "cursor-default"}
                `}
              >
                <span
                  className={`
                    flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold
                    ${isActive ? "bg-primary-600 text-white" : ""}
                    ${isCompleted && !isActive ? "bg-green-100 text-green-700" : ""}
                    ${!isActive && !isCompleted ? "bg-surface-tertiary text-text-muted" : ""}
                  `}
                >
                  {isCompleted && !isActive ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="hidden sm:inline truncate">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`h-px flex-1 mx-1 ${isPast || isCompleted ? "bg-green-300" : "bg-border"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
