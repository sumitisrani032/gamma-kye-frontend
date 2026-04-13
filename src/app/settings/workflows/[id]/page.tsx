"use client";

import { use } from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { WorkflowForm } from "@/features/workflows/components/workflow-form";

export default function EditWorkflowPage({
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
            <WorkflowForm editId={id} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
