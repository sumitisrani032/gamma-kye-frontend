"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardContent, Alert } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useOvertimeRules } from "../hooks/use-overtime-rules";
import { OvertimeRuleForm } from "./overtime-rule-form";
import type { OvertimeRule } from "@/types";

interface OvertimeRuleListProps {
  onDataChange?: () => void;
}

export function OvertimeRuleList({ onDataChange }: OvertimeRuleListProps) {
  const { can } = useAuth();
  const { rules, loading, error, add, update, formError, fieldErrors, clearFormErrors } = useOvertimeRules();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OvertimeRule | null>(null);

  const handleAdd = useCallback(async (data: Parameters<typeof add>[0]) => {
    const ok = await add(data);
    if (ok) onDataChange?.();
    return ok;
  }, [add, onDataChange]);

  const handleUpdate = useCallback(async (data: Parameters<typeof update>[1]) => {
    if (!editing) return false;
    const ok = await update(editing.id, data);
    if (ok) onDataChange?.();
    return ok;
  }, [update, editing, onDataChange]);

  const handleEdit = useCallback((r: OvertimeRule) => {
    clearFormErrors();
    setEditing(r);
    setShowForm(true);
  }, [clearFormErrors]);

  const openNew = () => { setEditing(null); clearFormErrors(); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); clearFormErrors(); };

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
          {rules.length} overtime {rules.length === 1 ? "rule" : "rules"} configured
        </p>
        {!showForm && can("overtime_rule", "create") && <Button size="sm" onClick={openNew}>Add Rule</Button>}
      </div>

      {showForm && (
        <Card>
          <CardContent>
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              {editing ? "Edit Overtime Rule" : "New Overtime Rule"}
            </h3>
            <OvertimeRuleForm
              initial={editing}
              onSubmit={editing ? handleUpdate : handleAdd}
              onCancel={closeForm}
              formError={formError}
              fieldErrors={fieldErrors}
            />
          </CardContent>
        </Card>
      )}

      {rules.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">{r.name}</p>
                  {!r.is_active && (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Inactive</span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Threshold {r.threshold_hours}h &middot; {r.rate_multiplier}x rate
                  {r.max_daily_ot_hours && ` · Max ${r.max_daily_ot_hours}h/day`}
                  {r.max_monthly_ot_hours && ` · Max ${r.max_monthly_ot_hours}h/mo`}
                  {r.applicable_on_holidays && ` · Holidays ${r.holiday_rate_multiplier}x`}
                </p>
              </div>
              {can("overtime_rule", "update") && <Button size="sm" variant="ghost" onClick={() => handleEdit(r)}>Edit</Button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
