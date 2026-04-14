"use client";

import { TopBar } from "@/components/layout/top-bar";
import { DesignationList } from "@/features/designations/components/designation-list";

export default function DesignationsPage() {
  return (
    <>
      <TopBar title="Designations" description="Manage job titles and seniority levels" />
      <div className="px-8 py-6">
        <DesignationList />
      </div>
    </>
  );
}
