"use client";

import { use } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { WorkflowForm } from "@/features/workflows/components/workflow-form";

export default function EditWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      <TopBar title="Edit Workflow" />
      <div className="px-8 py-6">
        <WorkflowForm editId={id} />
      </div>
    </>
  );
}
