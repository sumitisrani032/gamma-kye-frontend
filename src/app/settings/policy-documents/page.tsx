"use client";

import { TopBar } from "@/components/layout/top-bar";
import { PolicyDocumentList } from "@/features/policy-documents/components/policy-document-list";

export default function PolicyDocumentsSettingsPage() {
  return (
    <>
      <TopBar title="Policy Documents" description="Create and manage organization policies" />
      <div className="px-8 py-6">
        <PolicyDocumentList />
      </div>
    </>
  );
}
