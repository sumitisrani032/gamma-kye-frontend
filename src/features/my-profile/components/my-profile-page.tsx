"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Card, CardContent, CardHeader, Input, Select, Alert } from "@/components/ui";
import { useMyProfile } from "../hooks/use-my-profile";
import type { EmployeeDetail, PersonalDetail, PersonalDetailFormData, LeaveBalance, AttendanceSummary } from "@/types";

type Tab = "overview" | "personal" | "leaves" | "attendance";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "personal", label: "Personal Details" },
  { key: "leaves", label: "Leave Balances" },
  { key: "attendance", label: "Attendance" },
];

/* ─── Overview Tab ─── */

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-1.5">
      <dt className="text-text-secondary text-sm">{label}</dt>
      <dd className="text-text-primary text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function OverviewTab({ emp, onEdit }: { emp: EmployeeDetail; onEdit: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Basic Info</h3>
            <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl>
            <InfoRow label="Employee #" value={emp.employee_number} />
            <InfoRow label="Email" value={emp.email_official} />
            <InfoRow label="Personal Email" value={emp.email_personal} />
            <InfoRow label="Phone" value={emp.phone} />
            <InfoRow label="Gender" value={emp.gender} />
            <InfoRow label="DOB" value={emp.date_of_birth} />
            <InfoRow label="Nationality" value={emp.nationality} />
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-text-primary">Organization</h3></CardHeader>
        <CardContent>
          <dl>
            <InfoRow label="Designation" value={emp.designation?.name} />
            <InfoRow label="Department" value={emp.department?.name} />
            <InfoRow label="Grade" value={emp.grade?.name} />
            <InfoRow label="Location" value={emp.location?.name} />
            <InfoRow label="Manager" value={emp.reporting_manager?.full_name} />
            <InfoRow label="Type" value={emp.employment_type?.replace("_", " ")} />
            <InfoRow label="Joined" value={emp.date_of_joining} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function EditProfilePanel({ emp, onSubmit, onCancel }: {
  emp: EmployeeDetail;
  onSubmit: (fields: Record<string, unknown>) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [phone, setPhone] = useState(emp.phone || "");
  const [emailPersonal, setEmailPersonal] = useState(emp.email_personal || "");
  const [saving, setSaving] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await onSubmit({ phone, email_personal: emailPersonal });
    setSaving(false);
    if (ok) onCancel();
  };

  return (
    <Card className="mb-4">
      <CardContent>
        <form onSubmit={handle} className="space-y-3">
          <p className="text-xs text-text-muted">You can update your phone and personal email. Other fields require HR approval.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Personal Email" type="email" value={emailPersonal} onChange={(e) => setEmailPersonal(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={saving}>Save</Button>
            <Button type="button" size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ─── Personal Details Tab ─── */

function PersonalTab({ detail, onUpdate }: { detail: PersonalDetail | null; onUpdate: (data: PersonalDetailFormData) => Promise<boolean> }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PersonalDetailFormData>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (detail) {
      setForm({
        current_address: detail.current_address || "",
        current_city: detail.current_city || "",
        current_state: detail.current_state || "",
        current_country: detail.current_country || "",
        current_pincode: detail.current_pincode || "",
        emergency_contact_name: detail.emergency_contact_name || "",
        emergency_contact_phone: detail.emergency_contact_phone || "",
        emergency_contact_relation: detail.emergency_contact_relation || "",
      });
    }
  }, [detail]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await onUpdate(form);
    setSaving(false);
    if (ok) setEditing(false);
  };

  if (!editing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Personal & Emergency Details</h3>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
          </div>
        </CardHeader>
        <CardContent>
          {detail ? (
            <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <InfoRow label="Address" value={detail.current_address} />
              <InfoRow label="City" value={detail.current_city} />
              <InfoRow label="State" value={detail.current_state} />
              <InfoRow label="Country" value={detail.current_country} />
              <InfoRow label="Pincode" value={detail.current_pincode} />
              <div />
              <InfoRow label="Emergency Contact" value={detail.emergency_contact_name} />
              <InfoRow label="Emergency Phone" value={detail.emergency_contact_phone} />
              <InfoRow label="Relation" value={detail.emergency_contact_relation} />
            </dl>
          ) : (
            <p className="text-sm text-text-muted">No personal details added yet. Click Edit to add.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><h3 className="text-sm font-semibold text-text-primary">Edit Personal Details</h3></CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Address" name="current_address" value={form.current_address || ""} onChange={handleChange} />
            <Input label="City" name="current_city" value={form.current_city || ""} onChange={handleChange} />
            <Input label="State" name="current_state" value={form.current_state || ""} onChange={handleChange} />
            <Input label="Country" name="current_country" value={form.current_country || ""} onChange={handleChange} />
            <Input label="Pincode" name="current_pincode" value={form.current_pincode || ""} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input label="Emergency Contact Name" name="emergency_contact_name" value={form.emergency_contact_name || ""} onChange={handleChange} />
            <Input label="Emergency Phone" name="emergency_contact_phone" value={form.emergency_contact_phone || ""} onChange={handleChange} />
            <Input label="Relation" name="emergency_contact_relation" value={form.emergency_contact_relation || ""} onChange={handleChange} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={saving}>Save</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ─── Leave Balances Tab ─── */

function LeavesTab({ balances, onLoad }: { balances: LeaveBalance[]; onLoad: () => void }) {
  useEffect(() => { onLoad(); }, [onLoad]);

  if (balances.length === 0) {
    return <p className="text-sm text-text-muted py-8 text-center">No leave balances found.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {balances.map((lb) => (
        <Card key={lb.id}>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: lb.leave_type.color_code }} />
              <h4 className="text-sm font-semibold text-text-primary">{lb.leave_type.name}</h4>
              <span className="text-xs text-text-muted font-mono">{lb.leave_type.code}</span>
            </div>
            <div className="text-center mb-3">
              <p className="text-3xl font-bold text-primary-600">{parseFloat(lb.balance)}</p>
              <p className="text-xs text-text-muted">Available</p>
            </div>
            <dl className="text-xs space-y-1">
              <div className="flex justify-between"><dt className="text-text-muted">Entitled</dt><dd className="text-text-primary">{lb.entitled}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Used</dt><dd className="text-text-primary">{lb.used}</dd></div>
              {parseFloat(lb.carry_forwarded) > 0 && <div className="flex justify-between"><dt className="text-text-muted">Carry Forward</dt><dd className="text-text-primary">{lb.carry_forwarded}</dd></div>}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─── Attendance Tab ─── */

function AttendanceTab({ summary, onLoad }: { summary: AttendanceSummary | null; onLoad: (year: number, month: number) => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  useEffect(() => { onLoad(year, month); }, [year, month, onLoad]);

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          label="Month"
          name="month"
          value={String(month)}
          onChange={(e) => setMonth(Number(e.target.value))}
          options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
        />
        <Select
          label="Year"
          name="year"
          value={String(year)}
          onChange={(e) => setYear(Number(e.target.value))}
          options={[year - 1, year, year + 1].map((y) => ({ value: String(y), label: String(y) }))}
        />
      </div>

      {summary ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { label: "Working Days", value: summary.total_working_days },
            { label: "Present", value: summary.days_present },
            { label: "Absent", value: summary.days_absent },
            { label: "On Leave", value: summary.days_on_leave },
            { label: "Half Days", value: summary.days_half_day },
            { label: "Holidays", value: summary.days_holiday },
            { label: "Weekly Off", value: summary.days_weekly_off },
            { label: "Late Arrivals", value: summary.late_count },
            { label: "Early Exits", value: summary.early_exit_count },
            { label: "Hours Worked", value: summary.total_hours_worked },
            { label: "Overtime Hours", value: summary.total_overtime_hours },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="text-center py-3">
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted py-8 text-center">No attendance data for this period.</p>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

export function MyProfilePage() {
  const {
    employee, personalDetail, leaveBalances, attendanceSummary,
    loading, error, actionError,
    updateProfile, updatePersonal, loadLeaveBalances, loadAttendance,
  } = useMyProfile();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showEdit, setShowEdit] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !employee) {
    return <Alert variant="error">{error || "Failed to load profile."}</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-xl font-bold text-primary-700">
          {employee.first_name[0]}{employee.last_name[0]}
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{employee.full_name}</h2>
          <p className="text-sm text-text-secondary">
            {employee.designation?.name || "—"} &middot; {employee.department?.name || "—"} &middot; {employee.employee_number}
          </p>
        </div>
      </div>

      {actionError && <Alert variant="error">{actionError}</Alert>}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <>
          {showEdit && (
            <EditProfilePanel emp={employee} onSubmit={updateProfile} onCancel={() => setShowEdit(false)} />
          )}
          <OverviewTab emp={employee} onEdit={() => setShowEdit(!showEdit)} />
        </>
      )}
      {activeTab === "personal" && (
        <PersonalTab detail={personalDetail} onUpdate={updatePersonal} />
      )}
      {activeTab === "leaves" && (
        <LeavesTab balances={leaveBalances} onLoad={loadLeaveBalances} />
      )}
      {activeTab === "attendance" && (
        <AttendanceTab summary={attendanceSummary} onLoad={loadAttendance} />
      )}
    </div>
  );
}
