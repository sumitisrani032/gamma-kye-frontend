"use client";

import { useState, useEffect, useCallback } from "react";
import { listDirectory } from "@/services/directory-service";
import type { EmployeeListItem, ApiError } from "@/types";

interface UseEmployeesReturn {
  employees: EmployeeListItem[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  filterByDepartment: (departmentId: string | null) => void;
  departmentFilter: string | null;
}

export function useEmployees(): UseEmployeesReturn {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      // Always use directory endpoint — it's the company phonebook (shows ALL employees)
      // /manage/employees is scoped by user's permission and may return partial data
      const dirData = await listDirectory(departmentFilter ?? undefined);
      const mapped: EmployeeListItem[] = dirData.map((d) => ({
        id: d.id,
        employee_number: d.employee_number,
        first_name: d.full_name.split(" ")[0] || d.full_name,
        last_name: d.full_name.split(" ").slice(1).join(" ") || "",
        full_name: d.full_name,
        email_official: d.email_official,
        phone: d.phone,
        designation: d.designation ? { id: "", name: d.designation, level: 0 } : null,
        department: d.department ? { id: "", name: d.department } : null,
        employment_status: "active" as const,
        profile_photo_url: d.profile_photo_url,
      }));
      setEmployees(mapped);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }, [departmentFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filterByDepartment = useCallback((departmentId: string | null) => {
    setDepartmentFilter(departmentId);
  }, []);

  return { employees, loading, error, refresh, filterByDepartment, departmentFilter };
}
