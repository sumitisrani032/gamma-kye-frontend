"use client";

import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui";

const stats = [
  { label: "Total Employees", value: "--", description: "Active workforce" },
  { label: "On Leave Today", value: "--", description: "Employees on leave" },
  { label: "Open Positions", value: "--", description: "Hiring pipeline" },
  { label: "Pending Approvals", value: "--", description: "Awaiting action" },
];

export function DashboardContent() {
  const { tenant, user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      <TenantSidebar />
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="Dashboard"
          description={`Welcome to ${tenant?.name || "your workspace"}`}
        />

        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent>
                  <p className="text-sm text-text-secondary">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-text-primary">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-3">
                <h2 className="text-lg font-semibold text-text-primary">
                  Workspace Info
                </h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Organization</dt>
                    <dd className="font-medium text-text-primary">
                      {tenant?.name || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Subdomain</dt>
                    <dd className="font-medium text-text-primary">
                      {tenant?.subdomain || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Plan</dt>
                    <dd className="font-medium text-text-primary capitalize">
                      {tenant?.plan || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Status</dt>
                    <dd>
                      <span className="inline-flex items-center rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700 capitalize">
                        {tenant?.status || "—"}
                      </span>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <h2 className="text-lg font-semibold text-text-primary">
                  Your Account
                </h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Name</dt>
                    <dd className="font-medium text-text-primary">
                      {user ? `${user.first_name} ${user.last_name}` : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Email</dt>
                    <dd className="font-medium text-text-primary">
                      {user?.email || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Roles</dt>
                    <dd className="font-medium text-text-primary">
                      {user?.roles?.join(", ") || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Permissions</dt>
                    <dd className="font-medium text-text-primary">
                      {user?.permissions?.length ?? "—"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
