"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SettingsNavItem {
  name: string;
  href: string;
  group: string;
}

const SETTINGS_ITEMS: SettingsNavItem[] = [
  // General
  { name: "General", href: "/settings", group: "General" },

  // Organization
  { name: "Companies", href: "/settings/companies", group: "Organization" },
  { name: "Departments", href: "/settings/departments", group: "Organization" },
  { name: "Designations", href: "/settings/designations", group: "Organization" },
  { name: "Locations", href: "/settings/locations", group: "Organization" },
  { name: "Grades", href: "/settings/grades", group: "Organization" },
  { name: "Business Units", href: "/settings/business-units", group: "Organization" },

  // Attendance
  { name: "Shifts", href: "/settings/shifts", group: "Attendance" },
  { name: "Overtime Rules", href: "/settings/overtime-rules", group: "Attendance" },

  // Leave
  { name: "Leave Types", href: "/settings/leave-types", group: "Leave" },
  { name: "Leave Policies", href: "/settings/leave-policies", group: "Leave" },
  { name: "Holiday Calendars", href: "/settings/holiday-calendars", group: "Leave" },

  // Access Control
  { name: "Roles", href: "/settings/roles", group: "Access Control" },
  { name: "Workflows", href: "/settings/workflows", group: "Access Control" },

  // System
  { name: "Audit Logs", href: "/settings/audit-logs", group: "System" },
];

export function SettingsNav() {
  const pathname = usePathname();

  // Group items
  const groups: Record<string, SettingsNavItem[]> = {};
  for (const item of SETTINGS_ITEMS) {
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
