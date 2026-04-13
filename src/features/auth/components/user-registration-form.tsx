"use client";

import Link from "next/link";
import { Button, Input, Alert } from "@/components/ui";
import { useUserRegistration } from "../hooks/use-user-registration";

interface UserRegistrationFormProps {
  subdomain: string;
}

export function UserRegistrationForm({ subdomain }: UserRegistrationFormProps) {
  const { form, globalError, loading, handleChange, handleSubmit, fieldError } =
    useUserRegistration();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-600">GammaKYE</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Create account for{" "}
            <span className="font-medium text-text-primary">{subdomain}</span>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-xl border border-border shadow-sm p-8 space-y-5"
        >
          {globalError && <Alert variant="error">{globalError}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="Jane"
              required
              error={fieldError("first_name")}
            />
            <Input
              label="Last Name"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Doe"
              required
              error={fieldError("last_name")}
            />
          </div>

          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@company.com"
            required
            error={fieldError("email")}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Min. 8 characters"
            required
            minLength={8}
            error={fieldError("password")}
          />

          <Input
            label="Confirm Password"
            name="passwordConfirmation"
            type="password"
            value={form.passwordConfirmation}
            onChange={handleChange}
            placeholder="Repeat your password"
            required
            error={fieldError("password_confirmation")}
          />

          <Button type="submit" className="w-full" loading={loading}>
            Create Account
          </Button>

          <p className="text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
