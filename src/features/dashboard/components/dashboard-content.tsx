"use client";

import Link from "next/link";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, Skeleton, SkeletonCard } from "@/components/ui";
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

/* ─── KPI Card (premium stat card) ─── */

function KpiCard({ label, value, icon, color, href }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; href?: string;
}) {
  const inner = (
    <Card className={`group ${href ? "hover:border-primary-300 cursor-pointer" : ""} transition-all`}>
      <CardContent className="py-5 px-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color.replace("text-", "bg-").replace("600", "100")} transition-colors`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ─── Today's Attendance Card ─── */

function AttendanceCard({ clockIn, clockOut, hours }: { clockIn: string | null; clockOut: string | null; hours: string | null }) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
              <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-text-primary">Today&apos;s Attendance</h3>
          </div>
          <Link href="/attendance" className="text-xs text-primary-600 hover:text-primary-700">View details</Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-surface-tertiary p-3 text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Clock In</p>
            <p className="text-lg font-bold text-text-primary mt-0.5">{formatTime(clockIn)}</p>
          </div>
          <div className="rounded-lg bg-surface-tertiary p-3 text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Clock Out</p>
            <p className="text-lg font-bold text-text-primary mt-0.5">{formatTime(clockOut)}</p>
          </div>
          <div className="rounded-lg bg-primary-50 p-3 text-center">
            <p className="text-[10px] text-primary-600 uppercase tracking-wider">Hours</p>
            <p className="text-lg font-bold text-primary-600 mt-0.5">{hours ? `${hours}h` : "—"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Leave Balance ─── */

function LeaveBalanceWidget({ balances }: { balances: LeaveBalance[] }) {
  if (balances.length === 0) return null;
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-text-primary">Leave Balances</h3>
          </div>
          <Link href="/leaves" className="text-xs text-primary-600 hover:text-primary-700">View all</Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {balances.map((b) => (
            <div key={b.id} className="rounded-lg border border-border p-3 hover:border-primary-200 transition-colors">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.leave_type.color_code || "#6b7280" }} />
                <span className="text-[11px] font-medium text-text-secondary truncate">{b.leave_type.name}</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{b.balance}</p>
              <p className="text-[10px] text-text-muted">of {b.entitled} entitled</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Monthly Summary ─── */

function MonthlySummaryWidget({ summary }: { summary: { days_present: number; days_absent: number; days_on_leave: number; late_count: number; total_hours_worked: string } }) {
  const stats = [
    { label: "Present", value: summary.days_present, color: "text-green-600", bg: "bg-green-50" },
    { label: "Absent", value: summary.days_absent, color: "text-red-600", bg: "bg-red-50" },
    { label: "On Leave", value: summary.days_on_leave, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Late", value: summary.late_count, color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-text-primary">This Month</h3>
          </div>
          <Link href="/attendance" className="text-xs text-primary-600 hover:text-primary-700">Details</Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-lg ${s.bg} p-3 text-center`}>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-center gap-2">
          <p className="text-xs text-text-muted">Total Hours Worked</p>
          <p className="text-sm font-bold text-text-primary">{summary.total_hours_worked}h</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Announcements ─── */

function AnnouncementsWidget({ announcements }: { announcements: Announcement[] }) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
            <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-text-primary">Announcements</h3>
        </div>
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-lg border border-border p-3 hover:border-primary-200 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700">{a.author}</span>
                <span className="text-[10px] text-text-muted">{timeAgo(a.timestamp)}</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{a.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Sidebar Widgets (compact) ─── */

function SidebarWidget({ title, icon, iconBg, children, viewAllHref }: {
  title: string; icon: React.ReactNode; iconBg: string; children: React.ReactNode; viewAllHref?: string;
}) {
  return (
    <Card>
      <CardContent className="py-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>{icon}</div>
            <h3 className="text-xs font-semibold text-text-primary">{title}</h3>
          </div>
          {viewAllHref && <Link href={viewAllHref} className="text-[10px] text-primary-600 hover:text-primary-700">View all</Link>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

/* ─── Upcoming Holidays (sidebar) ─── */

function HolidaysWidget({ holidays }: { holidays: Holiday[] }) {
  if (holidays.length === 0) return null;
  return (
    <SidebarWidget title="Upcoming Holidays" iconBg="bg-yellow-100" viewAllHref="/calendar" icon={
      <svg className="h-3.5 w-3.5 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    }>
      <div className="space-y-2">
        {holidays.map((h) => {
          const d = new Date(h.date + "T00:00:00");
          return (
            <div key={h.id} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 flex-col items-center justify-center rounded-lg bg-yellow-50 shrink-0">
                <span className="text-[9px] text-yellow-600 uppercase leading-none">{d.toLocaleDateString([], { weekday: "short" })}</span>
                <span className="text-xs font-bold text-yellow-700 leading-none">{d.getDate()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{h.name}</p>
                <p className="text-[10px] text-text-muted capitalize">{h.holiday_type}</p>
              </div>
            </div>
          );
        })}
      </div>
    </SidebarWidget>
  );
}

/* ─── Team on Leave (sidebar) ─── */

function TeamOnLeaveWidget({ leaves }: { leaves: LeaveRequest[] }) {
  if (leaves.length === 0) return null;
  return (
    <SidebarWidget title="On Leave Today" iconBg="bg-blue-100" icon={
      <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    }>
      <div className="space-y-2">
        {leaves.map((lr) => (
          <div key={lr.id} className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-[10px] font-semibold">
              {getInitials(lr.employee.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{lr.employee.full_name}</p>
              <p className="text-[10px] text-text-muted">{lr.leave_type.name}</p>
            </div>
          </div>
        ))}
      </div>
    </SidebarWidget>
  );
}

/* ─── Approvals (sidebar) ─── */

function ApprovalsWidget({ approvals }: { approvals: WorkflowInstance[] }) {
  if (approvals.length === 0) return null;
  return (
    <SidebarWidget title="Pending Approvals" iconBg="bg-orange-100" viewAllHref="/approvals" icon={
      <svg className="h-3.5 w-3.5 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    }>
      <div className="space-y-2">
        {approvals.slice(0, 4).map((w) => (
          <Link key={w.id} href={`/approvals/${w.id}`} className="flex items-center justify-between rounded-lg p-2 -mx-1 hover:bg-surface-tertiary transition-colors">
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-primary capitalize truncate">{w.entity_type.replace("_", " ")}</p>
              <p className="text-[10px] text-text-muted">{w.initiated_by.first_name} {w.initiated_by.last_name}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-[9px] font-medium text-yellow-700 shrink-0">Pending</span>
          </Link>
        ))}
      </div>
    </SidebarWidget>
  );
}

/* ─── Anniversaries (sidebar) ─── */

function AnniversariesWidget({ anniversaries }: { anniversaries: Anniversary[] }) {
  if (anniversaries.length === 0) return null;
  return (
    <SidebarWidget title="Work Anniversaries" iconBg="bg-pink-100" icon={
      <svg className="h-3.5 w-3.5 text-pink-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    }>
      <div className="space-y-2">
        {anniversaries.map((a) => (
          <div key={a.id} className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-600 text-[10px] font-bold">
              {a.years}y
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{a.name}</p>
              <p className="text-[10px] text-text-muted">{a.designation}</p>
            </div>
          </div>
        ))}
      </div>
    </SidebarWidget>
  );
}

/* ─── Department (sidebar) ─── */

function DepartmentWidget({ members, departmentName }: { members: OrgNode[]; departmentName: string }) {
  if (members.length === 0) return null;
  return (
    <SidebarWidget title={departmentName} iconBg="bg-surface-tertiary" viewAllHref="/org-structure" icon={
      <svg className="h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    }>
      <div className="space-y-2">
        {members.slice(0, 5).map((m) => (
          <Link key={m.id} href={`/employees/${m.id}`} className="flex items-center gap-2.5 rounded-lg p-1.5 -mx-1 hover:bg-surface-tertiary transition-colors">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-[10px] font-semibold">
              {getInitials(m.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{m.full_name}</p>
              <p className="text-[10px] text-text-muted">{m.designation?.name || "—"}</p>
            </div>
          </Link>
        ))}
      </div>
    </SidebarWidget>
  );
}

/* ─── Loading Skeleton ─── */

function DashboardSkeleton() {
  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8 space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (<SkeletonCard key={i} />))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */

export function DashboardContent() {
  const { tenant, user } = useAuth();
  const d = useDashboard();

  const greeting = getGreeting();

  return (
    <div className="flex h-screen overflow-hidden">
      <TenantSidebar />
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title={`${greeting}, ${user?.first_name || "there"}`}
          description={tenant?.name || ""}
        />

        {d.loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="px-4 py-5 sm:px-6 lg:px-8 space-y-6">

            {/* ─── KPI Strip ─── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="Total Employees"
                value={d.totalEmployees || "—"}
                color="text-primary-600"
                href="/employees"
                icon={<svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>}
              />
              <KpiCard
                label="On Leave Today"
                value={d.teamOnLeave.length}
                color="text-blue-600"
                icon={<svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>}
              />
              <KpiCard
                label="Pending Approvals"
                value={d.pendingApprovals.length}
                color="text-orange-600"
                href="/approvals"
                icon={<svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
              />
              <KpiCard
                label="My Requests"
                value={d.myPendingRequests.length}
                color="text-green-600"
                href="/approvals"
                icon={<svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>}
              />
            </div>

            {/* ─── Main Grid ─── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

              {/* ─── Left Column (2/3) ─── */}
              <div className="lg:col-span-2 space-y-5">
                {d.isEmployee && d.todayAttendance && (
                  <AttendanceCard
                    clockIn={d.todayAttendance.clock_in}
                    clockOut={d.todayAttendance.clock_out}
                    hours={d.todayAttendance.total_hours}
                  />
                )}
                {d.isEmployee && <LeaveBalanceWidget balances={d.leaveBalances} />}
                {d.isEmployee && d.monthlySummary && <MonthlySummaryWidget summary={d.monthlySummary} />}
                <AnnouncementsWidget announcements={d.announcements} />
              </div>

              {/* ─── Right Column (1/3) ─── */}
              <div className="space-y-4">
                <HolidaysWidget holidays={d.upcomingHolidays} />
                <TeamOnLeaveWidget leaves={d.teamOnLeave} />
                <ApprovalsWidget approvals={d.pendingApprovals} />
                <AnniversariesWidget anniversaries={d.workAnniversaries} />
                {d.employee?.department && (
                  <DepartmentWidget members={d.departmentMembers} departmentName={d.employee.department.name} />
                )}
              </div>
            </div>
          </div>
        )}
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
