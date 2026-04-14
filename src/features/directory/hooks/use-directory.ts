"use client";

import { useState, useEffect, useCallback } from "react";
import { listDirectory } from "@/services/directory-service";
import type { DirectoryEmployee, ApiError } from "@/types";

interface UseDirectoryReturn {
  employees: DirectoryEmployee[];
  loading: boolean;
  error: string;
  search: string;
  setSearch: (q: string) => void;
  filtered: DirectoryEmployee[];
}

export function useDirectory(): UseDirectoryReturn {
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    listDirectory()
      .then(setEmployees)
      .catch((err) => {
        const apiError = err as ApiError;
        setError(apiError.error || "Failed to load directory.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? employees.filter((e) => {
        const q = search.toLowerCase();
        return (
          e.full_name.toLowerCase().includes(q) ||
          e.email_official.toLowerCase().includes(q) ||
          e.employee_number.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q)
        );
      })
    : employees;

  return { employees, loading, error, search, setSearch, filtered };
}
