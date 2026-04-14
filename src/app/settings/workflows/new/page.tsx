"use client";

import { TopBar } from "@/components/layout/top-bar";
import { WorkflowForm } from "@/features/workflows/components/workflow-form";

export default function NewWorkflowPage() {
  return (
    <>
      <TopBar title="New Workflow" />
      <div className="px-8 py-6">
        <WorkflowForm />
      </div>
    </>
  );
}
