"use client";

import { TopBar } from "@/components/layout/top-bar";
import { LeavePolicyList } from "@/features/leave-policies/components/leave-policy-list";

export default function LeavePoliciesPage() {
  return (
    <>
      <TopBar title="Leave Policies" description="Manage leave allocation policies per leave type" />
      <div className="px-8 py-6">
        <LeavePolicyList />
      </div>
    </>
  );
}
