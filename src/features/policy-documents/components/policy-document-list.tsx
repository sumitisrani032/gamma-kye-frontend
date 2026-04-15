"use client";

import { useState, useRef } from "react";
import { Button, Card, CardContent, CardHeader, Input, Select, Alert } from "@/components/ui";
import { usePolicyDocuments } from "../hooks/use-policy-documents";
import type { PolicyDocumentFormData, PolicyCategory } from "@/types";

const CATEGORIES: { value: PolicyCategory; label: string }[] = [
  { value: "hr_policy", label: "HR Policy" }, { value: "code_of_conduct", label: "Code of Conduct" },
  { value: "compliance", label: "Compliance" }, { value: "safety", label: "Safety" },
  { value: "travel", label: "Travel" }, { value: "benefits", label: "Benefits" },
  { value: "other", label: "Other" },
];

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-surface-tertiary text-text-muted",
};

const CAT_STYLES: Record<string, string> = {
  hr_policy: "bg-blue-100 text-blue-700", code_of_conduct: "bg-purple-100 text-purple-700",
  compliance: "bg-red-100 text-red-700", safety: "bg-orange-100 text-orange-700",
  travel: "bg-teal-100 text-teal-700", benefits: "bg-green-100 text-green-700",
  other: "bg-surface-tertiary text-text-muted",
};

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500" />
      {label}
    </label>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

export function PolicyDocumentList() {
  const {
    policies, selectedPolicy, ackReport, loading, error, formError,
    select, clearSelection, add, edit, publish, archive, remove, loadReport, remind,
  } = usePolicyDocuments();
  const [showCreate, setShowCreate] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<PolicyDocumentFormData>({ title: "", category: "hr_policy", acknowledgement_required: true, applicable_to: "all" });
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof PolicyDocumentFormData, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !form.title) return;
    setSubmitting(true);
    const ok = await add(file, form);
    setSubmitting(false);
    if (ok) { setShowCreate(false); setFile(null); setForm({ title: "", category: "hr_policy", acknowledgement_required: true, applicable_to: "all" }); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  // Detail view
  if (selectedPolicy) {
    const p = selectedPolicy;
    return (
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <button onClick={clearSelection} className="text-sm text-text-secondary hover:text-primary-600">&larr; Back to Policies</button>

        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-text-primary">{p.title}</h2>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${CAT_STYLES[p.category] || CAT_STYLES.other}`}>{p.category.replace("_", " ")}</span>
                </div>
                <p className="text-sm text-text-secondary mt-1">{p.description || "No description"}</p>
                <p className="text-xs text-text-muted mt-1">Version {p.version_number} · Effective {formatDate(p.effective_date)} · File: {p.attachment.file_name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.status === "draft" && <Button size="sm" onClick={() => publish(p.id)}>Publish</Button>}
                {p.status === "published" && <Button size="sm" variant="secondary" onClick={() => archive(p.id)}>Archive</Button>}
                {p.status === "draft" && <Button size="sm" variant="ghost" className="text-danger" onClick={() => { if (confirm("Delete this draft?")) remove(p.id); }}>Delete</Button>}
              </div>
            </div>

            {/* Acknowledgement Stats */}
            {p.acknowledgement_required && p.acknowledgement_stats && p.status !== "draft" && (
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-text-primary">Acknowledgements</h3>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => loadReport(p.id)}>View Report</Button>
                    {p.acknowledgement_stats.pending > 0 && (
                      <Button size="sm" variant="secondary" onClick={() => remind(p.id)}>Send Reminders ({p.acknowledgement_stats.pending})</Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-text-muted">Total: <strong className="text-text-primary">{p.acknowledgement_stats.total}</strong></span>
                  <span className="text-green-600">Acknowledged: <strong>{p.acknowledgement_stats.acknowledged}</strong></span>
                  <span className="text-yellow-600">Pending: <strong>{p.acknowledgement_stats.pending}</strong></span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-2 rounded-full bg-surface-tertiary overflow-hidden">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${p.acknowledgement_stats.total > 0 ? (p.acknowledgement_stats.acknowledged / p.acknowledgement_stats.total) * 100 : 0}%` }} />
                </div>
              </div>
            )}

            {/* Ack Report */}
            {ackReport && (
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Acknowledgement Report</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-3 py-2 font-semibold text-text-muted">Employee</th>
                        <th className="px-3 py-2 font-semibold text-text-muted">Department</th>
                        <th className="px-3 py-2 font-semibold text-text-muted">Designation</th>
                        <th className="px-3 py-2 font-semibold text-text-muted">Status</th>
                        <th className="px-3 py-2 font-semibold text-text-muted">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ackReport.acknowledged.map((e) => (
                        <tr key={e.employee_id}>
                          <td className="px-3 py-2 text-text-primary">{e.employee_name}</td>
                          <td className="px-3 py-2 text-text-secondary">{e.department}</td>
                          <td className="px-3 py-2 text-text-secondary">{e.designation}</td>
                          <td className="px-3 py-2"><span className="text-green-600">Acknowledged</span></td>
                          <td className="px-3 py-2 text-text-muted">{e.acknowledged_at ? formatDate(e.acknowledged_at) : "—"}</td>
                        </tr>
                      ))}
                      {ackReport.pending.map((e) => (
                        <tr key={e.employee_id}>
                          <td className="px-3 py-2 text-text-primary">{e.employee_name}</td>
                          <td className="px-3 py-2 text-text-secondary">{e.department}</td>
                          <td className="px-3 py-2 text-text-secondary">{e.designation}</td>
                          <td className="px-3 py-2"><span className="text-yellow-600">Pending</span></td>
                          <td className="px-3 py-2 text-text-muted">—</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {formError && <Alert variant="error">{formError}</Alert>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{policies.length} polic{policies.length !== 1 ? "ies" : "y"}</p>
        {!showCreate && <Button onClick={() => setShowCreate(true)}>Create Policy</Button>}
      </div>

      {showCreate && (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-text-primary">New Policy Document</h3></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input label="Title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
              <Input label="Description" value={form.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="Brief description" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Select label="Category" name="category" value={form.category} onChange={(e) => set("category", e.target.value)} options={CATEGORIES} />
                <Select label="Applicable To" name="applicable_to" value={form.applicable_to} onChange={(e) => set("applicable_to", e.target.value)} options={[{ value: "all", label: "All Employees" }, { value: "department", label: "Department" }, { value: "location", label: "Location" }]} />
                <Input label="Effective Date" type="date" value={form.effective_date || ""} onChange={(e) => set("effective_date", e.target.value)} />
              </div>
              <Toggle label="Acknowledgement Required" checked={form.acknowledgement_required} onChange={(v) => set("acknowledgement_required", v)} />
              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>{file ? file.name : "Choose File"}</Button>
                <input ref={inputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={submitting} disabled={!file}>Create Draft</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); setFile(null); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {policies.length === 0 && !showCreate ? (
        <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">No policy documents yet.</div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {policies.map((p) => (
            <button key={p.id} type="button" onClick={() => select(p.id)} className="w-full text-left flex items-center justify-between px-4 py-3 hover:bg-surface-secondary transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">{p.title}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${CAT_STYLES[p.category] || CAT_STYLES.other}`}>{p.category.replace("_", " ")}</span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">v{p.version_number} · {formatDate(p.published_at || p.created_at)}</p>
              </div>
              {p.acknowledgement_stats && p.status === "published" && (
                <span className="text-xs text-text-muted shrink-0">{p.acknowledgement_stats.acknowledged}/{p.acknowledgement_stats.total}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
