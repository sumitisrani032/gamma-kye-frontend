"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Alert } from "@/components/ui";
import { PermissionChecklist } from "@/components/common/permission-checklist";
import { useCreateRole } from "../hooks/use-create-role";
import Link from "next/link";

function tierLabelFor(rank: number, guide: { min: number; max: number; label: string }[]): string {
  const hit = guide.find((t) => rank >= t.min && rank <= t.max);
  return hit?.label || "";
}

export function CreateRoleForm() {
  const router = useRouter();
  const {
    name,
    setName,
    description,
    setDescription,
    rank,
    setRank,
    allPermissions,
    selectedIds,
    setSelectedIds,
    rankGuide,
    templates,
    applyTemplate,
    loading,
    saving,
    error,
    fieldErrors,
    handleSubmit,
  } = useCreateRole();

  const templateOptions = useMemo(
    () => [
      { value: "", label: "Start from scratch" },
      ...templates.map((t) => ({ value: t.id, label: `${t.name} (${t.tier_label})` })),
    ],
    [templates]
  );

  const tierLabel = tierLabelFor(rank, rankGuide);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await handleSubmit();
    if (ok) router.push("/settings/roles");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Link
        href="/settings/roles"
        className="text-sm text-text-secondary hover:text-text-primary"
      >
        &larr; Back to Roles
      </Link>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">
          Create Custom Role
        </h2>
        {templates.length > 0 && (
          <Select
            label="Copy from template"
            value=""
            onChange={(e) => e.target.value && applyTemplate(e.target.value)}
            options={templateOptions}
          />
        )}
        <Input
          label="Role Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Recruitment Lead"
          required
          error={fieldErrors["name"]?.[0]}
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this role is for..."
          error={fieldErrors["description"]?.[0]}
        />

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-text-primary mb-1">
            <span>Rank (seniority 0–100)</span>
            <span className="text-xs text-text-muted">
              {rank}{tierLabel ? ` · ${tierLabel}` : ""}
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={rank}
            onChange={(e) => setRank(Number(e.target.value))}
            className="w-full"
          />
          {fieldErrors["rank"]?.[0] && (
            <p className="mt-1 text-xs text-danger">{fieldErrors["rank"][0]}</p>
          )}
          {rankGuide.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-text-muted">
              {rankGuide.map((t) => (
                <span key={`${t.min}-${t.max}`} className={rank >= t.min && rank <= t.max ? "font-semibold text-text-primary" : ""}>
                  {t.min}-{t.max}: {t.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Assign Permissions
        </h3>
        <PermissionChecklist
          grouped={allPermissions}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={saving}>
          Create Role
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/settings/roles")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
