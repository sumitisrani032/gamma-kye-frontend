"use client";

import { ProtectedRoute } from "@/components/common/protected-route";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Can } from "@/components/common/can";
import { WorkflowList } from "@/features/workflows/components/workflow-list";
import { Alert } from "@/components/ui";

export default function WorkflowDefinitionsPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Workflow Settings"
            description="Configure approval workflows for your organization"
          />
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
