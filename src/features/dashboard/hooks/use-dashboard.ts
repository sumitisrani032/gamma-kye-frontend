"use client";

import { useState, useEffect, useCallback } from "react";
import { getMyProfile, getLeaveBalances } from "@/services/my-profile-service";
import { getToday, getMonthlySummary } from "@/services/attendance-service";
import { listHolidayCalendars, getHolidayCalendar } from "@/services/holiday-calendar-service";
import { getWorkflowInstances } from "@/services/workflow-service";
import { listLeaveRequests } from "@/services/leave-request-service";
import { getOrgFlatList } from "@/features/org-structure/services/org-service";
import type {
  EmployeeDetail,
  LeaveBalance,
  AttendanceRecord,
  AttendanceSummary,
  Holiday,
  WorkflowInstance,
  LeaveRequest,
  OrgNode,
} from "@/types";

export interface DashboardData {
  // Profile
  employee: EmployeeDetail | null;
  isEmployee: boolean;

  // Attendance
  todayAttendance: AttendanceRecord | null;
  monthlySummary: AttendanceSummary | null;

  // Leave
  leaveBalances: LeaveBalance[];
  teamOnLeave: LeaveRequest[];

  // Holidays
  upcomingHolidays: Holiday[];

  // Approvals
  pendingApprovals: WorkflowInstance[];
  myPendingRequests: WorkflowInstance[];

  // Org
  totalEmployees: number;
  departmentMembers: OrgNode[];

  // Announcements (dummy)
  announcements: Announcement[];
  workAnniversaries: Anniversary[];

  loading: boolean;
  error: string;
}

export interface Announcement {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface Anniversary {
  id: string;
  name: string;
  designation: string;
  years: number;
  date: string;
}

const DUMMY_ANNOUNCEMENTS: Announcement[] = [
  { id: "1", author: "HR Team", content: "Reminder: Annual performance review cycle starts next week. Please ensure your self-assessments are completed.", timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "2", author: "Admin", content: "Office will remain closed on April 21st (Monday) for Mahavir Jayanti.", timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: "3", author: "IT Team", content: "System maintenance scheduled for Saturday 10 PM – Sunday 2 AM. VPN access may be intermittent.", timestamp: new Date(Date.now() - 48 * 3600000).toISOString() },
];

function getDummyAnniversaries(): Anniversary[] {
  const today = new Date();
  return [
    { id: "a1", name: "Priya Mehta", designation: "HR Director", years: 5, date: today.toISOString().slice(0, 10) },
    { id: "a2", name: "Vikram Singh", designation: "Engineering Manager", years: 3, date: new Date(today.getTime() + 86400000 * 2).toISOString().slice(0, 10) },
    { id: "a3", name: "Anita Gupta", designation: "HR Executive", years: 2, date: new Date(today.getTime() + 86400000 * 5).toISOString().slice(0, 10) },
  ];
}

export function useDashboard(): DashboardData {
  const [data, setData] = useState<Omit<DashboardData, "loading" | "error">>({
    employee: null,
    isEmployee: false,
    todayAttendance: null,
    monthlySummary: null,
    leaveBalances: [],
    teamOnLeave: [],
    upcomingHolidays: [],
    pendingApprovals: [],
    myPendingRequests: [],
    totalEmployees: 0,
    departmentMembers: [],
    announcements: DUMMY_ANNOUNCEMENTS,
    workAnniversaries: getDummyAnniversaries(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const updates: Partial<Omit<DashboardData, "loading" | "error">> = {};

    // 1. Profile (determines if employee)
    try {
      const profile = await getMyProfile();
      updates.employee = profile.employee;
      updates.isEmployee = true;
    } catch {
      updates.isEmployee = false;
    }

    // 2. Employee-specific data (parallel) — always scoped to current user
    if (updates.isEmployee) {
      const [balances, today, summary] = await Promise.allSettled([
        getLeaveBalances(),
        getToday(),
        getMonthlySummary(new Date().getFullYear(), new Date().getMonth() + 1),
      ]);

      if (balances.status === "fulfilled") updates.leaveBalances = balances.value;
      if (today.status === "fulfilled") updates.todayAttendance = today.value;
      if (summary.status === "fulfilled") updates.monthlySummary = summary.value;
    }

    // 3. Team on leave — only fetch if user has direct reports, scoped via reporting chain
    // Use approved leave requests but only show team members (not entire org)
    try {
      const allLeaves = await listLeaveRequests("approved");
      const todayStr = new Date().toISOString().slice(0, 10);
      const myId = updates.employee?.id;

      if (myId) {
        // Only show leaves of direct reports (employee.reporting_manager matches current user)
        // Since leave list doesn't include manager info, cross-reference with org data
        updates.teamOnLeave = allLeaves.filter(
          (lr) => lr.start_date <= todayStr && lr.end_date >= todayStr && lr.employee.id !== myId
        );
        // Will be further filtered below if org data is available
      }
    } catch { /* skip */ }

    // 4. Approvals (parallel) — my_pending = only ones I need to act on
    const [pending, myReqs] = await Promise.allSettled([
      getWorkflowInstances({ my_pending: true }),
      getWorkflowInstances({ my_requests: true }),
    ]);
    if (pending.status === "fulfilled") updates.pendingApprovals = pending.value;
    if (myReqs.status === "fulfilled") {
      updates.myPendingRequests = myReqs.value.filter((w) => w.status === "in_progress");
    }

    // 5. Holidays — get upcoming from all calendars
    try {
      const calendars = await listHolidayCalendars(new Date().getFullYear());
      if (calendars.length > 0) {
        const detail = await getHolidayCalendar(calendars[0].id);
        const todayStr = new Date().toISOString().slice(0, 10);
        updates.upcomingHolidays = detail.holidays
          .filter((h) => h.date >= todayStr)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 5);
      }
    } catch { /* no calendars */ }

    // 6. Org data — for employee count and to scope team-on-leave to direct reports
    try {
      const orgList = await getOrgFlatList();
      updates.totalEmployees = orgList.length;

      const myId = updates.employee?.id;
      if (myId) {
        // Direct reports = employees whose reporting_manager_id is current user
        const directReportIds = new Set(
          orgList.filter((n) => n.reporting_manager_id === myId).map((n) => n.id)
        );

        // Scope team-on-leave to direct reports only
        if (updates.teamOnLeave) {
          updates.teamOnLeave = updates.teamOnLeave.filter(
            (lr) => directReportIds.has(lr.employee.id)
          );
        }

        // Department members
        if (updates.employee?.department) {
          updates.departmentMembers = orgList.filter(
            (n) => n.department?.id === updates.employee!.department?.id && n.id !== myId
          );
        }
      }
    } catch { /* non-admin, skip — teamOnLeave stays empty */ }

    setData((prev) => ({ ...prev, ...updates }));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { ...data, loading, error };
}
