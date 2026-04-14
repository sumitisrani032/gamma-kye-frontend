"use client";

import Link from "next/link";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, Button } from "@/components/ui";
import { useDashboard } from "../hooks/use-dashboard";
import type { LeaveBalance, Holiday, OrgNode, WorkflowInstance, LeaveRequest } from "@/types";
import type { Announcement, Anniversary } from "../hooks/use-dashboard";

/* ─── Helpers ─── */

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString([], { day: "2-digit", month: "short" });
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ─── Clock In/Out Card ─── */

function ClockCard({ clockIn, clockOut, hours }: { clockIn: string | null; clockOut: string | null; hours: string | null }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Today&apos;s Attendance</p>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-text-muted">In</p>
            <p className="text-lg font-bold text-text-primary">{formatTime(clockIn)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Out</p>
            <p className="text-lg font-bold text-text-primary">{formatTime(clockOut)}</p>
          </div>
          {hours && (
            <div>
              <p className="text-xs text-text-muted">Hours</p>
              <p className="text-lg font-bold text-primary-600">{hours}h</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Stat Card ─── */

function StatCard({ label, value, color = "", href }: { label: string; value: string | number; color?: string; href?: string }) {
  const content = (
    <Card className={href ? "hover:border-primary-300 transition-colors" : ""}>
      <CardContent className="py-4 text-center">
        <p className={`text-3xl font-bold ${color || "text-text-primary"}`}>{value}</p>
        <p className="text-xs text-text-muted mt-1">{label}</p>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

/* ─── Leave Balance Cards ─── */

function LeaveBalanceWidget({ balances }: { balances: LeaveBalance[] }) {
  if (balances.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Leave Balances</h3>
          <Link href="/leaves" className="text-xs text-primary-600 hover:text-primary-700">View all</Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {balances.map((b) => (
            <div key={b.id} className="rounded-lg border border-border p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.leave_type.color_code || "#6b7280" }} />
                <span className="text-xs font-medium text-text-secondary truncate">{b.leave_type.name}</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{b.balance}</p>
              <p className="text-[10px] text-text-muted">of {b.entitled}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Upcoming Holidays ─── */

function HolidaysWidget({ holidays }: { holidays: Holiday[] }) {
  if (holidays.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-text-primary">Upcoming Holidays</h3>
      </CardHeader>
      <div className="divide-y divide-border">
        {holidays.map((h) => {
          const d = new Date(h.date + "T00:00:00");
          const dayName = d.toLocaleDateString([], { weekday: "short" });
          return (
            <div key={h.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex flex-col items-center w-10 shrink-0">
                <span className="text-[10px] text-text-muted uppercase">{dayName}</span>
                <span className="text-sm font-bold text-text-primary">{formatDate(h.date)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{h.name}</p>
                <p className="text-[10px] text-text-muted capitalize">{h.holiday_type}{h.is_half_day ? " · Half day" : ""}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ─── Team on Leave Today ─── */

function TeamOnLeaveWidget({ leaves }: { leaves: LeaveRequest[] }) {
  if (leaves.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-text-primary">On Leave Today</h3>
      </CardHeader>
      <div className="divide-y divide-border">
        {leaves.map((lr) => (
          <div key={lr.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
              {getInitials(lr.employee.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{lr.employee.full_name}</p>
              <p className="text-[10px] text-text-muted">{lr.leave_type.name} · {lr.number_of_days}d</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Pending Approvals ─── */

function ApprovalsWidget({ approvals }: { approvals: WorkflowInstance[] }) {
  if (approvals.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Pending Approvals</h3>
          <Link href="/approvals" className="text-xs text-primary-600 hover:text-primary-700">View all</Link>
        </div>
      </CardHeader>
      <div className="divide-y divide-border">
        {approvals.slice(0, 5).map((w) => (
          <Link key={w.id} href={`/approvals/${w.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-secondary transition-colors">
            <div className="min-w-0">
              <p className="text-sm text-text-primary capitalize truncate">{w.entity_type.replace("_", " ")}</p>
              <p className="text-[10px] text-text-muted">
                {w.initiated_by.first_name} {w.initiated_by.last_name} · Step {w.current_step_order}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
              Pending
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

/* ─── Department Members ─── */

function DepartmentWidget({ members, departmentName }: { members: OrgNode[]; departmentName: string }) {
  if (members.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">{departmentName}</h3>
          <span className="text-xs text-text-muted">{members.length} member{members.length !== 1 ? "s" : ""}</span>
        </div>
      </CardHeader>
      <div className="divide-y divide-border">
        {members.slice(0, 6).map((m) => (
          <Link key={m.id} href={`/employees/${m.id}`} className="flex items-center gap-3 px-4 py-2 hover:bg-surface-secondary transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
              {getInitials(m.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{m.full_name}</p>
              <p className="text-[10px] text-text-muted">{m.designation?.name || "—"}</p>
            </div>
          </Link>
        ))}
        {members.length > 6 && (
          <div className="px-4 py-2 text-center">
            <Link href="/org-structure" className="text-xs text-primary-600 hover:text-primary-700">
              View all {members.length} members
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ─── Announcements (Social Feed) ─── */

function AnnouncementsWidget({ announcements }: { announcements: Announcement[] }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-text-primary">Announcements</h3>
      </CardHeader>
      <div className="divide-y divide-border">
        {announcements.map((a) => (
          <div key={a.id} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                {a.author}
              </span>
              <span className="text-[10px] text-text-muted">{timeAgo(a.timestamp)}</span>
            </div>
            <p className="text-sm text-text-secondary">{a.content}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Work Anniversaries ─── */

function AnniversariesWidget({ anniversaries }: { anniversaries: Anniversary[] }) {
  if (anniversaries.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-text-primary">Work Anniversaries</h3>
      </CardHeader>
      <div className="divide-y divide-border">
        {anniversaries.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
              {a.years}y
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{a.name}</p>
              <p className="text-[10px] text-text-muted">{a.designation} · {formatDate(a.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Monthly Summary ─── */

function MonthlySummaryWidget({ summary }: { summary: { days_present: number; days_absent: number; days_on_leave: number; late_count: number; total_hours_worked: string } }) {
  const stats = [
    { label: "Present", value: summary.days_present, color: "text-green-600" },
    { label: "Absent", value: summary.days_absent, color: "text-red-600" },
    { label: "On Leave", value: summary.days_on_leave, color: "text-blue-600" },
    { label: "Late", value: summary.late_count, color: "text-yellow-600" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">This Month</h3>
          <Link href="/attendance" className="text-xs text-primary-600 hover:text-primary-700">Details</Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border text-center">
          <p className="text-xs text-text-muted">Total Hours</p>
          <p className="text-lg font-bold text-text-primary">{summary.total_hours_worked}h</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Dashboard ─── */

export function DashboardContent() {
  const { tenant, user } = useAuth();
  const d = useDashboard();

  if (d.loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <main className="flex-1 overflow-y-auto">
          <TopBar title="Dashboard" description={`Welcome to ${tenant?.name || "your workspace"}`} />
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        </main>
      </div>
    );
  }

  const greeting = getGreeting();

  return (
    <div className="flex h-screen overflow-hidden">
      <TenantSidebar />
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title={`${greeting}, ${user?.first_name || "there"}`}
          description={tenant?.name || ""}
        />

        <div className="px-8 py-6 space-y-6">
          {/* Row 1: Quick Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Employees" value={d.totalEmployees || "—"} href="/employees" />
            <StatCard label="On Leave Today" value={d.teamOnLeave.length} color="text-blue-600" />
            <StatCard label="Pending Approvals" value={d.pendingApprovals.length} color="text-yellow-600" href="/approvals" />
            <StatCard label="My Requests" value={d.myPendingRequests.length} color="text-primary-600" href="/approvals" />
          </div>

          {/* Row 2: Attendance (employee) */}
          {d.isEmployee && d.todayAttendance && (
            <ClockCard
              clockIn={d.todayAttendance.clock_in}
              clockOut={d.todayAttendance.clock_out}
              hours={d.todayAttendance.total_hours}
            />
          )}

          {/* Row 3: Main grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column — wider */}
            <div className="lg:col-span-2 space-y-6">
              {/* Leave Balances */}
              {d.isEmployee && <LeaveBalanceWidget balances={d.leaveBalances} />}

              {/* Monthly Attendance Summary */}
              {d.isEmployee && d.monthlySummary && <MonthlySummaryWidget summary={d.monthlySummary} />}

              {/* Announcements */}
              <AnnouncementsWidget announcements={d.announcements} />
            </div>

            {/* Right column — sidebar widgets */}
            <div className="space-y-6">
              {/* Upcoming Holidays */}
              <HolidaysWidget holidays={d.upcomingHolidays} />

              {/* Team on Leave */}
              <TeamOnLeaveWidget leaves={d.teamOnLeave} />

              {/* Pending Approvals */}
              <ApprovalsWidget approvals={d.pendingApprovals} />

              {/* Work Anniversaries */}
              <AnniversariesWidget anniversaries={d.workAnniversaries} />

              {/* My Department */}
              {d.employee?.department && (
                <DepartmentWidget
                  members={d.departmentMembers}
                  departmentName={d.employee.department.name}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
