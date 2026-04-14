"use client";

import { useState, useCallback } from "react";
import { Button, Input, Alert } from "@/components/ui";
import type { ShiftFormData, Shift, WeekDay } from "@/types";

interface ShiftFormProps {
  initial?: Shift | null;
  onSubmit: (data: ShiftFormData) => Promise<boolean>;
  onCancel: () => void;
  formError: string;
  fieldErrors: Record<string, string[]>;
}

const ALL_DAYS: { value: WeekDay; label: string }[] = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

const EMPTY_FORM: ShiftFormData = {
  name: "",
  code: "",
  start_time: "09:00",
  end_time: "18:00",
  grace_minutes: 15,
  full_day_hours: 8,
  half_day_hours: 4,
  weekly_offs: ["saturday", "sunday"],
  is_default: false,
  is_active: true,
};

function fromShift(s: Shift): ShiftFormData {
  return {
    name: s.name,
    code: s.code,
    start_time: s.start_time,
    end_time: s.end_time,
    grace_minutes: s.grace_minutes,
    full_day_hours: parseFloat(s.full_day_hours),
    half_day_hours: parseFloat(s.half_day_hours),
    weekly_offs: [...s.weekly_offs],
    is_default: s.is_default,
    is_active: s.is_active,
  };
}

export function ShiftForm({ initial, onSubmit, onCancel, formError, fieldErrors }: ShiftFormProps) {
  const [form, setForm] = useState<ShiftFormData>(initial ? fromShift(initial) : EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  }, []);

  const toggleDay = useCallback((day: WeekDay) => {
    setForm((prev) => ({
      ...prev,
      weekly_offs: prev.weekly_offs.includes(day)
        ? prev.weekly_offs.filter((d) => d !== day)
        : [...prev.weekly_offs, day],
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Shift Name" name="name" value={form.name} onChange={handleChange} required error={fieldError("name")} />
        <Input label="Code" name="code" value={form.code} onChange={handleChange} required placeholder="e.g. GEN" error={fieldError("code")} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Input label="Start Time" name="start_time" type="time" value={form.start_time} onChange={handleChange} required error={fieldError("start_time")} />
        <Input label="End Time" name="end_time" type="time" value={form.end_time} onChange={handleChange} required error={fieldError("end_time")} />
        <Input label="Full Day (hrs)" name="full_day_hours" type="number" value={String(form.full_day_hours)} onChange={handleChange} required min={1} step={0.5} error={fieldError("full_day_hours")} />
        <Input label="Half Day (hrs)" name="half_day_hours" type="number" value={String(form.half_day_hours)} onChange={handleChange} required min={1} step={0.5} error={fieldError("half_day_hours")} />
      </div>

      <Input label="Grace Minutes" name="grace_minutes" type="number" value={String(form.grace_minutes)} onChange={handleChange} min={0} error={fieldError("grace_minutes")} />

      {/* Weekly offs */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-text-primary">Weekly Offs</label>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map((day) => {
            const selected = form.weekly_offs.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  selected
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-surface text-text-secondary border-border hover:border-primary-300"
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
        {fieldError("weekly_offs") && <p className="text-sm text-danger">{fieldError("weekly_offs")}</p>}
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <input type="checkbox" name="is_default" checked={form.is_default} onChange={handleChange} className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500" />
          Default shift
        </label>
        <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500" />
          Active
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={submitting}>
          {initial ? "Update Shift" : "Add Shift"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
