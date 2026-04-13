"use client";

import { use } from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { ApprovalDetail } from "@/features/approvals/components/approval-detail";

export default function ApprovalDetailPage({
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
          <div className="px-8 py-6">
            <ApprovalDetail id={id} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
