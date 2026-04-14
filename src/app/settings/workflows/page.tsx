"use client";

import { TopBar } from "@/components/layout/top-bar";
import { Can } from "@/components/common/can";
import { WorkflowList } from "@/features/workflows/components/workflow-list";
import { Alert } from "@/components/ui";

export default function WorkflowDefinitionsPage() {
  return (
    <>
      <TopBar title="Workflow Settings" description="Configure approval workflows for your organization" />
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
    </>
  );
}
