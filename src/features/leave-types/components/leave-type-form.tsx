"use client";

import { useState, useCallback } from "react";
import { Button, Input, Alert } from "@/components/ui";
import type { LeaveTypeFormData, LeaveTypeDetail } from "@/types";

interface LeaveTypeFormProps {
  initial?: LeaveTypeDetail | null;
  onSubmit: (data: LeaveTypeFormData) => Promise<boolean>;
  onCancel: () => void;
  formError: string;
  fieldErrors: Record<string, string[]>;
}

const COLOR_PRESETS = ["#4299E1", "#48BB78", "#F56565", "#ECC94B", "#D53F8C", "#9F7AEA", "#ED8936", "#A0AEC0"];

const EMPTY_FORM: LeaveTypeFormData = {
  name: "",
  code: "",
  is_paid: true,
  is_carry_forward: false,
  is_encashable: false,
  is_half_day_allowed: true,
  is_active: true,
  color_code: "#4299E1",
  is_negative_balance_allowed: false,
  requires_attachment: false,
  min_days_before_application: 0,
};

function fromDetail(lt: LeaveTypeDetail): LeaveTypeFormData {
  return {
    name: lt.name,
    code: lt.code,
    is_paid: lt.is_paid,
    is_carry_forward: lt.is_carry_forward,
    is_encashable: lt.is_encashable,
    is_half_day_allowed: lt.is_half_day_allowed,
    is_active: lt.is_active,
    color_code: lt.color_code,
    description: lt.description || "",
    max_carry_forward_days: parseFloat(lt.max_carry_forward_days) || 0,
    max_encashment_days: parseFloat(lt.max_encashment_days) || 0,
    is_negative_balance_allowed: lt.is_negative_balance_allowed,
    max_negative_days: parseFloat(lt.max_negative_days) || 0,
    requires_attachment: lt.requires_attachment,
    min_days_before_application: lt.min_days_before_application,
    max_consecutive_days: lt.max_consecutive_days,
    gender_applicable: lt.gender_applicable,
  };
}

function Toggle({ label, name, checked, onChange }: { label: string; name: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500" />
      {label}
    </label>
  );
}

export function LeaveTypeForm({ initial, onSubmit, onCancel, formError, fieldErrors }: LeaveTypeFormProps) {
  const [form, setForm] = useState<LeaveTypeFormData>(initial ? fromDetail(initial) : EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && <Alert variant="error">{formError}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="Name" name="name" value={form.name} onChange={handleChange} required error={fieldError("name")} />
        <Input label="Code" name="code" value={form.code} onChange={handleChange} required placeholder="e.g. CL" error={fieldError("code")} />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-primary">Color</label>
          <div className="flex items-center gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, color_code: c }))}
                className={`h-7 w-7 rounded-full border-2 transition-all ${form.color_code === c ? "border-text-primary scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <Input label="Description" name="description" value={form.description || ""} onChange={handleChange} error={fieldError("description")} />

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Toggle label="Paid" name="is_paid" checked={form.is_paid} onChange={handleChange} />
        <Toggle label="Half day allowed" name="is_half_day_allowed" checked={form.is_half_day_allowed} onChange={handleChange} />
        <Toggle label="Carry forward" name="is_carry_forward" checked={form.is_carry_forward} onChange={handleChange} />
        <Toggle label="Encashable" name="is_encashable" checked={form.is_encashable} onChange={handleChange} />
        <Toggle label="Negative balance" name="is_negative_balance_allowed" checked={form.is_negative_balance_allowed ?? false} onChange={handleChange} />
        <Toggle label="Requires attachment" name="requires_attachment" checked={form.requires_attachment ?? false} onChange={handleChange} />
        <Toggle label="Active" name="is_active" checked={form.is_active} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {form.is_carry_forward && (
          <Input label="Max Carry Fwd Days" name="max_carry_forward_days" type="number" value={String(form.max_carry_forward_days ?? 0)} onChange={handleChange} min={0} error={fieldError("max_carry_forward_days")} />
        )}
        {form.is_encashable && (
          <Input label="Max Encash Days" name="max_encashment_days" type="number" value={String(form.max_encashment_days ?? 0)} onChange={handleChange} min={0} error={fieldError("max_encashment_days")} />
        )}
        {form.is_negative_balance_allowed && (
          <Input label="Max Negative Days" name="max_negative_days" type="number" value={String(form.max_negative_days ?? 0)} onChange={handleChange} min={0} error={fieldError("max_negative_days")} />
        )}
        <Input label="Min Days Before Apply" name="min_days_before_application" type="number" value={String(form.min_days_before_application ?? 0)} onChange={handleChange} min={0} error={fieldError("min_days_before_application")} />
        <Input label="Max Consecutive Days" name="max_consecutive_days" type="number" value={form.max_consecutive_days != null ? String(form.max_consecutive_days) : ""} onChange={handleChange} min={1} placeholder="No limit" error={fieldError("max_consecutive_days")} />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={submitting}>
          {initial ? "Update Leave Type" : "Add Leave Type"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
