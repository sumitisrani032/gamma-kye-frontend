"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { OnboardWizard } from "@/features/employees/components/onboard-wizard";

export default function NewEmployeePage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Onboard Employee"
            description="Step-by-step employee onboarding"
          />
          <div className="px-8 py-6">
            <OnboardWizard />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
