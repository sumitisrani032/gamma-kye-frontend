"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from "@/services/company-service";
import type { CompanySummary, CompanyFormData, ApiError } from "@/types";

interface UseCompaniesReturn {
  companies: CompanySummary[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  add: (data: CompanyFormData) => Promise<boolean>;
  update: (id: string, data: Partial<CompanyFormData>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  formError: string;
  fieldErrors: Record<string, string[]>;
  clearFormErrors: () => void;
}

export function useCompanies(): UseCompaniesReturn {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const clearFormErrors = useCallback(() => {
    setFormError("");
    setFieldErrors({});
  }, []);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const data = await listCompanies();
      setCompanies(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (data: CompanyFormData): Promise<boolean> => {
    clearFormErrors();
    try {
      await createCompany(data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to create company.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const update = useCallback(async (id: string, data: Partial<CompanyFormData>): Promise<boolean> => {
    clearFormErrors();
    try {
      await updateCompany(id, data);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) setFieldErrors(apiError.errors);
      else setFormError(apiError.error || "Failed to update company.");
      return false;
    }
  }, [refresh, clearFormErrors]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteCompany(id);
      await refresh();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to delete company.");
      return false;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { companies, loading, error, refresh, add, update, remove, formError, fieldErrors, clearFormErrors };
}
