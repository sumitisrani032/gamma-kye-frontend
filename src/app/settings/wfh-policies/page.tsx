"use client";

import { TopBar } from "@/components/layout/top-bar";
import { WfhPolicyList } from "@/features/wfh-policies/components/wfh-policy-list";

export default function WfhPoliciesPage() {
  return (
    <>
      <TopBar title="WFH Policies" description="Configure work from home policies for your organization" />
      <div className="px-8 py-6">
        <WfhPolicyList />
      </div>
    </>
  );
}
