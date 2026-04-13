"use client";

import { useState, useCallback } from "react";
import { registerTenant } from "@/services/auth-service";
import { navigateToTenant } from "@/lib/tenant";
import type { ApiError } from "@/types";

interface TenantFormState {
  tenantName: string;
  subdomain: string;
  plan: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

const initialState: TenantFormState = {
  tenantName: "",
  subdomain: "",
  plan: "starter",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordConfirmation: "",
};

interface UseTenantRegistrationReturn {
  form: TenantFormState;
  errors: Record<string, string[]>;
  globalError: string;
  loading: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setSubdomain: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  fieldError: (field: string) => string | undefined;
}

export function useTenantRegistration(): UseTenantRegistrationReturn {
  const [form, setForm] = useState<TenantFormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      setForm((prev) => {
        const next = { ...prev, [name]: value };

        // Auto-generate subdomain slug from company name when subdomain hasn't been manually edited
        if (name === "tenantName" && !prev.subdomain) {
          next.subdomain = value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
        }

        return next;
      });
    },
    []
  );

  const setSubdomain = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      subdomain: value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});
      setGlobalError("");
      setLoading(true);

      try {
        const data = await registerTenant({
          tenant: {
            name: form.tenantName,
            subdomain: form.subdomain.toLowerCase(),
            plan: form.plan,
          },
          user: {
            email: form.email,
            password: form.password,
            password_confirmation: form.passwordConfirmation,
            first_name: form.firstName,
            last_name: form.lastName,
          },
        });

        navigateToTenant(data.tenant.subdomain, "/dashboard");
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.errors) {
          setErrors(apiError.errors);
        } else {
          setGlobalError(apiError.error || "Registration failed. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  const fieldError = useCallback(
    (field: string) => errors[field]?.[0],
    [errors]
  );

  return { form, errors, globalError, loading, handleChange, setSubdomain, handleSubmit, fieldError };
}
