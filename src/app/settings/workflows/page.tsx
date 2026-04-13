"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { Can } from "@/components/common/can";
import { WorkflowList } from "@/features/workflows/components/workflow-list";
import { Alert } from "@/components/ui";

export default function WorkflowDefinitionsPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="border-b border-border bg-surface px-8 py-6">
            <h1 className="text-2xl font-bold text-text-primary">
              Workflow Settings
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Configure approval workflows for your organization
            </p>
          </div>
          <div className="px-8 py-6">
            <Can
              resource="workflow"
              action="read"
              fallback={
                <Alert variant="warning">
                  You don&apos;t have permission to view workflow definitions.
                </Alert>
              }
            >
              <WorkflowList />
            </Can>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
