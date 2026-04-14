"use client";

import { Card, CardContent, Alert } from "@/components/ui";
import { usePolicySuggestions } from "../../hooks/use-policy-suggestions";

export function PolicyStep() {
  const { leavePolicies, defaultShift, loading } = usePolicySuggestions();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Policy Assignment</h3>
        <p className="text-sm text-text-secondary mt-1">
          The following policies will be automatically applied when the employee is created.
          Overrides can be made from the employee detail page after onboarding.
        </p>
      </div>

      {/* Leave Policies */}
      <Card>
        <CardContent className="space-y-3">
          <h4 className="text-sm font-semibold text-text-primary">Leave Policies</h4>
          {leavePolicies.length > 0 ? (
            <div className="divide-y divide-border">
              {leavePolicies.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-text-primary">{p.name}</span>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span>{p.accrual_type}</span>
                    <span>{p.annual_quota} days/yr</span>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      Auto
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert variant="warning">No active leave policies found. Configure them in Settings first.</Alert>
          )}
        </CardContent>
      </Card>

      {/* Work Shift */}
      <Card>
        <CardContent className="space-y-3">
          <h4 className="text-sm font-semibold text-text-primary">Work Shift</h4>
          {defaultShift ? (
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-text-primary">{defaultShift.name} ({defaultShift.code})</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {defaultShift.start_time} – {defaultShift.end_time} &middot;
                  {defaultShift.full_day_hours}h/day &middot;
                  Off: {defaultShift.weekly_offs.map((d) => d.slice(0, 3)).join(", ")}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                Default
              </span>
            </div>
          ) : (
            <Alert variant="warning">No default shift configured. Configure one in Settings first.</Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
