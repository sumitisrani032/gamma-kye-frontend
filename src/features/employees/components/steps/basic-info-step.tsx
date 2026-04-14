"use client";

import { Input, Select } from "@/components/ui";
import { fieldError, type OnboardWizardState, type ValidationError } from "../../types/onboard";

const GENDER_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

interface BasicInfoStepProps {
  state: OnboardWizardState;
  updateFields: (fields: Partial<OnboardWizardState>) => void;
  errors: ValidationError[];
  touched: boolean;
  serverErrors?: Record<string, string[]>;
}

/** Map wizard field names to backend field names for server error lookup */
const FIELD_MAP: Record<string, string> = {
  firstName: "first_name",
  lastName: "last_name",
  emailOfficial: "email_official",
  phone: "phone",
  dateOfJoining: "date_of_joining",
};

export function BasicInfoStep({ state, updateFields, errors, touched, serverErrors = {} }: BasicInfoStepProps) {
  const err = (field: string) => {
    const serverKey = FIELD_MAP[field];
    const serverMsg = serverKey ? serverErrors[serverKey]?.[0] : undefined;
    return serverMsg || (touched ? fieldError(errors, field) : undefined);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Basic Information</h3>
        <p className="text-sm text-text-secondary mt-1">Enter the employee's personal details.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="First Name"
          value={state.firstName}
          onChange={(e) => updateFields({ firstName: e.target.value })}
          required
          placeholder="John"
          error={err("firstName")}
        />
        <Input
          label="Last Name"
          value={state.lastName}
          onChange={(e) => updateFields({ lastName: e.target.value })}
          required
          placeholder="Doe"
          error={err("lastName")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Official Email"
          type="email"
          value={state.emailOfficial}
          onChange={(e) => updateFields({ emailOfficial: e.target.value })}
          required
          placeholder="john.doe@company.com"
          error={err("emailOfficial")}
        />
        <Input
          label="Phone"
          value={state.phone}
          onChange={(e) => updateFields({ phone: e.target.value })}
          placeholder="+91 98765 43210"
          error={err("phone")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Date of Joining"
          type="date"
          value={state.dateOfJoining}
          onChange={(e) => updateFields({ dateOfJoining: e.target.value })}
          required
          error={err("dateOfJoining")}
        />
        <Select
          label="Gender"
          name="gender"
          value={state.gender}
          onChange={(e) => updateFields({ gender: e.target.value })}
          options={GENDER_OPTIONS}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Login Password"
          type="password"
          value={state.password}
          onChange={(e) => updateFields({ password: e.target.value })}
          required
          placeholder="Min. 8 characters"
          minLength={8}
          error={err("password")}
        />
        <Input
          label="Confirm Password"
          type="password"
          value={state.passwordConfirmation}
          onChange={(e) => updateFields({ passwordConfirmation: e.target.value })}
          required
          placeholder="Repeat password"
          error={err("passwordConfirmation")}
        />
      </div>
      <p className="text-xs text-text-muted">
        This password will be used by the employee to log in. Share it securely after onboarding.
      </p>
    </div>
  );
}
