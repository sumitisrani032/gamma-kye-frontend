"use client";

import { useState, useEffect, useCallback } from "react";
import { createRole, getRoleRankGuide, getRoleTemplates } from "@/services/role-service";
import { getGroupedPermissions } from "@/services/permission-service";
import type { PermissionDetail, RankTier, RoleTemplate, ApiError } from "@/types";

interface UseCreateRoleReturn {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  rank: number;
  setRank: (n: number) => void;
  allPermissions: Record<string, PermissionDetail[]>;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  rankGuide: RankTier[];
  templates: RoleTemplate[];
  applyTemplate: (id: string) => void;
  loading: boolean;
  saving: boolean;
  error: string;
  fieldErrors: Record<string, string[]>;
  handleSubmit: () => Promise<boolean>;
}

export function useCreateRole(): UseCreateRoleReturn {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rank, setRank] = useState(50);
  const [allPermissions, setAllPermissions] = useState<
    Record<string, PermissionDetail[]>
  >({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rankGuide, setRankGuide] = useState<RankTier[]>([]);
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    (async () => {
      try {
        const [perms, guide, tpls] = await Promise.all([
          getGroupedPermissions(),
          getRoleRankGuide().catch(() => []),
          getRoleTemplates().catch(() => []),
        ]);
        setAllPermissions(perms);
        setRankGuide(guide);
        setTemplates(tpls);
      } catch {
        setError("Failed to load permissions.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const applyTemplate = useCallback(
    (id: string) => {
      const tpl = templates.find((t) => t.id === id);
      if (!tpl) return;
      setName(tpl.name);
      setDescription(tpl.description);
      setRank(tpl.rank);
      setSelectedIds(new Set(tpl.permission_ids));
    },
    [templates]
  );

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      await createRole({
        role: { name, description, rank },
        permission_ids: [...selectedIds],
      });
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) {
        setFieldErrors(apiError.errors);
      } else {
        setError(apiError.error || "Failed to create role.");
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [name, description, rank, selectedIds]);

  return {
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
  };
}
