"use client";

import Link from "next/link";
import { Button, Input, Select, Alert } from "@/components/ui";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { useTenantRegistration } from "../hooks/use-tenant-registration";
import { PLANS, BASE_DOMAIN } from "@/lib/constants";

export function TenantRegistrationForm() {
  const { form, globalError, loading, handleChange, setSubdomain, handleSubmit, fieldError } =
    useTenantRegistration();

  return (
    <>
      <MarketingHeader />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary">
              Create your workspace
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Set up your HR platform in minutes
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-surface rounded-xl border border-border shadow-sm p-8 space-y-6"
          >
            {globalError && <Alert variant="error">{globalError}</Alert>}

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                Company Details
              </legend>
              <Input
                label="Company Name"
                name="tenantName"
                value={form.tenantName}
                onChange={handleChange}
                placeholder="Acme Inc."
                required
                error={fieldError("tenant.name")}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-text-primary">
                  Workspace URL
                </label>
                <div className="flex items-center">
                  <Input
                    name="subdomain"
                    value={form.subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="acme"
                    required
                    className="rounded-r-none"
                    error={fieldError("tenant.subdomain")}
                  />
                  <span className="inline-flex items-center rounded-r-lg border border-l-0 border-border bg-surface-tertiary px-3 py-2 text-sm text-text-muted">
                    .{BASE_DOMAIN}
                  </span>
                </div>
              </div>
              <Select
                label="Plan"
                name="plan"
                value={form.plan}
                onChange={handleChange}
                options={[...PLANS]}
                error={fieldError("tenant.plan")}
              />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                Admin Account
              </legend>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Jane"
                  required
                  error={fieldError("user.first_name")}
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                  error={fieldError("user.last_name")}
                />
              </div>
              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane@acme.com"
                required
                error={fieldError("user.email")}
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
                error={fieldError("user.password")}
              />
              <Input
                label="Confirm Password"
                name="passwordConfirmation"
                type="password"
                value={form.passwordConfirmation}
                onChange={handleChange}
                placeholder="Repeat your password"
                required
                error={fieldError("user.password_confirmation")}
              />
            </fieldset>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create Workspace
            </Button>

            <p className="text-center text-sm text-text-secondary">
              Already have a workspace?{" "}
              <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
