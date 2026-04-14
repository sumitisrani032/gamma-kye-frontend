"use client";

import { TopBar } from "@/components/layout/top-bar";
import { ShiftList } from "@/features/shifts/components/shift-list";

export default function ShiftsPage() {
  return (
    <>
      <TopBar title="Work Shifts" description="Manage shift timings and weekly schedules" />
      <div className="px-8 py-6">
        <ShiftList />
      </div>
    </>
  );
}
