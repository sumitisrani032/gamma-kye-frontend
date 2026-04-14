"use client";

import { TopBar } from "@/components/layout/top-bar";
import { BusinessUnitList } from "@/features/business-units/components/business-unit-list";

export default function BusinessUnitsPage() {
  return (
    <>
      <TopBar title="Business Units" description="Manage organizational business units" />
      <div className="px-8 py-6">
        <BusinessUnitList />
      </div>
    </>
  );
}
