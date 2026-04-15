"use client";

import { TopBar } from "@/components/layout/top-bar";
import { DocumentRequirementList } from "@/features/document-requirements/components/document-requirement-list";

export default function DocumentRequirementsPage() {
  return (
    <>
      <TopBar title="Document Requirements" description="Define required documents for employees" />
      <div className="px-8 py-6">
        <DocumentRequirementList />
      </div>
    </>
  );
}
