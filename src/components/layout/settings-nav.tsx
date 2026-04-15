"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface SettingsNavItem {
  name: string;
  href: string;
  group: string;
  /** Permission check: [resource, action, minScope?] */
  permission?: [string, string, string?];
}

const SETTINGS_ITEMS: SettingsNavItem[] = [
  // General — Admin only
  { name: "General", href: "/settings", group: "General", permission: ["tenant_settings", "read"] },

  // Organization — Admin, HR Dir (global company:read)
  { name: "Companies", href: "/settings/companies", group: "Organization", permission: ["company", "read", "global"] },
  { name: "Departments", href: "/settings/departments", group: "Organization", permission: ["company", "read", "global"] },
  { name: "Designations", href: "/settings/designations", group: "Organization", permission: ["company", "read", "global"] },
  { name: "Locations", href: "/settings/locations", group: "Organization", permission: ["company", "read", "global"] },
  { name: "Grades", href: "/settings/grades", group: "Organization", permission: ["company", "read", "global"] },
  { name: "Business Units", href: "/settings/business-units", group: "Organization", permission: ["company", "read", "global"] },

  // Attendance — Admin, HR Dir, HR Mgr, Dept Mgr (shift:read)
  { name: "Shifts", href: "/settings/shifts", group: "Attendance", permission: ["shift", "read"] },
  { name: "Overtime Rules", href: "/settings/overtime-rules", group: "Attendance", permission: ["overtime_rule", "read"] },

  // Leave — Admin, HR Dir, HR Mgr (leave_type:read)
  { name: "Leave Types", href: "/settings/leave-types", group: "Leave", permission: ["leave_type", "read"] },
  { name: "Leave Policies", href: "/settings/leave-policies", group: "Leave", permission: ["leave_policy", "read"] },
  { name: "Holiday Calendars", href: "/settings/holiday-calendars", group: "Leave", permission: ["holiday_calendar", "read"] },

  // Documents
  { name: "Policy Documents", href: "/settings/policy-documents", group: "Documents", permission: ["policy_document", "read", "global"] },
  { name: "Doc Requirements", href: "/settings/document-requirements", group: "Documents", permission: ["document_requirement", "read", "global"] },
  { name: "Doc Verifications", href: "/settings/document-verifications", group: "Documents", permission: ["employee_document", "verify"] },

  // Access Control
  { name: "Roles", href: "/settings/roles", group: "Access Control", permission: ["role", "read", "global"] },
  { name: "Workflows", href: "/settings/workflows", group: "Access Control", permission: ["workflow", "read"] },

  // System
  { name: "Audit Logs", href: "/settings/audit-logs", group: "System", permission: ["audit_log", "read", "global"] },
];

export function SettingsNav() {
  const pathname = usePathname();
  const { can, canWithScope } = useAuth();

  // Filter items by permission
  const visible = SETTINGS_ITEMS.filter((item) => {
    if (!item.permission) return true;
    const [resource, action, minScope] = item.permission;
    return minScope ? canWithScope(resource, action, minScope) : can(resource, action);
  });

  // Group visible items
  const groups: Record<string, SettingsNavItem[]> = {};
  for (const item of visible) {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  }

  return (
    <nav className="w-52 shrink-0 border-r border-border py-4 overflow-y-auto">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group} className="mb-4">
          <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {group}
          </p>
          {items.map((item) => {
            const isActive =
              item.href === "/settings"
                ? pathname === "/settings"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "text-primary-700 bg-primary-50 font-medium"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-tertiary"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
