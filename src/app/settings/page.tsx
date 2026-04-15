"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { TopBar } from "@/components/layout/top-bar";
import { TenantSettingsForm } from "@/features/tenant-settings/components/tenant-settings-form";

/**
 * Settings landing page.
 * - If user has tenant_settings:read → show General Settings
 * - Otherwise → redirect to the first settings sub-page they can access
 */

const FALLBACK_ROUTES: { href: string; check: (can: (r: string, a: string) => boolean, cws: (r: string, a: string, s: string) => boolean) => boolean }[] = [
  { href: "/settings/shifts", check: (can) => can("shift", "read") },
  { href: "/settings/leave-types", check: (can) => can("leave_type", "read") },
  { href: "/settings/leave-policies", check: (can) => can("leave_policy", "read") },
  { href: "/settings/holiday-calendars", check: (can) => can("holiday_calendar", "read") },
  { href: "/settings/policy-documents", check: (_, cws) => cws("policy_document", "read", "global") },
  { href: "/settings/document-verifications", check: (can) => can("employee_document", "verify") },
  { href: "/settings/workflows", check: (can) => can("workflow", "read") },
  { href: "/settings/companies", check: (_, cws) => cws("company", "read", "global") },
  { href: "/settings/roles", check: (_, cws) => cws("role", "read", "global") },
  { href: "/settings/audit-logs", check: (_, cws) => cws("audit_log", "read", "global") },
];

export default function SettingsPage() {
  const { can, canWithScope } = useAuth();
  const router = useRouter();
  const hasGeneralAccess = can("tenant_settings", "read");

  useEffect(() => {
    if (hasGeneralAccess) return;
    const fallback = FALLBACK_ROUTES.find((r) => r.check(can, canWithScope));
    if (fallback) router.replace(fallback.href);
  }, [hasGeneralAccess, can, canWithScope, router]);

  if (!hasGeneralAccess) {
    return (
      <>
        <TopBar title="Settings" />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="General Settings" description="Manage organization settings and configuration" />
      <div className="px-8 py-6">
        <TenantSettingsForm />
      </div>
    </>
  );
}
