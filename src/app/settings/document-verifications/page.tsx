"use client";

import { TopBar } from "@/components/layout/top-bar";
import { DocumentVerificationList } from "@/features/document-verifications/components/document-verification-list";

export default function DocumentVerificationsPage() {
  return (
    <>
      <TopBar title="Document Verifications" description="Review and verify employee documents" />
      <div className="px-8 py-6">
        <DocumentVerificationList />
      </div>
    </>
  );
}
