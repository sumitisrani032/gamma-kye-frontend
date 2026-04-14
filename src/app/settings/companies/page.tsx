"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { CompanyList } from "@/features/companies/components/company-list";

export default function CompaniesPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Companies"
            description="Manage your organization's legal entities"
          />
          <div className="px-8 py-6">
            <CompanyList />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
