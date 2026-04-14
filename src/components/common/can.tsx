import { can as checkPermission, canWithScope as checkScope } from "@/lib/permissions";
import type { ReactNode } from "react";

interface CanProps {
  resource: string;
  action: string;
  /** If set, requires at least this scope level (global > department > team > self) */
  minScope?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Declarative permission gate.
 *
 * <Can resource="employee" action="create">               — any scope
 * <Can resource="employee" action="update" minScope="department">  — department+ only
 */
export function Can({ resource, action, minScope, children, fallback = null }: CanProps) {
  const allowed = minScope
    ? checkScope(resource, action, minScope)
    : checkPermission(resource, action);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
