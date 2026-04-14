"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, Input, Select, Alert } from "@/components/ui";
import { Can } from "@/components/common/can";
import { useAuth } from "@/contexts/auth-context";
import { useEmployeeDetail } from "../hooks/use-employee-detail";
import { listDesignations } from "@/services/designation-service";
import { listGrades } from "@/services/grade-service";
import { listDepartments } from "@/services/department-service";
import { listLocations } from "@/services/location-service";
import { listEmployees } from "@/services/employee-service";
import { listShifts } from "@/services/shift-service";
import { listShiftAssignments, createShiftAssignment, deleteShiftAssignment } from "@/services/shift-assignment-service";
import type {
  EmployeeDetail, Designation, Grade, DepartmentSummary,
  LocationSummary, EmployeeListItem, Shift, ShiftAssignment,
} from "@/types";

interface EmployeeDetailViewProps {
  employeeId: string;
}

/* ─── Info Section ─── */

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-1.5">
      <dt className="text-text-secondary text-sm">{label}</dt>
      <dd className="text-text-primary text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    on_notice: "bg-yellow-100 text-yellow-700",
    exited: "bg-red-100 text-red-700",
    absconding: "bg-red-100 text-red-700",
    inactive: "bg-surface-tertiary text-text-muted",
    locked: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] || "bg-surface-tertiary text-text-muted"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

/** Public info — visible to anyone who can view the employee */
function EmployeePublicInfo({ emp }: { emp: EmployeeDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-text-primary">Contact</h3></CardHeader>
        <CardContent>
          <dl>
            <InfoRow label="Employee #" value={emp.employee_number} />
            <InfoRow label="Official Email" value={emp.email_official} />
            <InfoRow label="Phone" value={emp.phone} />
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-text-primary">Organization</h3></CardHeader>
        <CardContent>
          <dl>
            <InfoRow label="Designation" value={emp.designation?.name} />
            <InfoRow label="Department" value={emp.department?.name} />
            <InfoRow label="Location" value={emp.location?.name} />
            <InfoRow label="Manager" value={emp.reporting_manager ? emp.reporting_manager.full_name : null} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

/** Sensitive info — only visible to self or admins with at least department scope */
function EmployeePrivateInfo({ emp }: { emp: EmployeeDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-text-primary">Personal Details</h3></CardHeader>
        <CardContent>
          <dl>
            <InfoRow label="Personal Email" value={emp.email_personal} />
            <InfoRow label="Gender" value={emp.gender} />
            <InfoRow label="Date of Birth" value={emp.date_of_birth} />
            <InfoRow label="Marital Status" value={emp.marital_status} />
            <InfoRow label="Blood Group" value={emp.blood_group} />
            <InfoRow label="Nationality" value={emp.nationality} />
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-text-primary">Employment</h3></CardHeader>
        <CardContent>
          <dl>
            <InfoRow label="Status" value={emp.employment_status} />
            <InfoRow label="Type" value={emp.employment_type?.replace("_", " ")} />
            <InfoRow label="Date of Joining" value={emp.date_of_joining} />
            <InfoRow label="Confirmation Date" value={emp.date_of_confirmation} />
            <InfoRow label="Notice Period" value={`${emp.notice_period_days} days`} />
            <InfoRow label="Grade" value={emp.grade?.name} />
            <InfoRow label="Business Unit" value={emp.business_unit?.name} />
            {emp.date_of_exit && <InfoRow label="Exit Date" value={emp.date_of_exit} />}
            {emp.exit_reason && <InfoRow label="Exit Reason" value={emp.exit_reason} />}
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><h3 className="text-sm font-semibold text-text-primary">User Account</h3></CardHeader>
        <CardContent>
          <dl>
            <InfoRow label="Login Email" value={emp.user_account.email} />
            <div className="flex justify-between py-1.5">
              <dt className="text-text-secondary text-sm">Account Status</dt>
              <dd><StatusBadge status={emp.user_account.status} /></dd>
            </div>
            <InfoRow label="Roles" value={emp.user_account.roles.map((r) => r.name).join(", ")} />
            <InfoRow label="Last Login" value={emp.user_account.last_login_at ? new Date(emp.user_account.last_login_at).toLocaleDateString() : "Never"} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Edit Employee Panel ─── */

const GENDER_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const MARITAL_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

const BLOOD_OPTIONS = [
  { value: "", label: "Not specified" },
  ...["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => ({ value: b, label: b })),
];

function EditEmployeePanel({ emp, onSubmit, onCancel }: {
  emp: EmployeeDetail;
  onSubmit: (fields: Record<string, unknown>) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    phone: emp.phone || "",
    email_personal: emp.email_personal || "",
    date_of_birth: emp.date_of_birth || "",
    gender: emp.gender || "",
    marital_status: emp.marital_status || "",
    blood_group: emp.blood_group || "",
    nationality: emp.nationality || "",
    notice_period_days: emp.notice_period_days,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await onSubmit(form);
    setSaving(false);
    if (ok) onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
        <Input label="Personal Email" name="email_personal" type="email" value={form.email_personal} onChange={handleChange} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="Date of Birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />
        <Select label="Gender" name="gender" value={form.gender} onChange={handleChange} options={GENDER_OPTIONS} />
        <Select label="Marital Status" name="marital_status" value={form.marital_status} onChange={handleChange} options={MARITAL_OPTIONS} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select label="Blood Group" name="blood_group" value={form.blood_group} onChange={handleChange} options={BLOOD_OPTIONS} />
        <Input label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} />
        <Input label="Notice Period (days)" name="notice_period_days" type="number" value={String(form.notice_period_days)} onChange={handleChange} min={0} />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" size="sm" loading={saving}>Save Changes</Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

/* ─── Promote Action ─── */

function PromoteAction({ onSubmit }: { onSubmit: (data: { designation_id: string; grade_id?: string; effective_date: string; remarks?: string }) => Promise<boolean> }) {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [designationId, setDesignationId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listDesignations().then(setDesignations).catch(() => {});
    listGrades().then(setGrades).catch(() => {});
  }, []);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({ designation_id: designationId, grade_id: gradeId || undefined, effective_date: effectiveDate, remarks: remarks || undefined });
    setSaving(false);
  };

  return (
    <form onSubmit={handle} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {designations.length > 0 && (
          <Select label="New Designation" name="designation_id" value={designationId} onChange={(e) => setDesignationId(e.target.value)} options={[{ value: "", label: "Select..." }, ...designations.map((d) => ({ value: d.id, label: d.name }))]} required />
        )}
        {grades.length > 0 && (
          <Select label="New Grade (optional)" name="grade_id" value={gradeId} onChange={(e) => setGradeId(e.target.value)} options={[{ value: "", label: "No change" }, ...grades.map((g) => ({ value: g.id, label: g.name }))]} />
        )}
      </div>
      <Input label="Effective Date" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
      <Input label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      <Button type="submit" size="sm" loading={saving}>Confirm Promotion</Button>
    </form>
  );
}

/* ─── Transfer Action ─── */

function TransferAction({ onSubmit }: { onSubmit: (data: { department_id?: string; location_id?: string; effective_date: string; remarks?: string }) => Promise<boolean> }) {
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => {});
    listLocations().then(setLocations).catch(() => {});
  }, []);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({ department_id: departmentId || undefined, location_id: locationId || undefined, effective_date: effectiveDate, remarks: remarks || undefined });
    setSaving(false);
  };

  return (
    <form onSubmit={handle} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {departments.length > 0 && (
          <Select label="New Department" name="department_id" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} options={[{ value: "", label: "No change" }, ...departments.map((d) => ({ value: d.id, label: d.name }))]} />
        )}
        {locations.length > 0 && (
          <Select label="New Location" name="location_id" value={locationId} onChange={(e) => setLocationId(e.target.value)} options={[{ value: "", label: "No change" }, ...locations.map((l) => ({ value: l.id, label: l.name }))]} />
        )}
      </div>
      <Input label="Effective Date" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
      <Input label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      <Button type="submit" size="sm" loading={saving}>Confirm Transfer</Button>
    </form>
  );
}

/* ─── Change Manager Action ─── */

function ChangeManagerAction({ currentManagerId, employeeId, onSubmit }: {
  currentManagerId: string | null;
  employeeId: string;
  onSubmit: (managerId: string, effectiveDate: string) => Promise<boolean>;
}) {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [managerId, setManagerId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listEmployees({ active: true }).then((list) => {
      setEmployees(list.filter((e) => e.id !== employeeId));
    }).catch(() => {});
  }, [employeeId]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(managerId, effectiveDate);
    setSaving(false);
  };

  return (
    <form onSubmit={handle} className="space-y-3">
      {currentManagerId && (
        <p className="text-xs text-text-muted">
          Current: {employees.find((e) => e.id === currentManagerId)?.full_name || "—"}
        </p>
      )}
      <Select
        label="New Reporting Manager"
        name="manager_id"
        value={managerId}
        onChange={(e) => setManagerId(e.target.value)}
        options={[
          { value: "", label: "Select manager..." },
          ...employees.map((e) => ({ value: e.id, label: `${e.full_name} (${e.employee_number}) — ${e.designation?.name || ""}` })),
        ]}
        required
      />
      <Input label="Effective Date" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
      <Button type="submit" size="sm" loading={saving}>Confirm Change</Button>
    </form>
  );
}

/* ─── Offboard Action ─── */

function OffboardAction({ onSubmit }: { onSubmit: (data: { exit_date: string; exit_reason: string }) => Promise<boolean> }) {
  const [exitDate, setExitDate] = useState("");
  const [exitReason, setExitReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({ exit_date: exitDate, exit_reason: exitReason });
    setSaving(false);
  };

  return (
    <form onSubmit={handle} className="space-y-3">
      <Input label="Exit Date" type="date" value={exitDate} onChange={(e) => setExitDate(e.target.value)} required />
      <Input label="Exit Reason" value={exitReason} onChange={(e) => setExitReason(e.target.value)} required />
      <Button type="submit" size="sm" variant="danger" loading={saving}>Confirm Offboard</Button>
    </form>
  );
}

/* ─── Set Password Action ─── */

function SetPasswordAction({ onSubmit }: {
  onSubmit: (password: string, confirm: string) => Promise<boolean>;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (password.length < 8) { setLocalError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setLocalError("Passwords do not match"); return; }
    setSaving(true);
    const ok = await onSubmit(password, confirm);
    setSaving(false);
    if (ok) { setPassword(""); setConfirm(""); }
  };

  return (
    <form onSubmit={handle} className="space-y-3">
      {localError && <Alert variant="error">{localError}</Alert>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min. 8 characters" minLength={8} />
        <Input label="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Repeat password" />
      </div>
      <p className="text-xs text-text-muted">Share this password securely with the employee.</p>
      <Button type="submit" size="sm" loading={saving}>Set Password</Button>
    </form>
  );
}

/* ─── Role Management ─── */

function RoleManagement({ emp, onAdd, onRemove }: {
  emp: EmployeeDetail;
  onAdd: (roleId: string) => Promise<boolean>;
  onRemove: (roleId: string) => Promise<boolean>;
}) {
  const [allRoles, setAllRoles] = useState<{ id: string; name: string; is_system_role: boolean }[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    import("@/services/role-service").then(({ getRoles }) =>
      getRoles().then(setAllRoles).catch(() => {})
    );
  }, []);

  const currentRoleIds = new Set(emp.user_account.roles.map((r) => r.id));
  const availableRoles = allRoles.filter((r) => !currentRoleIds.has(r.id));

  const handleAdd = async () => {
    if (!selectedRoleId) return;
    setAdding(true);
    const ok = await onAdd(selectedRoleId);
    if (ok) setSelectedRoleId("");
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {emp.user_account.roles.map((role) => (
          <span key={role.id} className="inline-flex items-center gap-1.5 rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-text-primary">
            {role.name}
            {!role.is_system_role && (
              <button type="button" onClick={() => onRemove(role.id)} className="text-text-muted hover:text-danger transition-colors" title="Remove role">
                &times;
              </button>
            )}
          </span>
        ))}
      </div>
      <Can resource="role" action="assign">
        {availableRoles.length > 0 && (
          <div className="flex items-end gap-2">
            <Select
              label="Add Role"
              name="add_role"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              options={[{ value: "", label: "Select role..." }, ...availableRoles.map((r) => ({ value: r.id, label: r.name }))]}
            />
            <Button size="sm" onClick={handleAdd} disabled={!selectedRoleId} loading={adding}>Assign</Button>
          </div>
        )}
      </Can>
    </div>
  );
}

/* ─── Account Actions ─── */

function AccountActions({ emp, onStatusChange }: { emp: EmployeeDetail; onStatusChange: (status: string) => Promise<boolean> }) {
  const status = emp.user_account.status;
  return (
    <div className="flex items-center gap-2">
      {status === "active" && (
        <Button size="sm" variant="secondary" onClick={() => onStatusChange("inactive")}>Deactivate</Button>
      )}
      {status === "inactive" && (
        <Button size="sm" onClick={() => onStatusChange("active")}>Activate</Button>
      )}
      {status !== "locked" && (
        <Button size="sm" variant="ghost" className="text-danger" onClick={() => onStatusChange("locked")}>Lock</Button>
      )}
      {status === "locked" && (
        <Button size="sm" onClick={() => onStatusChange("active")}>Unlock</Button>
      )}
    </div>
  );
}

/* ─── Shift Assignment ─── */

function ShiftAssignmentPanel({ employeeId }: { employeeId: string }) {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [shiftId, setShiftId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [shiftError, setShiftError] = useState("");

  const loadData = useCallback(async () => {
    setLoadingShifts(true);
    try {
      const [sa, sh] = await Promise.all([
        listShiftAssignments({ employee_id: employeeId }),
        listShifts(),
      ]);
      setAssignments(sa);
      setShifts(sh.filter((s) => s.is_active));
    } catch { /* skip if not authorized */ }
    setLoadingShifts(false);
  }, [employeeId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftId) return;
    setSubmitting(true);
    setShiftError("");
    try {
      await createShiftAssignment({ employee_id: employeeId, shift_id: shiftId, effective_from: effectiveFrom });
      await loadData();
      setShowForm(false);
      setShiftId("");
    } catch (err) {
      setShiftError((err as { error?: string }).error || "Failed to assign shift.");
    }
    setSubmitting(false);
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteShiftAssignment(id);
      await loadData();
    } catch (err) {
      setShiftError((err as { error?: string }).error || "Failed to remove assignment.");
    }
  };

  const activeAssignment = assignments.find((a) => !a.effective_to || a.effective_to >= new Date().toISOString().slice(0, 10));
  const shiftOptions = [{ value: "", label: "Select shift" }, ...shifts.map((s) => ({ value: s.id, label: `${s.name} (${s.start_time} – ${s.end_time})` }))];

  if (loadingShifts) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Shift Assignment</h3>
          <Can resource="employee" action="update" minScope="department">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : activeAssignment ? "Change Shift" : "Assign Shift"}
            </Button>
          </Can>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {shiftError && <Alert variant="error">{shiftError}</Alert>}

        {activeAssignment ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">{activeAssignment.shift.name}</p>
              <p className="text-xs text-text-muted">
                {activeAssignment.shift.start_time} – {activeAssignment.shift.end_time} · {activeAssignment.shift.full_day_hours}h/day
              </p>
              <p className="text-xs text-text-muted">
                Since {new Date(activeAssignment.effective_from).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })}
                {activeAssignment.effective_to && ` until ${new Date(activeAssignment.effective_to).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })}`}
              </p>
            </div>
            <Can resource="employee" action="update" minScope="department">
              <Button size="sm" variant="ghost" className="text-danger shrink-0" onClick={() => handleRemove(activeAssignment.id)}>Remove</Button>
            </Can>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No shift assigned.</p>
        )}

        {showForm && (
          <form onSubmit={handleAssign} className="space-y-3 border-t border-border pt-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Shift" name="shift_id" value={shiftId} onChange={(e) => setShiftId(e.target.value)} options={shiftOptions} required />
              <Input label="Effective From" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
            </div>
            <Button type="submit" size="sm" loading={submitting}>Assign</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Main Component ─── */

type ActionPanel = "edit" | "promote" | "transfer" | "change_manager" | "offboard" | "set_password" | null;

export function EmployeeDetailView({ employeeId }: EmployeeDetailViewProps) {
  const {
    employee, loading, error, actionError,
    update, promote, transfer, changeReportingManager, offboard, addRole, deleteRole, setAccountStatus, setPassword,
  } = useEmployeeDetail(employeeId);
  const { user, can: canDo, canWithScope, getScope } = useAuth();
  const [activePanel, setActivePanel] = useState<ActionPanel>(null);

  // Permission tiers per backend spec
  const isSelf = employee?.user_id === String(user?.id);
  const hasGlobalUpdate = canWithScope("employee", "update", "global");
  const hasDeptUpdate = canWithScope("employee", "update", "department");

  // Edit basic fields (phone, personal email): dept+ scope, not self (unless global)
  const canEditBasic = hasGlobalUpdate || (hasDeptUpdate && !isSelf);
  // Promote/Transfer/Change Manager/Set Password/Account: global scope (HR Mgr, HR Dir, Admin)
  const canDoGlobalActions = hasGlobalUpdate;
  // Offboard: needs employee:delete permission
  const canOffboard = canDo("employee", "delete");
  // Roles: only role:assign permission (Admin only)
  const canAssignRoles = canDo("role", "assign");
  // Shift assignment: needs shift:update permission
  const canManageShift = canDo("shift", "update");
  // Private details (DOB, gender, grade, user account): self OR global scope only
  // Dept Manager should NOT see these for other employees
  const canViewPrivate = isSelf || hasGlobalUpdate;

  const togglePanel = (panel: ActionPanel) => setActivePanel((prev) => (prev === panel ? null : panel));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !employee) {
    return <Alert variant="error">{error || "Employee not found."}</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/employees" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary-600 transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Employees
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-lg font-bold text-primary-700">
            {employee.first_name[0]}{employee.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-text-primary">{employee.full_name}</h2>
              <StatusBadge status={employee.employment_status} />
            </div>
            <p className="text-sm text-text-secondary mt-0.5">
              {employee.designation?.name || "—"} &middot; {employee.department?.name || "—"} &middot; {employee.employee_number}
            </p>
          </div>
        </div>

        {/* Action buttons — tiered by permission scope */}
        {(canEditBasic || canDoGlobalActions || canOffboard) && (
          <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
            {canEditBasic && (
              <Button size="sm" onClick={() => togglePanel("edit")}>
                {activePanel === "edit" ? "Cancel Edit" : "Edit"}
              </Button>
            )}
            {employee.employment_status === "active" && (
              <>
                {canDoGlobalActions && <Button size="sm" variant="secondary" onClick={() => togglePanel("promote")}>Promote</Button>}
                {canDoGlobalActions && <Button size="sm" variant="secondary" onClick={() => togglePanel("transfer")}>Transfer</Button>}
                {canDoGlobalActions && <Button size="sm" variant="secondary" onClick={() => togglePanel("change_manager")}>Change Manager</Button>}
                {canOffboard && <Button size="sm" variant="ghost" className="text-danger" onClick={() => togglePanel("offboard")}>Offboard</Button>}
              </>
            )}
          </div>
        )}
      </div>

      {actionError && <Alert variant="error">{actionError}</Alert>}

      {/* Action Panels */}
      {activePanel === "edit" && (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-text-primary">Edit Employee Details</h3></CardHeader>
          <CardContent>
            <EditEmployeePanel
              emp={employee}
              onSubmit={async (fields) => {
                const ok = await update(fields);
                return ok;
              }}
              onCancel={() => setActivePanel(null)}
            />
          </CardContent>
        </Card>
      )}

      {activePanel === "promote" && (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-text-primary">Promote Employee</h3></CardHeader>
          <CardContent>
            <PromoteAction onSubmit={async (data) => { const ok = await promote(data); if (ok) setActivePanel(null); return ok; }} />
          </CardContent>
        </Card>
      )}

      {activePanel === "transfer" && (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-text-primary">Transfer Employee</h3></CardHeader>
          <CardContent>
            <TransferAction onSubmit={async (data) => { const ok = await transfer(data); if (ok) setActivePanel(null); return ok; }} />
          </CardContent>
        </Card>
      )}

      {activePanel === "change_manager" && (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-text-primary">Change Reporting Manager</h3></CardHeader>
          <CardContent>
            <ChangeManagerAction
              currentManagerId={employee.reporting_manager?.id || null}
              employeeId={employeeId}
              onSubmit={async (managerId, effectiveDate) => {
                const ok = await changeReportingManager(managerId, effectiveDate);
                if (ok) setActivePanel(null);
                return ok;
              }}
            />
          </CardContent>
        </Card>
      )}

      {activePanel === "offboard" && (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-text-primary">Offboard Employee</h3></CardHeader>
          <CardContent>
            <OffboardAction onSubmit={async (data) => { const ok = await offboard(data); if (ok) setActivePanel(null); return ok; }} />
          </CardContent>
        </Card>
      )}

      {activePanel === "set_password" && (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-text-primary">Set Login Password</h3></CardHeader>
          <CardContent>
            <SetPasswordAction
              onSubmit={async (pw, pwConfirm) => { const ok = await setPassword(pw, pwConfirm); if (ok) setActivePanel(null); return ok; }}
            />
          </CardContent>
        </Card>
      )}

      {/* Public Info — visible to all */}
      <EmployeePublicInfo emp={employee} />

      {/* Private Info — self or admin only */}
      {canViewPrivate && <EmployeePrivateInfo emp={employee} />}

      {/* Shift Assignment — needs shift:update (HR Dir, Admin) */}
      {canManageShift && <ShiftAssignmentPanel employeeId={employeeId} />}

      {/* Roles — only role:assign (Admin only) */}
      {canAssignRoles && (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-text-primary">Roles</h3></CardHeader>
          <CardContent>
            <RoleManagement emp={employee} onAdd={addRole} onRemove={deleteRole} />
          </CardContent>
        </Card>
      )}

      {/* Account Actions — global employee:update (HR Mgr, HR Dir, Admin) */}
      {canDoGlobalActions && (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-text-primary">Account Actions</h3></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="secondary" onClick={() => togglePanel("set_password")}>
                Set Password
              </Button>
              <AccountActions emp={employee} onStatusChange={setAccountStatus} />
            </div>
            {!employee.user_account.last_login_at && (
              <Alert variant="info">
                This employee has never logged in. Set a password and share it securely.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
