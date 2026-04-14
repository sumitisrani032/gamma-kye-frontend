"use client";

import { TopBar } from "@/components/layout/top-bar";
import { DepartmentList } from "@/features/departments/components/department-list";

export default function DepartmentsPage() {
  return (
    <>
      <TopBar title="Departments" description="Manage departments and sub-departments" />
      <div className="px-8 py-6">
        <DepartmentList />
      </div>
    </>
  );
}
