"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth-service";
import { useAuth } from "@/contexts/auth-context";
import type { ApiError } from "@/types";

interface UseLoginReturn {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useLogin(): UseLoginReturn {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshAuth } = useAuth();
  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        await login({ email, password });
        await refreshAuth();
        router.push("/dashboard");
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.status === 404) {
          setError("Workspace not found. Please check the URL.");
        } else if (apiError.status === 403) {
          setError(apiError.error || "Your account or workspace is not accessible.");
        } else {
          setError(apiError.error || "Invalid email or password.");
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, refreshAuth, router]
  );

  return { email, setEmail, password, setPassword, error, loading, handleSubmit };
}
