"use client";

import { useState, useCallback } from "react";
import { Button, Input, Alert } from "@/components/ui";
import type { OvertimeRuleFormData, OvertimeRule } from "@/types";

interface OvertimeRuleFormProps {
  initial?: OvertimeRule | null;
  onSubmit: (data: OvertimeRuleFormData) => Promise<boolean>;
  onCancel: () => void;
  formError: string;
  fieldErrors: Record<string, string[]>;
}

const EMPTY_FORM: OvertimeRuleFormData = {
  name: "",
  threshold_hours: 1,
  rate_multiplier: 1.5,
  max_daily_ot_hours: null,
  max_monthly_ot_hours: null,
  applicable_on_holidays: true,
  holiday_rate_multiplier: 2.0,
  is_active: true,
};

function fromRule(r: OvertimeRule): OvertimeRuleFormData {
  return {
    name: r.name,
    threshold_hours: parseFloat(r.threshold_hours),
    rate_multiplier: parseFloat(r.rate_multiplier),
    max_daily_ot_hours: r.max_daily_ot_hours ? parseFloat(r.max_daily_ot_hours) : null,
    max_monthly_ot_hours: r.max_monthly_ot_hours ? parseFloat(r.max_monthly_ot_hours) : null,
    applicable_on_holidays: r.applicable_on_holidays,
    holiday_rate_multiplier: parseFloat(r.holiday_rate_multiplier),
    is_active: r.is_active,
  };
}

export function OvertimeRuleForm({ initial, onSubmit, onCancel, formError, fieldErrors }: OvertimeRuleFormProps) {
  const [form, setForm] = useState<OvertimeRuleFormData>(initial ? fromRule(initial) : EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? (value === "" ? null : Number(value)) : value,
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

      <Input label="Rule Name" name="name" value={form.name} onChange={handleChange} required error={fieldError("name")} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Input label="Threshold (hrs)" name="threshold_hours" type="number" value={String(form.threshold_hours)} onChange={handleChange} required min={0} step={0.5} error={fieldError("threshold_hours")} />
        <Input label="Rate Multiplier" name="rate_multiplier" type="number" value={String(form.rate_multiplier)} onChange={handleChange} required min={0.1} step={0.1} error={fieldError("rate_multiplier")} />
        <Input label="Max Daily OT (hrs)" name="max_daily_ot_hours" type="number" value={form.max_daily_ot_hours != null ? String(form.max_daily_ot_hours) : ""} onChange={handleChange} min={0} step={0.5} placeholder="No limit" error={fieldError("max_daily_ot_hours")} />
        <Input label="Max Monthly OT (hrs)" name="max_monthly_ot_hours" type="number" value={form.max_monthly_ot_hours != null ? String(form.max_monthly_ot_hours) : ""} onChange={handleChange} min={0} step={0.5} placeholder="No limit" error={fieldError("max_monthly_ot_hours")} />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <input type="checkbox" name="applicable_on_holidays" checked={form.applicable_on_holidays} onChange={handleChange} className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500" />
          Applicable on holidays
        </label>
        <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500" />
          Active
        </label>
      </div>

      {form.applicable_on_holidays && (
        <Input label="Holiday Rate Multiplier" name="holiday_rate_multiplier" type="number" value={String(form.holiday_rate_multiplier ?? 2)} onChange={handleChange} min={0.1} step={0.1} error={fieldError("holiday_rate_multiplier")} />
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={submitting}>
          {initial ? "Update Rule" : "Add Rule"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
