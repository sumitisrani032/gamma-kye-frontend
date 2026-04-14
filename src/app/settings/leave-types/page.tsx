"use client";

import { TopBar } from "@/components/layout/top-bar";
import { LeaveTypeList } from "@/features/leave-types/components/leave-type-list";

export default function LeaveTypesPage() {
  return (
    <>
      <TopBar title="Leave Types" description="Manage leave categories and their rules" />
      <div className="px-8 py-6">
        <LeaveTypeList />
      </div>
    </>
  );
}
