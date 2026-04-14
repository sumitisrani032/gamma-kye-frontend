"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { EmployeeList } from "@/features/employees/components/employee-list";

export default function EmployeesPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Employees"
            description="Manage your organization's workforce"
          />
          <div className="px-8 py-6">
            <EmployeeList />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
