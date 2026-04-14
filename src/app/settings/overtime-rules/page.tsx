"use client";

import { TopBar } from "@/components/layout/top-bar";
import { OvertimeRuleList } from "@/features/overtime-rules/components/overtime-rule-list";

export default function OvertimeRulesPage() {
  return (
    <>
      <TopBar title="Overtime Rules" description="Manage overtime calculation rules and limits" />
      <div className="px-8 py-6">
        <OvertimeRuleList />
      </div>
    </>
  );
}
