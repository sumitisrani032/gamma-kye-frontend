"use client";

import { useState, useCallback, useEffect } from "react";
import { Button, Card, CardContent, CardHeader, Input, Select, Alert } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useWfhPolicies } from "../hooks/use-wfh-policies";
import { listDepartments } from "@/services/department-service";
import { listDesignations } from "@/services/designation-service";
import { listGrades } from "@/services/grade-service";
import { listLocations } from "@/services/location-service";
import type { WfhPolicy, WfhPolicyFormData, WeekDayName } from "@/types";

const APPLICABLE_OPTIONS = [
  { value: "all", label: "All Employees" },
  { value: "department", label: "By Department" },
  { value: "designation", label: "By Designation" },
  { value: "grade", label: "By Grade" },
  { value: "location", label: "By Location" },
];

const WEEKDAYS: WeekDayName[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const EMPTY_FORM: WfhPolicyFormData = {
  name: "", requires_approval: true, max_wfh_per_month: 8, min_days_advance: 0,
  allowed_on_probation: false, allowed_days: [], applicable_to: "all",
  applicable_ids: [], priority: 1, effective_from: new Date().toISOString().slice(0, 10),
  is_active: true,
};

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500" />
      {label}
    </label>
  );
}

function DaySelector({ selected, onChange }: { selected: WeekDayName[]; onChange: (days: WeekDayName[]) => void }) {
  const days = selected || [];
  const toggle = (day: WeekDayName) => {
    onChange(days.includes(day) ? days.filter((d) => d !== day) : [...days, day]);
  };
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-text-primary">Allowed Days</p>
      <p className="text-xs text-text-muted">Empty = any day allowed</p>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {WEEKDAYS.map((day) => (
          <button key={day} type="button" onClick={() => toggle(day)}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors capitalize ${
              days.includes(day) ? "bg-primary-600 text-white border-primary-600" : "border-border text-text-secondary hover:bg-surface-tertiary"
            }`}
          >{day.slice(0, 3)}</button>
        ))}
      </div>
    </div>
  );
}

/* ─── Applicable Entity Selector ─── */

function ApplicableSelector({ type, selected, onChange }: {
  type: string; selected: string[]; onChange: (ids: string[]) => void;
}) {
  const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const ids = selected || [];

  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      try {
        let items: { id: string; name: string }[] = [];
        if (type === "department") {
          const data = await listDepartments();
          items = data.map((d) => ({ id: d.id, name: d.name }));
        } else if (type === "designation") {
          const data = await listDesignations();
          items = data.map((d) => ({ id: d.id, name: d.name }));
        } else if (type === "grade") {
          const data = await listGrades();
          items = data.map((d) => ({ id: d.id, name: d.name }));
        } else if (type === "location") {
          const data = await listLocations();
          items = data.map((d) => ({ id: d.id, name: d.name }));
        }
        setOptions(items);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [type]);

  const toggle = (id: string) => {
    onChange(ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]);
  };

  if (loading) return <p className="text-xs text-text-muted py-2">Loading...</p>;

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-text-primary capitalize">Select {type}s</p>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
        {options.length === 0 ? (
          <p className="text-xs text-text-muted">No {type}s found</p>
        ) : options.map((opt) => (
          <label key={opt.id} className="flex items-center gap-2 text-xs text-text-primary cursor-pointer hover:bg-surface-tertiary rounded px-1 py-0.5">
            <input type="checkbox" checked={ids.includes(opt.id)} onChange={() => toggle(opt.id)} className="h-3.5 w-3.5 rounded border-border text-primary-600 focus:ring-primary-500" />
            {opt.name}
          </label>
        ))}
      </div>
      {ids.length > 0 && <p className="text-[10px] text-text-muted">{ids.length} selected</p>}
    </div>
  );
}

/* ─── Form ─── */

function WfhPolicyForm({ initial, onSubmit, onCancel }: {
  initial?: WfhPolicy; onSubmit: (data: WfhPolicyFormData) => Promise<boolean>; onCancel: () => void;
}) {
  const [form, setForm] = useState<WfhPolicyFormData>(
    initial ? {
      name: initial.name, description: initial.description || "", requires_approval: initial.requires_approval,
      max_wfh_per_month: initial.max_wfh_per_month, min_days_advance: initial.min_days_advance,
      allowed_on_probation: initial.allowed_on_probation, allowed_days: initial.allowed_days,
      applicable_to: initial.applicable_to, applicable_ids: initial.applicable_ids, priority: initial.priority,
      effective_from: initial.effective_from, effective_to: initial.effective_to, is_active: initial.is_active,
    } : EMPTY_FORM
  );
  const [submitting, setSubmitting] = useState(false);
  const set = <K extends keyof WfhPolicyFormData>(k: K, v: WfhPolicyFormData[K]) => setForm((p) => ({ ...p, [k]: v }));

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await onSubmit(form);
    setSubmitting(false);
    if (ok) onCancel();
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Policy Name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        <Input label="Description" value={form.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="Optional" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="Max WFH / Month" type="number" value={String(form.max_wfh_per_month)} onChange={(e) => set("max_wfh_per_month", Number(e.target.value))} min="0" />
        <Input label="Min Days Advance" type="number" value={String(form.min_days_advance)} onChange={(e) => set("min_days_advance", Number(e.target.value))} min="0" />
        <Input label="Priority" type="number" value={String(form.priority)} onChange={(e) => set("priority", Number(e.target.value))} min="0" hint="Higher wins when multiple match" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Applicable To" name="applicable_to" value={form.applicable_to} onChange={(e) => { set("applicable_to", e.target.value); if (e.target.value === "all") set("applicable_ids", []); }} options={APPLICABLE_OPTIONS} />
        {form.applicable_to !== "all" && (
          <ApplicableSelector type={form.applicable_to} selected={form.applicable_ids || []} onChange={(ids) => set("applicable_ids", ids)} />
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Effective From" type="date" value={form.effective_from} onChange={(e) => set("effective_from", e.target.value)} required />
        <Input label="Effective To" type="date" value={form.effective_to || ""} onChange={(e) => set("effective_to", e.target.value || null)} hint="Leave blank for no end date" />
      </div>
      <DaySelector selected={form.allowed_days} onChange={(days) => set("allowed_days", days)} />
      <div className="flex items-center gap-6">
        <Toggle label="Requires Approval" checked={form.requires_approval} onChange={(v) => set("requires_approval", v)} />
        <Toggle label="Allowed on Probation" checked={form.allowed_on_probation} onChange={(v) => set("allowed_on_probation", v)} />
        <Toggle label="Active" checked={form.is_active} onChange={(v) => set("is_active", v)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={submitting}>{initial ? "Update" : "Create"}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

/* ─── Main List ─── */

export function WfhPolicyList() {
  const { can } = useAuth();
  const { policies, loading, error, formError, add, update, remove, clearFormErrors } = useWfhPolicies();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WfhPolicy | null>(null);

  const handleAdd = useCallback(async (data: WfhPolicyFormData) => {
    const ok = await add(data);
    if (ok) setShowForm(false);
    return ok;
  }, [add]);

  const handleUpdate = useCallback(async (data: WfhPolicyFormData) => {
    if (!editing) return false;
    const ok = await update(editing.id, data);
    if (ok) setEditing(null);
    return ok;
  }, [editing, update]);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {formError && <Alert variant="error">{formError}</Alert>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{policies.length} polic{policies.length !== 1 ? "ies" : "y"}</p>
        {!showForm && !editing && can("wfh_policy", "create") && (
          <Button onClick={() => { clearFormErrors(); setShowForm(true); }}>Create Policy</Button>
        )}
      </div>

      {(showForm || editing) && (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-text-primary">{editing ? "Edit Policy" : "New WFH Policy"}</h3></CardHeader>
          <CardContent>
            <WfhPolicyForm initial={editing || undefined} onSubmit={editing ? handleUpdate : handleAdd} onCancel={() => { setShowForm(false); setEditing(null); clearFormErrors(); }} />
          </CardContent>
        </Card>
      )}

      {policies.length === 0 && !showForm ? (
        <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">No WFH policies configured yet.</div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {policies.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-surface-secondary/50 transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-text-primary">{p.name}</p>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-surface-tertiary text-text-muted capitalize">{p.applicable_to}</span>
                  {!p.is_active && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-700">Inactive</span>}
                  {p.requires_approval && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700">Approval Required</span>}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Max {p.max_wfh_per_month}/month · Priority {p.priority}
                  {p.allowed_days?.length > 0 ? ` · ${p.allowed_days.map((d) => d.slice(0, 3)).join(", ")}` : " · Any day"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {can("wfh_policy", "update") && (
                  <Button size="sm" variant="secondary" onClick={() => { clearFormErrors(); setEditing(p); setShowForm(false); }}>Edit</Button>
                )}
                {can("wfh_policy", "delete") && (
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => { if (confirm(`Delete "${p.name}"?`)) remove(p.id); }}>Delete</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
