"use client";

import { TopBar } from "@/components/layout/top-bar";
import { TenantSettingsForm } from "@/features/tenant-settings/components/tenant-settings-form";

export default function SettingsPage() {
  return (
    <>
      <TopBar title="General Settings" description="Manage organization settings and configuration" />
      <div className="px-8 py-6">
        <TenantSettingsForm />
      </div>
    </>
  );
}
