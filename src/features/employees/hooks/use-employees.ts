"use client";

import { useState, useEffect, useCallback } from "react";
import { listEmployees } from "@/services/employee-service";
import { listDirectory } from "@/services/directory-service";
import type { EmployeeListItem, ApiError } from "@/types";

interface UseEmployeesReturn {
  employees: EmployeeListItem[];
  loading: boolean;
  error: string;
  isManageAccess: boolean;
  refresh: () => Promise<void>;
  filterByDepartment: (departmentId: string | null) => void;
  filterByStatus: (active: boolean | null) => void;
  activeFilter: boolean | null;
  departmentFilter: string | null;
}

export function useEmployees(): UseEmployeesReturn {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isManageAccess, setIsManageAccess] = useState(false);
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      // Try admin endpoint first; fall back to directory (read-only)
      const data = await listEmployees({
        active: activeFilter ?? undefined,
        department_id: departmentFilter ?? undefined,
      });
      setEmployees(data);
      setIsManageAccess(true);
    } catch {
      try {
        const dirData = await listDirectory(departmentFilter ?? undefined);
        // Map directory shape to EmployeeListItem shape
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
        setIsManageAccess(false);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.error || "Failed to load employees.");
      }
    } finally {
      setLoading(false);
    }
  }, [activeFilter, departmentFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filterByDepartment = useCallback((departmentId: string | null) => {
    setDepartmentFilter(departmentId);
  }, []);

  const filterByStatus = useCallback((active: boolean | null) => {
    setActiveFilter(active);
  }, []);

  return { employees, loading, error, isManageAccess, refresh, filterByDepartment, filterByStatus, activeFilter, departmentFilter };
}
