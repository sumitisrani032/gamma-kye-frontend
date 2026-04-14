"use client";

import Link from "next/link";
import { Button, Alert } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useEmployees } from "../hooks/use-employees";
import type { EmployeeListItem } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  on_notice: "bg-yellow-100 text-yellow-700",
  exited: "bg-red-100 text-red-700",
  absconding: "bg-red-100 text-red-700",
};

function EmployeeRow({ emp }: { emp: EmployeeListItem }) {
  return (
    <Link
      href={`/employees/${emp.id}`}
      className="flex items-center gap-4 px-4 py-3 hover:bg-surface-secondary transition-colors"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
        {emp.first_name[0]}{emp.last_name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text-primary truncate">{emp.full_name}</p>
          <span className="text-xs text-text-muted font-mono">{emp.employee_number}</span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[emp.employment_status] || "bg-surface-tertiary text-text-muted"}`}>
            {emp.employment_status.replace("_", " ")}
          </span>
        </div>
        <p className="text-xs text-text-muted mt-0.5">
          {emp.designation?.name || "—"} &middot; {emp.department?.name || "—"} &middot; {emp.email_official}
        </p>
      </div>
    </Link>
  );
}

export function EmployeeList() {
  const { employees, loading, error } = useEmployees();
  const { canWithScope } = useAuth();
  const canManage = canWithScope("employee", "create", "department");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {employees.length} {employees.length === 1 ? "employee" : "employees"}
        </p>
        {canManage && (
          <Link href="/employees/new">
            <Button>Onboard Employee</Button>
          </Link>
        )}
      </div>

      {employees.length === 0 && !error ? (
        <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
          No employees found.
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {employees.map((emp) => (
            <EmployeeRow key={emp.id} emp={emp} />
          ))}
        </div>
      )}
    </div>
  );
}
