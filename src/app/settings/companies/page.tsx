"use client";

import { TopBar } from "@/components/layout/top-bar";
import { CompanyList } from "@/features/companies/components/company-list";

export default function CompaniesPage() {
  return (
    <>
      <TopBar title="Companies" description="Manage your organization's legal entities" />
      <div className="px-8 py-6">
        <CompanyList />
      </div>
    </>
  );
}
