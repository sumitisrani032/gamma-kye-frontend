"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Input, Select, Alert } from "@/components/ui";
import { listLeaveTypes } from "@/services/leave-type-service";
import type { LeavePolicyFormData, LeavePolicyDetail, LeaveTypeSummary } from "@/types";

interface LeavePolicyFormProps {
  initial?: LeavePolicyDetail | null;
  onSubmit: (data: LeavePolicyFormData) => Promise<boolean>;
  onCancel: () => void;
  formError: string;
  fieldErrors: Record<string, string[]>;
}

const ACCRUAL_OPTIONS = [
  { value: "annual", label: "Annual" },
  { value: "monthly", label: "Monthly" },
  { value: "none", label: "None" },
];

const APPLICABLE_OPTIONS = [
  { value: "all", label: "All Employees" },
  { value: "department", label: "Department" },
  { value: "designation", label: "Designation" },
  { value: "grade", label: "Grade" },
  { value: "location", label: "Location" },
];

const EMPTY_FORM: LeavePolicyFormData = {
  name: "",
  leave_type_id: "",
  accrual_type: "annual",
  annual_quota: 12,
  applicable_to: "all",
  effective_from: new Date().getFullYear() + "-01-01",
  prorate_on_joining: true,
  requires_approval: true,
  advance_days_required: 0,
};

function fromDetail(p: LeavePolicyDetail): LeavePolicyFormData {
  return {
    name: p.name,
    leave_type_id: p.leave_type_id,
    accrual_type: p.accrual_type,
    annual_quota: parseFloat(p.annual_quota) || 0,
    applicable_to: p.applicable_to,
    effective_from: p.effective_from,
    effective_to: p.effective_to,
    prorate_on_joining: p.prorate_on_joining,
    prorate_on_exit: p.prorate_on_exit,
    requires_approval: p.requires_approval,
    advance_days_required: p.advance_days_required,
    min_days_per_request: p.min_days_per_request,
    max_days_per_request: p.max_days_per_request,
  };
}

export function LeavePolicyForm({ initial, onSubmit, onCancel, formError, fieldErrors }: LeavePolicyFormProps) {
  const [form, setForm] = useState<LeavePolicyFormData>(initial ? fromDetail(initial) : EMPTY_FORM);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listLeaveTypes(true).then(setLeaveTypes).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.leave_type_id && leaveTypes.length > 0) {
      setForm((prev) => ({ ...prev, leave_type_id: leaveTypes[0].id }));
    }
  }, [leaveTypes, form.leave_type_id]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const input = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: input.type === "checkbox" ? input.checked : input.type === "number" ? Number(value) : value,
    }));
  }, []);

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await onSubmit(form);
    setSubmitting(false);
    if (ok) onCancel();
  };

  const leaveTypeOptions = leaveTypes.map((lt) => ({ value: lt.id, label: `${lt.name} (${lt.code})` }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && <Alert variant="error">{formError}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Policy Name" name="name" value={form.name} onChange={handleChange} required error={fieldError("name")} />
        {leaveTypeOptions.length > 0 && (
          <Select label="Leave Type" name="leave_type_id" value={form.leave_type_id} onChange={handleChange} options={leaveTypeOptions} required error={fieldError("leave_type_id")} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select label="Accrual Type" name="accrual_type" value={form.accrual_type} onChange={handleChange} options={ACCRUAL_OPTIONS} error={fieldError("accrual_type")} />
        <Input label="Annual Quota (days)" name="annual_quota" type="number" value={String(form.annual_quota)} onChange={handleChange} required min={0} step={0.5} error={fieldError("annual_quota")} />
        <Select label="Applicable To" name="applicable_to" value={form.applicable_to} onChange={handleChange} options={APPLICABLE_OPTIONS} error={fieldError("applicable_to")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Effective From" name="effective_from" type="date" value={form.effective_from} onChange={handleChange} required error={fieldError("effective_from")} />
        <Input label="Advance Days Required" name="advance_days_required" type="number" value={String(form.advance_days_required ?? 0)} onChange={handleChange} min={0} error={fieldError("advance_days_required")} />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <input type="checkbox" name="prorate_on_joining" checked={form.prorate_on_joining ?? false} onChange={handleChange} className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500" />
          Prorate on joining
        </label>
        <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <input type="checkbox" name="requires_approval" checked={form.requires_approval ?? true} onChange={handleChange} className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500" />
          Requires approval
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={submitting}>
          {initial ? "Update Policy" : "Add Policy"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
