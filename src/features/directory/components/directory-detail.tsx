"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, Alert } from "@/components/ui";
import { getDirectoryEmployee } from "@/services/directory-service";
import type { EmployeeDetail, ApiError } from "@/types";

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-1.5">
      <dt className="text-text-secondary text-sm">{label}</dt>
      <dd className="text-text-primary text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

interface DirectoryDetailProps {
  employeeId: string;
}

export function DirectoryDetail({ employeeId }: DirectoryDetailProps) {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDirectoryEmployee(employeeId)
      .then(setEmployee)
      .catch((err) => {
        const apiError = err as ApiError;
        setError(apiError.error || "Failed to load employee.");
      })
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !employee) {
    return <Alert variant="error">{error || "Employee not found."}</Alert>;
  }

  return (
    <div className="space-y-6">
      <Link href="/directory" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary-600 transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Directory
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-xl font-bold text-primary-700">
          {employee.first_name[0]}{employee.last_name[0]}
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{employee.full_name}</h2>
          <p className="text-sm text-text-secondary">
            {employee.designation?.name || "—"} &middot; {employee.department?.name || "—"} &middot; {employee.employee_number}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-text-primary">Contact</h3></CardHeader>
          <CardContent>
            <dl>
              <InfoRow label="Email" value={employee.email_official} />
              <InfoRow label="Phone" value={employee.phone} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-text-primary">Organization</h3></CardHeader>
          <CardContent>
            <dl>
              <InfoRow label="Designation" value={employee.designation?.name} />
              <InfoRow label="Department" value={employee.department?.name} />
              <InfoRow label="Grade" value={employee.grade?.name} />
              <InfoRow label="Location" value={employee.location?.name} />
              <InfoRow label="Manager" value={employee.reporting_manager?.full_name} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
