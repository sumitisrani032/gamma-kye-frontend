import type { Permission } from "@/types";

const SCOPE_HIERARCHY = ["global", "department", "team", "self"] as const;

let _permissions: Permission[] = [];

export function setPermissions(permissions: Permission[]): void {
  _permissions = permissions;
}

export function getPermissions(): Permission[] {
  return _permissions;
}

export function clearPermissions(): void {
  _permissions = [];
}

/**
 * Check if the user has a permission for a resource + action.
 * `can("employee", "create")` → true/false
 */
export function can(resource: string, action: string): boolean {
  return _permissions.some(
    (p) => p.resource === resource && p.action === action
  );
}

/**
 * Check if the user has a permission with at least the required scope.
 * Scope hierarchy: global > department > team > self
 * `canWithScope("employee", "read", "department")` → true if user has global or department scope
 */
export function canWithScope(
  resource: string,
  action: string,
  requiredScope: string
): boolean {
  const requiredIndex = SCOPE_HIERARCHY.indexOf(
    requiredScope as (typeof SCOPE_HIERARCHY)[number]
  );
  if (requiredIndex === -1) return false;

  return _permissions.some((p) => {
    if (p.resource !== resource || p.action !== action) return false;
    const grantedIndex = SCOPE_HIERARCHY.indexOf(
      p.scope as (typeof SCOPE_HIERARCHY)[number]
    );
    return grantedIndex !== -1 && grantedIndex <= requiredIndex;
  });
}

/**
 * Get the highest (broadest) scope the user has for a resource + action.
 * `getScope("employee", "read")` → "global" | "department" | "team" | "self" | null
 */
export function getScope(resource: string, action: string): string | null {
  const matching = _permissions
    .filter((p) => p.resource === resource && p.action === action)
    .map((p) => p.scope);

  return SCOPE_HIERARCHY.find((s) => matching.includes(s)) ?? null;
}

/**
 * Check if the user has any permission for a resource (any action).
 * Useful for showing/hiding entire navigation sections.
 * `canAccessModule("payroll")` → true/false
 */
export function canAccessModule(resource: string): boolean {
  return _permissions.some((p) => p.resource === resource);
}
