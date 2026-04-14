"use client";

import { TopBar } from "@/components/layout/top-bar";
import { HolidayCalendarList } from "@/features/holiday-calendars/components/holiday-calendar-list";

export default function HolidayCalendarsPage() {
  return (
    <>
      <TopBar title="Holiday Calendars" description="Manage holiday calendars and their holidays" />
      <div className="px-8 py-6">
        <HolidayCalendarList />
      </div>
    </>
  );
}
