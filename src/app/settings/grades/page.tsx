"use client";

import { TopBar } from "@/components/layout/top-bar";
import { GradeList } from "@/features/grades/components/grade-list";

export default function GradesPage() {
  return (
    <>
      <TopBar title="Grades" description="Manage pay grades and seniority bands" />
      <div className="px-8 py-6">
        <GradeList />
      </div>
    </>
  );
}
