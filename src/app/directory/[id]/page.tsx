"use client";

import { use } from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { DirectoryDetail } from "@/features/directory/components/directory-detail";

export default function DirectoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="Employee Profile" />
          <div className="px-8 py-6">
            <DirectoryDetail employeeId={id} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
