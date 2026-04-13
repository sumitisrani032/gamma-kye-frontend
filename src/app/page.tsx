"use client";

import Link from "next/link";
import { Button, Input, Alert } from "@/components/ui";
import { BASE_DOMAIN } from "@/lib/constants";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { useWorkspaceCheck } from "@/features/tenant/hooks/use-workspace-check";

export default function LandingPage() {
  const {
    subdomain: workspace,
    setSubdomain: setWorkspace,
    normalized,
    error,
    loading,
    clearError,
    handleCheck,
  } = useWorkspaceCheck("/login");

  return (
    <>
      <MarketingHeader />

      <div className="flex flex-1 flex-col">
        {/* Hero Section */}
        <section className="bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
                HR Management,{" "}
                <span className="text-primary-600">Simplified</span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-text-secondary">
                GammaKYE helps you manage your entire workforce from one platform.
                Onboarding, payroll, attendance, and more — built for modern teams.
              </p>

              {/* CTA Section */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg">Start Free Trial</Button>
                </Link>

                {/* Workspace Input */}
                <div className="flex items-center gap-2">
                  <Input
                    value={workspace}
                    onChange={(e) => { setWorkspace(e.target.value); clearError(); }}
                    placeholder="your-company"
                    className="w-44"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCheck();
                      }
                    }}
                  />

                  <span className="text-text-muted text-sm">
                    .{BASE_DOMAIN}
                  </span>

                  <Button
                    variant="secondary"
                    size="lg"
                    disabled={!normalized || loading}
                    loading={loading}
                    onClick={handleCheck}
                  >
                    Sign In
                  </Button>
                </div>
              </div>

              {error && (
                <div className="mt-4">
                  <Alert variant={error === "not_found" ? "warning" : "error"}>
                    {error === "not_found" && (
                      <>
                        Workspace not found.{" "}
                        <Link
                          href="/register"
                          className="font-medium underline hover:text-primary-700"
                        >
                          Want to create one?
                        </Link>
                      </>
                    )}
                    {error === "suspended" && "This workspace is suspended."}
                    {error !== "not_found" && error !== "suspended" && error}
                  </Alert>
                </div>
              )}

              {!error && (
                <p className="mt-3 text-xs text-text-muted">
                  Enter your workspace name to access your company portal
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold text-text-primary">
                Everything you need to manage HR
              </h2>
              <p className="mt-4 text-text-secondary">
                A complete suite of tools for modern people operations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-surface p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 mb-4">
                    {feature.icon}
                  </div>

                  <h3 className="text-lg font-semibold text-text-primary">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm text-text-secondary">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-surface py-8 mt-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-text-muted">
            &copy; {new Date().getFullYear()} GammaKYE. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}

const features = [
  {
    title: "Employee Directory",
    description:
      "Centralized employee profiles with all the information you need in one place.",
    icon: <span className="text-lg">👥</span>,
  },
  {
    title: "Leave Management",
    description:
      "Streamlined leave requests and approvals with calendar integration.",
    icon: <span className="text-lg">📅</span>,
  },
  {
    title: "Attendance Tracking",
    description:
      "Automated attendance with clock-in/out and real-time reporting.",
    icon: <span className="text-lg">⏱</span>,
  },
  {
    title: "Payroll Processing",
    description:
      "Accurate payroll calculations with tax compliance built in.",
    icon: <span className="text-lg">💰</span>,
  },
  {
    title: "Performance Reviews",
    description:
      "Structured review cycles with goal tracking and feedback.",
    icon: <span className="text-lg">🏆</span>,
  },
  {
    title: "Reports & Analytics",
    description:
      "Actionable insights with customizable dashboards and exports.",
    icon: <span className="text-lg">📊</span>,
  },
];
