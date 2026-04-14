"use client";

import { useState, useEffect } from "react";
import { getRoles } from "@/services/role-service";
import type { RoleSummary } from "@/types";
import type { OnboardWizardState } from "../../types/onboard";

interface RoleAccessStepProps {
  state: OnboardWizardState;
  updateFields: (fields: Partial<OnboardWizardState>) => void;
}

export function RoleAccessStep({ state, updateFields }: RoleAccessStepProps) {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRoles()
      .then(setRoles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // "Employee" is auto-assigned — don't show it as selectable
  const selectableRoles = roles.filter((r) => r.name !== "Employee");

  const toggleRole = (roleId: string) => {
    const current = state.roleIds;
    const next = current.includes(roleId)
      ? current.filter((id) => id !== roleId)
      : [...current, roleId];
    updateFields({ roleIds: next });
  };

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
        <h3 className="text-lg font-semibold text-text-primary">Roles & Access</h3>
        <p className="text-sm text-text-secondary mt-1">
          The <strong>Employee</strong> role is assigned automatically. Select additional roles below.
        </p>
      </div>

      {/* Auto-assigned role badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Employee (auto-assigned)
        </span>
      </div>

      {/* Selectable roles */}
      <div className="space-y-2">
        {selectableRoles.map((role) => {
          const isSelected = state.roleIds.includes(role.id);
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => toggleRole(role.id)}
              className={`
                w-full text-left rounded-xl border p-4 transition-all
                ${isSelected
                  ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                  : "border-border bg-surface hover:border-primary-300"
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{role.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{role.description}</p>
                </div>
                <div className={`
                  flex h-5 w-5 items-center justify-center rounded border-2 transition-colors
                  ${isSelected ? "border-primary-600 bg-primary-600" : "border-border"}
                `}>
                  {isSelected && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-text-muted mt-1">
                {role.permissions_count} permissions &middot; {role.users_count} users
                {role.is_system_role && " \u00b7 System role"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
