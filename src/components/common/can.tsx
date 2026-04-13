import { can as checkPermission } from "@/lib/permissions";
import type { ReactNode } from "react";

interface CanProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Declarative permission gate.
 *
 * Renders `children` if the current user has the specified permission,
 * otherwise renders `fallback` (defaults to nothing).
 *
 * <Can resource="employee" action="create">
 *   <button>Add Employee</button>
 * </Can>
 *
 * <Can resource="payroll" action="process" fallback={<span>View Only</span>}>
 *   <button>Process Payroll</button>
 * </Can>
 */
export function Can({ resource, action, children, fallback = null }: CanProps) {
  return checkPermission(resource, action) ? <>{children}</> : <>{fallback}</>;
}
