import type { OrgNode, OrgTreeNode } from "@/types";

/**
 * Build a tree structure from a flat list of OrgNodes.
 * Handles: multiple roots, circular references (via visited set), orphans.
 */
export function buildTree(nodes: OrgNode[]): OrgTreeNode[] {
  const map = new Map<string, OrgTreeNode>();
  const roots: OrgTreeNode[] = [];
  const visited = new Set<string>();

  // Phase 1: Create tree nodes
  for (const node of nodes) {
    map.set(node.id, { ...node, children: [] });
  }

  // Phase 2: Link children to parents
  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    visited.add(node.id);

    const treeNode = map.get(node.id)!;

    if (!node.reporting_manager_id || !map.has(node.reporting_manager_id)) {
      // Root node: no manager or manager not in dataset
      roots.push(treeNode);
    } else {
      const parent = map.get(node.reporting_manager_id)!;
      parent.children.push(treeNode);
    }
  }

  // Sort children by designation level (higher level first), then by name
  const sortChildren = (node: OrgTreeNode): void => {
    node.children.sort((a, b) => {
      const levelDiff = (b.designation?.level ?? 0) - (a.designation?.level ?? 0);
      if (levelDiff !== 0) return levelDiff;
      return a.full_name.localeCompare(b.full_name);
    });
    node.children.forEach(sortChildren);
  };

  roots.sort((a, b) => {
    const levelDiff = (b.designation?.level ?? 0) - (a.designation?.level ?? 0);
    if (levelDiff !== 0) return levelDiff;
    return a.full_name.localeCompare(b.full_name);
  });
  roots.forEach(sortChildren);

  return roots;
}

/** Count total nodes in a tree (for display). */
export function countNodes(nodes: OrgTreeNode[]): number {
  let count = 0;
  const walk = (n: OrgTreeNode) => {
    count++;
    n.children.forEach(walk);
  };
  nodes.forEach(walk);
  return count;
}

/** Find a node by ID in a tree. */
export function findNode(nodes: OrgTreeNode[], id: string): OrgTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}
