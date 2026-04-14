"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { LeavesPage } from "@/features/leaves/components/leaves-page";

export default function LeavesRoute() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="Leaves" description="Apply for leave and track your requests" />
          <div className="px-8 py-6">
            <LeavesPage />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
