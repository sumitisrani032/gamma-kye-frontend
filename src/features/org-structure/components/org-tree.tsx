"use client";

import { memo, useCallback } from "react";
import { Button, Input, Alert } from "@/components/ui";
import { OrgNodeCard } from "./org-node-card";
import { useOrgTree } from "../hooks/use-org-tree";
import type { OrgTreeNode } from "@/types";

interface OrgTreeProps {
  currentUserId?: string | null;
  onNodeClick?: (id: string) => void;
}

/* ─── Single Tree Node (recursive, memoized) ─── */

const TreeNode = memo(function TreeNode({
  node,
  depth,
  expandedIds,
  onToggle,
  currentUserId,
  onNodeClick,
}: {
  node: OrgTreeNode;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  currentUserId?: string | null;
  onNodeClick?: (id: string) => void;
}) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isCurrentUser = node.id === currentUserId;

  return (
    <div className={depth > 0 ? "ml-6 border-l border-border pl-4" : ""}>
      <div className="flex items-center gap-2 py-1">
        {/* Expand/Collapse Toggle */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-muted hover:bg-surface-tertiary transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        <OrgNodeCard
          node={node}
          highlighted={isCurrentUser}
          size="sm"
          onClick={onNodeClick}
        />

        {hasChildren && (
          <span className="text-[10px] text-text-muted shrink-0">
            {node.children.length}
          </span>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              currentUserId={currentUserId}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
});

/* ─── Main Component ─── */

export function OrgTree({ currentUserId, onNodeClick }: OrgTreeProps) {
  const {
    tree, totalCount, loading, error,
    expandedIds, toggleExpand, expandAll, collapseAll,
    searchResults, searchQuery, setSearchQuery,
  } = useOrgTree();

  const handleSearchClick = useCallback(
    (id: string) => {
      setSearchQuery("");
      onNodeClick?.(id);
    },
    [setSearchQuery, onNodeClick]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) return <Alert variant="error">{error}</Alert>;

  if (tree.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-text-muted">
        No employees found in the organization.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48 max-w-sm">
          <Input
            placeholder="Search by name, designation, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={expandAll}>Expand All</Button>
          <Button size="sm" variant="ghost" onClick={collapseAll}>Collapse All</Button>
        </div>
        <span className="text-xs text-text-muted">{totalCount} employees</span>
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-text-muted mb-2">
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
          </p>
          {searchResults.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {searchResults.map((n) => (
                <OrgNodeCard key={n.id} node={n} size="sm" highlighted={n.id === currentUserId} onClick={handleSearchClick} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted">No matches found.</p>
          )}
        </div>
      )}

      {/* Tree */}
      {!searchQuery.trim() && (
        <div className="rounded-xl border border-border bg-surface p-4">
          {tree.map((root) => (
            <TreeNode
              key={root.id}
              node={root}
              depth={0}
              expandedIds={expandedIds}
              onToggle={toggleExpand}
              currentUserId={currentUserId}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
