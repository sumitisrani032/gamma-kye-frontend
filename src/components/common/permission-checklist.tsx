"use client";

import { useState, useMemo, useCallback } from "react";
import type { PermissionDetail } from "@/types";

const DANGEROUS_SCOPES: Record<string, boolean> = {
  "role:create:global": true,
  "role:delete:global": true,
  "user:delete:global": true,
  "tenant_settings:update:global": true,
  "audit_log:read:global": true,
};

interface PermissionChecklistProps {
  /** All available permissions grouped by resource */
  grouped: Record<string, PermissionDetail[]>;
  /** Currently selected permission IDs */
  selectedIds: Set<string>;
  /** Called with the new full set of selected IDs */
  onChange?: (ids: Set<string>) => void;
  /** Disable all checkboxes */
  readOnly?: boolean;
}

export function PermissionChecklist({
  grouped,
  selectedIds,
  onChange,
  readOnly = false,
}: PermissionChecklistProps) {
  const resources = useMemo(() => Object.keys(grouped).sort(), [grouped]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(resources));

  const toggle = useCallback(
    (id: string) => {
      if (readOnly || !onChange) return;
      const next = new Set(selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onChange(next);
    },
    [selectedIds, onChange, readOnly]
  );

  const toggleResource = useCallback(
    (resource: string) => {
      if (readOnly || !onChange) return;
      const perms = grouped[resource];
      const allSelected = perms.every((p) => selectedIds.has(p.id));
      const next = new Set(selectedIds);
      perms.forEach((p) => {
        if (allSelected) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
      });
      onChange(next);
    },
    [grouped, selectedIds, onChange, readOnly]
  );

  const toggleExpand = useCallback((resource: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(resource)) {
        next.delete(resource);
      } else {
        next.add(resource);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-2">
      {resources.map((resource) => {
        const perms = grouped[resource];
        const selectedCount = perms.filter((p) => selectedIds.has(p.id)).length;
        const allSelected = selectedCount === perms.length;
        const someSelected = selectedCount > 0 && !allSelected;
        const isExpanded = expanded.has(resource);

        return (
          <div
            key={resource}
            className="rounded-lg border border-border overflow-hidden"
          >
            {/* Resource header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-secondary">
              {!readOnly && (
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={() => toggleResource(resource)}
                  className="rounded border-border text-primary-600 focus:ring-primary-500"
                />
              )}
              <button
                type="button"
                onClick={() => toggleExpand(resource)}
                className="flex-1 flex items-center justify-between text-left"
              >
                <span className="text-sm font-semibold text-text-primary capitalize">
                  {resource.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-text-muted">
                  {selectedCount}/{perms.length}
                  {isExpanded ? " ▾" : " ▸"}
                </span>
              </button>
            </div>

            {/* Permissions list */}
            {isExpanded && (
              <div className="divide-y divide-border">
                {perms.map((perm) => {
                  const isDangerous = DANGEROUS_SCOPES[perm.key];
                  return (
                    <label
                      key={perm.id}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-surface-secondary transition-colors ${
                        readOnly ? "cursor-default" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(perm.id)}
                        onChange={() => toggle(perm.id)}
                        disabled={readOnly}
                        className="rounded border-border text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-text-primary">
                          {perm.action}
                        </span>
                        <span className="text-text-muted"> — </span>
                        <span
                          className={`${
                            isDangerous
                              ? "text-danger font-medium"
                              : "text-text-secondary"
                          }`}
                        >
                          {perm.scope}
                        </span>
                      </div>
                      <span className="text-xs text-text-muted truncate max-w-48">
                        {perm.description}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
