"use client";

import { useState, useCallback } from "react";
import { Button, Input, Select, Card, CardContent, Alert } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useHolidayCalendars } from "../hooks/use-holiday-calendars";
import type { HolidayCalendarDetail, Holiday, HolidayFormData, HolidayType } from "@/types";

interface HolidayCalendarListProps {
  onDataChange?: () => void;
}

const HOLIDAY_TYPE_OPTIONS = [
  { value: "mandatory", label: "Mandatory" },
  { value: "optional", label: "Optional" },
];

/* ─── Inline Holiday Form ─── */

function HolidayForm({ onSubmit, onCancel, initial, formError, fieldErrors }: {
  onSubmit: (data: HolidayFormData) => Promise<boolean>;
  onCancel: () => void;
  initial?: Holiday | null;
  formError: string;
  fieldErrors: Record<string, string[]>;
}) {
  const [form, setForm] = useState<HolidayFormData>({
    name: initial?.name || "",
    date: initial?.date || "",
    holiday_type: initial?.holiday_type || "mandatory",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await onSubmit(form);
    setSubmitting(false);
    if (ok) onCancel();
  };

  const fieldError = (f: string) => fieldErrors[f]?.[0];

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 py-2">
      {formError && <Alert variant="error" className="w-full">{formError}</Alert>}
      <Input label="Holiday Name" name="name" value={form.name} onChange={handleChange} required error={fieldError("name")} />
      <Input label="Date" name="date" type="date" value={form.date} onChange={handleChange} required error={fieldError("date")} />
      <Select label="Type" name="holiday_type" value={form.holiday_type} onChange={handleChange} options={HOLIDAY_TYPE_OPTIONS} error={fieldError("holiday_type")} />
      <Button type="submit" size="sm" loading={submitting}>{initial ? "Update" : "Add"}</Button>
      <Button type="button" size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
    </form>
  );
}

/* ─── Calendar Expandable Row ─── */

function CalendarRow({ cal, onDelete, onDataChange, hook, canUpdate, canDelete }: {
  cal: { id: string; name: string; year: number; holidays_count: number; is_active: boolean };
  onDelete: (id: string) => void;
  onDataChange?: () => void;
  hook: ReturnType<typeof useHolidayCalendars>;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<HolidayCalendarDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showHolForm, setShowHolForm] = useState(false);
  const [editingHol, setEditingHol] = useState<Holiday | null>(null);

  const toggle = async () => {
    if (!open && !detail) {
      setLoadingDetail(true);
      const d = await hook.fetchDetail(cal.id);
      setDetail(d);
      setLoadingDetail(false);
    }
    setOpen((prev) => !prev);
  };

  const refreshDetail = async () => {
    const d = await hook.fetchDetail(cal.id);
    setDetail(d);
    await hook.refresh();
    onDataChange?.();
  };

  const handleAddHoliday = async (data: HolidayFormData) => {
    const ok = await hook.addHol(cal.id, data);
    if (ok) await refreshDetail();
    return ok;
  };

  const handleUpdateHoliday = async (data: HolidayFormData) => {
    if (!editingHol) return false;
    const ok = await hook.updateHol(cal.id, editingHol.id, data);
    if (ok) await refreshDetail();
    return ok;
  };

  const handleDeleteHoliday = async (holId: string) => {
    const ok = await hook.removeHol(cal.id, holId);
    if (ok) await refreshDetail();
  };

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={toggle} className="flex items-center gap-2 text-left min-w-0 flex-1">
          <svg className={`h-4 w-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{cal.name}</p>
            <p className="text-xs text-text-muted">{cal.year} &middot; {cal.holidays_count} holidays</p>
          </div>
        </button>
        {canDelete && <Button size="sm" variant="ghost" className="text-danger" onClick={() => onDelete(cal.id)}>Delete</Button>}
      </div>

      {open && (
        <div className="px-4 pb-4 pl-10 space-y-2">
          {loadingDetail ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
            </div>
          ) : detail?.holidays && detail.holidays.length > 0 ? (
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {detail.holidays.map((h) => (
                <div key={h.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-text-primary font-medium truncate">{h.name}</span>
                    <span className="text-text-muted text-xs">{h.date}</span>
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${h.holiday_type === "mandatory" ? "bg-blue-50 text-blue-700" : "bg-yellow-50 text-yellow-700"}`}>
                      {h.holiday_type}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {canUpdate && <Button size="sm" variant="ghost" onClick={() => { hook.clearFormErrors(); setEditingHol(h); setShowHolForm(true); }}>Edit</Button>}
                    {canDelete && <Button size="sm" variant="ghost" className="text-danger" onClick={() => handleDeleteHoliday(h.id)}>Del</Button>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">No holidays added yet.</p>
          )}

          {showHolForm ? (
            <HolidayForm
              initial={editingHol}
              onSubmit={editingHol ? handleUpdateHoliday : handleAddHoliday}
              onCancel={() => { setShowHolForm(false); setEditingHol(null); hook.clearFormErrors(); }}
              formError={hook.formError}
              fieldErrors={hook.fieldErrors}
            />
          ) : canUpdate && (
            <Button size="sm" variant="secondary" onClick={() => { setEditingHol(null); hook.clearFormErrors(); setShowHolForm(true); }}>
              + Add Holiday
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

export function HolidayCalendarList({ onDataChange }: HolidayCalendarListProps) {
  const { can } = useAuth();
  const hook = useHolidayCalendars();
  const { calendars, loading, error, addCalendar, removeCalendar, clearFormErrors, formError, fieldErrors } = hook;
  const [showCalForm, setShowCalForm] = useState(false);
  const [calName, setCalName] = useState("");
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [submitting, setSubmitting] = useState(false);

  const handleAddCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await addCalendar({ name: calName, year: calYear });
    setSubmitting(false);
    if (ok) {
      setShowCalForm(false);
      setCalName("");
      onDataChange?.();
    }
  };

  const handleDeleteCalendar = useCallback(async (id: string) => {
    const ok = await removeCalendar(id);
    if (ok) onDataChange?.();
  }, [removeCalendar, onDataChange]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {calendars.length} {calendars.length === 1 ? "calendar" : "calendars"} configured
        </p>
        {!showCalForm && can("holiday_calendar", "create") && (
          <Button size="sm" onClick={() => { clearFormErrors(); setShowCalForm(true); }}>Add Calendar</Button>
        )}
      </div>

      {showCalForm && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-text-primary mb-3">New Calendar</h3>
            <form onSubmit={handleAddCalendar} className="flex flex-wrap items-end gap-3">
              {formError && <Alert variant="error" className="w-full">{formError}</Alert>}
              <Input label="Calendar Name" name="name" value={calName} onChange={(e) => setCalName(e.target.value)} required error={fieldErrors["name"]?.[0]} />
              <Input label="Year" name="year" type="number" value={String(calYear)} onChange={(e) => setCalYear(Number(e.target.value))} required error={fieldErrors["year"]?.[0]} />
              <Button type="submit" size="sm" loading={submitting}>Create</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setShowCalForm(false)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {calendars.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {calendars.map((cal) => (
            <CalendarRow key={cal.id} cal={cal} onDelete={handleDeleteCalendar} onDataChange={onDataChange} hook={hook} canUpdate={can("holiday_calendar", "update")} canDelete={can("holiday_calendar", "delete")} />
          ))}
        </div>
      )}
    </div>
  );
}
