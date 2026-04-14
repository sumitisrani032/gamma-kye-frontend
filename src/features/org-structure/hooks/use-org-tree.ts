"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getOrgFlatList } from "../services/org-service";
import { buildTree, countNodes } from "../utils/build-tree";
import type { OrgNode, OrgTreeNode, ApiError } from "@/types";

interface UseOrgTreeReturn {
  tree: OrgTreeNode[];
  flatList: OrgNode[];
  totalCount: number;
  loading: boolean;
  error: string;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  searchResults: OrgTreeNode[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  refresh: () => Promise<void>;
}

export function useOrgTree(): UseOrgTreeReturn {
  const [flatList, setFlatList] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getOrgFlatList();
      setFlatList(data);
      // Auto-expand root nodes
      const roots = data.filter((n) => !n.reporting_manager_id);
      setExpandedIds(new Set(roots.map((r) => r.id)));
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || "Failed to load organization tree.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const tree = useMemo(() => buildTree(flatList), [flatList]);
  const totalCount = useMemo(() => countNodes(tree), [tree]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(flatList.map((n) => n.id)));
  }, [flatList]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return flatList
      .filter(
        (n) =>
          n.full_name.toLowerCase().includes(q) ||
          n.email_official.toLowerCase().includes(q) ||
          n.designation?.name.toLowerCase().includes(q) ||
          n.department?.name.toLowerCase().includes(q)
      )
      .map((n) => ({ ...n, children: [] }));
  }, [flatList, searchQuery]);

  return {
    tree, flatList, totalCount, loading, error,
    expandedIds, toggleExpand, expandAll, collapseAll,
    searchResults, searchQuery, setSearchQuery, refresh,
  };
}
