"use client";

import { use } from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { RoleDetailView } from "@/features/roles/components/role-detail-view";

export default function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="Role Details" />
          <div className="px-8 py-6">
            <RoleDetailView id={id} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
