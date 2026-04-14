"use client";

import { useState, useEffect } from "react";
import { listEmployees } from "@/services/employee-service";
import type { EmployeeListItem } from "@/types";

interface UseDepartmentManagersReturn {
  managers: EmployeeListItem[];
  allEmployees: EmployeeListItem[];
  loading: boolean;
}

/**
 * Fetches active employees and filters potential managers by department.
 * When no departmentId is provided, returns all active employees.
 *
 * Prioritizes same-department employees but always includes all as fallback
 * (e.g. first employee in a department needs a cross-dept manager).
 */
export function useDepartmentManagers(departmentId: string): UseDepartmentManagersReturn {
  const [allEmployees, setAllEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEmployees({ active: true })
      .then(setAllEmployees)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Same-department employees first, then others
  const managers = departmentId
    ? [
        ...allEmployees.filter((e) => e.department?.id === departmentId),
        ...allEmployees.filter((e) => e.department?.id !== departmentId),
      ]
    : allEmployees;

  return { managers, allEmployees, loading };
}
