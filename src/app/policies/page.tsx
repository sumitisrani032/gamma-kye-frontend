"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { PoliciesPage } from "@/features/policies/components/policies-page";
import { useAuth } from "@/contexts/auth-context";

export default function PoliciesRoute() {
  const { user } = useAuth();
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="Policies" description="View organization policies and acknowledgements" />
          <div className="px-8 py-6">
            <PoliciesPage key={user?.id} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
