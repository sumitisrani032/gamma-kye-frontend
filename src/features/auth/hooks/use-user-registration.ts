"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/services/auth-service";
import { useAuth } from "@/contexts/auth-context";
import type { ApiError } from "@/types";

interface UserFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

const initialState: UserFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordConfirmation: "",
};

interface UseUserRegistrationReturn {
  form: UserFormState;
  errors: Record<string, string[]>;
  globalError: string;
  loading: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  fieldError: (field: string) => string | undefined;
}

export function useUserRegistration(): UseUserRegistrationReturn {
  const [form, setForm] = useState<UserFormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshAuth } = useAuth();
  const router = useRouter();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});
      setGlobalError("");
      setLoading(true);

      try {
        await registerUser({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          password: form.password,
          password_confirmation: form.passwordConfirmation,
        });
        await refreshAuth();
        router.push("/dashboard");
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
    [form, refreshAuth, router]
  );

  const fieldError = useCallback(
    (field: string) => errors[field]?.[0],
    [errors]
  );

  return { form, errors, globalError, loading, handleChange, handleSubmit, fieldError };
}
