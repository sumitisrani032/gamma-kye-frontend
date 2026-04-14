"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onboardEmployee, assignRole } from "@/services/employee-service";
import type { ApiError } from "@/types";
import {
  ONBOARD_STEPS,
  INITIAL_WIZARD_STATE,
  STEP_VALIDATORS,
  type StepKey,
  type OnboardWizardState,
  type ValidationError,
} from "../types/onboard";

interface UseOnboardWizardReturn {
  /** Current wizard state */
  state: OnboardWizardState;
  /** Update one or more fields */
  updateFields: (fields: Partial<OnboardWizardState>) => void;
  /** Current step index (0-based) */
  currentStep: number;
  /** Current step key */
  currentStepKey: StepKey;
  /** Step definitions for the stepper UI */
  steps: typeof ONBOARD_STEPS;
  /** Navigate to next step (validates current step first) */
  next: () => boolean;
  /** Navigate to previous step */
  back: () => void;
  /** Jump to a specific step (only if all prior steps are valid) */
  goTo: (index: number) => boolean;
  /** Validation errors for the current step */
  errors: ValidationError[];
  /** Whether the current step has been validated (touched) */
  touched: boolean;
  /** Mark current step as touched (trigger validation display) */
  touch: () => void;
  /** Whether we're on the last step */
  isLastStep: boolean;
  /** Whether we're on the first step */
  isFirstStep: boolean;
  /** Submit the wizard */
  submit: () => Promise<void>;
  /** Whether submit is in progress */
  submitting: boolean;
  /** Global submission error */
  submitError: string;
  /** Backend field-level errors */
  submitFieldErrors: Record<string, string[]>;
  /** Track which steps have been completed */
  completedSteps: Set<number>;
}

export function useOnboardWizard(): UseOnboardWizardReturn {
  const router = useRouter();
  const [state, setState] = useState<OnboardWizardState>(INITIAL_WIZARD_STATE);
  const [currentStep, setCurrentStep] = useState(0);
  const [touchedSteps, setTouchedSteps] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitFieldErrors, setSubmitFieldErrors] = useState<Record<string, string[]>>({});

  const currentStepKey = ONBOARD_STEPS[currentStep].key;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARD_STEPS.length - 1;

  const updateFields = useCallback((fields: Partial<OnboardWizardState>) => {
    setState((prev) => ({ ...prev, ...fields }));
  }, []);

  // Validate a specific step
  const validateStep = useCallback((stepIndex: number): ValidationError[] => {
    const key = ONBOARD_STEPS[stepIndex].key;
    return STEP_VALIDATORS[key](state);
  }, [state]);

  // Current step errors
  const errors = useMemo(() => validateStep(currentStep), [validateStep, currentStep]);

  const touched = touchedSteps.has(currentStep);

  const touch = useCallback(() => {
    setTouchedSteps((prev) => new Set(prev).add(currentStep));
  }, [currentStep]);

  // Track completed steps
  const completedSteps = useMemo(() => {
    const completed = new Set<number>();
    for (let i = 0; i < ONBOARD_STEPS.length; i++) {
      if (validateStep(i).length === 0 && touchedSteps.has(i)) {
        completed.add(i);
      }
    }
    return completed;
  }, [validateStep, touchedSteps]);

  const next = useCallback((): boolean => {
    // Mark current step as touched
    setTouchedSteps((prev) => new Set(prev).add(currentStep));

    // Validate current step
    const stepErrors = validateStep(currentStep);
    if (stepErrors.length > 0) return false;

    if (currentStep < ONBOARD_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
    return true;
  }, [currentStep, validateStep]);

  const back = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goTo = useCallback((index: number): boolean => {
    if (index < 0 || index >= ONBOARD_STEPS.length) return false;

    // Can always go back
    if (index <= currentStep) {
      setCurrentStep(index);
      return true;
    }

    // Going forward: validate all steps in between
    for (let i = currentStep; i < index; i++) {
      setTouchedSteps((prev) => new Set(prev).add(i));
      if (validateStep(i).length > 0) {
        setCurrentStep(i);
        return false;
      }
    }
    setCurrentStep(index);
    return true;
  }, [currentStep, validateStep]);

  const submit = useCallback(async () => {
    // Validate all required steps before submitting
    for (let i = 0; i < ONBOARD_STEPS.length; i++) {
      const stepErrors = validateStep(i);
      if (stepErrors.length > 0) {
        setTouchedSteps((prev) => {
          const next = new Set(prev);
          next.add(i);
          return next;
        });
        setCurrentStep(i);
        return;
      }
    }

    setSubmitError("");
    setSubmitFieldErrors({});
    setSubmitting(true);

    try {
      const emp = await onboardEmployee({
        employee: {
          first_name: state.firstName,
          last_name: state.lastName,
          email_official: state.emailOfficial,
          company_id: state.companyId,
          department_id: state.departmentId,
          designation_id: state.designationId,
          grade_id: state.gradeId || undefined,
          location_id: state.locationId,
          date_of_joining: state.dateOfJoining,
          employment_type: state.employmentType,
          gender: state.gender || undefined,
          reporting_manager_id: state.reportingManagerId || undefined,
          phone: state.phone || undefined,
        },
        password: state.password || undefined,
        password_confirmation: state.passwordConfirmation || undefined,
      });

      // Assign additional roles (beyond auto-assigned "Employee")
      for (const roleId of state.roleIds) {
        try {
          await assignRole(emp.id, roleId);
        } catch {
          // Non-critical — can be assigned later from detail page
        }
      }

      router.push(`/employees/${emp.id}`);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) {
        setSubmitFieldErrors(apiError.errors);
        // Map backend field names to wizard steps and navigate to the first errored step
        const errorFields = Object.keys(apiError.errors);
        if (errorFields.some((f) => ["first_name", "last_name", "email_official", "phone", "date_of_joining"].includes(f))) {
          setCurrentStep(0);
        } else if (errorFields.some((f) => ["company_id", "department_id", "designation_id", "location_id"].includes(f))) {
          setCurrentStep(1);
        } else if (errorFields.some((f) => ["reporting_manager_id"].includes(f))) {
          setCurrentStep(2);
        }
      } else {
        setSubmitError(apiError.error || "Failed to onboard employee. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [state, validateStep, router]);

  return {
    state,
    updateFields,
    currentStep,
    currentStepKey,
    steps: ONBOARD_STEPS,
    next,
    back,
    goTo,
    errors,
    touched,
    touch,
    isFirstStep,
    isLastStep,
    submit,
    submitting,
    submitError,
    submitFieldErrors,
    completedSteps,
  };
}
