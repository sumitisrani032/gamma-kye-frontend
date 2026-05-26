"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Button, Alert, Card, CardContent, CardHeader, Input, Select } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { Can } from "@/components/common/can";
import { SalaryComponentForm } from "@/features/payroll/components/salary-component-form";
import { SalaryComponentsMaster } from "@/features/payroll/components/salary-components-master";
import {
  useEmployeeSalariesList,
  useDeleteEmployeePayslip,
  useEmployeePayslipsList,
  useUpdateEmployeePayslip,
} from "@/features/payroll/hooks";
import { useAuth } from "@/contexts/auth-context";
import { generateEmployeePayslips } from "@/services/payroll-service";
import type { EmployeeSalary, EmployeePayslip } from "@/types";

type Tab = "setup" | "generate" | "payslips";

function useVisibleTabs() {
  const { can, canWithScope } = useAuth();
  const all = [
    { key: "setup" as Tab, label: "Setup", show: () => can("payroll", "process") || canWithScope("payroll", "read", "global") },
    { key: "generate" as Tab, label: "Generate", show: () => can("payroll", "process") },
    { key: "payslips" as Tab, label: "Payslips", show: () => can("payroll", "process") || canWithScope("payroll", "read", "self") },
  ];
  return all.filter((t) => t.show());
}

const MONTHS_SHORT = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = [
  { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
  { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
  { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    approved: "bg-green-100 text-green-700",
    paid: "bg-blue-100 text-blue-700",
  };
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] || map.draft}`;
}

export default function PayrollPage() {
  const tabs = useVisibleTabs();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(tabs[0]?.key || "payslips");

  useEffect(() => {
    const tabParam = searchParams.get("tab") as Tab | null;
    if (tabParam && tabs.some((t) => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  return (
    <>
      <TopBar title="Payroll" description="Manage salary components, CTC, and payslips" />
      <div className="px-8 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-primary-600 text-white"
                  : "text-text-secondary hover:bg-surface-tertiary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        {activeTab === "setup" && <SetupPanel />}
        {activeTab === "generate" && <GeneratePanel />}
        {activeTab === "payslips" && <CombinedPayslipsPanel />}
      </div>
    </>
  );
}

/* ─── CTC List (shared between Setup and standalone) ─── */

function CtcListPanel() {
  const { data, isLoading } = useEmployeeSalariesList({ limit: 100 });
  const salaries = data?.items || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-secondary">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Employee</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Annual CTC</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Currency</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Year</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">From</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">To</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {salaries.map((s: EmployeeSalary) => (
            <tr key={s.id} className="hover:bg-surface-secondary/50">
              <td className="px-4 py-3 text-text-primary">{s.employee_name || s.employee_id.slice(0, 8)}</td>
              <td className="px-4 py-3 text-right font-medium text-text-primary">{s.annual_ctc.toLocaleString("en-IN")}</td>
              <td className="px-4 py-3 text-text-primary">{s.currency}</td>
              <td className="px-4 py-3 text-text-primary">{s.year}</td>
              <td className="px-4 py-3 text-text-secondary">{s.effective_from}</td>
              <td className="px-4 py-3 text-text-secondary">{s.effective_to || "—"}</td>
              <td className="px-4 py-3">
                <span className={statusBadge(s.status)}>{s.status}</span>
              </td>
            </tr>
          ))}
          {salaries.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">No salary assignments yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Setup (Components + CTC Assignment + CTC List) ─── */

function SetupPanel() {
  return (
    <div className="space-y-8">
      <Can resource="payroll" action="process">
        <Card>
          <CardHeader>Components</CardHeader>
          <CardContent>
            <SalaryComponentsMaster />
          </CardContent>
        </Card>
      </Can>

      <Can resource="payroll" action="process">
        <Card>
          <CardHeader>CTC Assignment</CardHeader>
          <CardContent>
            <SalaryComponentForm />
          </CardContent>
        </Card>
      </Can>

      <Card>
        <CardHeader>CTC List</CardHeader>
        <CardContent className="p-0">
          <CtcListPanel />
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Generate Payslips ─── */

function GeneratePanel() {
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: salariesData, isLoading: salariesLoading } = useEmployeeSalariesList({ limit: 200 });
  const salaries = salariesData?.items || [];

  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setError("");
    setSuccess("");
    setGenerating(true);

    try {
      const result = await generateEmployeePayslips({ month: Number(month), year: Number(year) });

      const parts: string[] = [];
      if (result.total_created) parts.push(`Generated ${result.total_created} payslip${result.total_created > 1 ? "s" : ""}`);
      if (result.total_skipped) parts.push(`${result.total_skipped} already existed`);
      if (result.total_failed) parts.push(`${result.total_failed} failed`);

      if (result.total_created === 0 && result.total_skipped === 0 && result.total_failed === 0) {
        setError("No active salaries found for generation.");
      } else if (result.total_created === 0 && result.total_skipped > 0 && result.total_failed === 0) {
        setError("All employees already have a payslip for this month.");
      } else {
        setSuccess(parts.join(", ") + ".");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    }

    setGenerating(false);
  };

  const activeCount = salaries.filter((s: EmployeeSalary) => s.status !== "draft").length;

  return (
    <div className="max-w-2xl space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <CardHeader>Select Month</CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={MONTHS_FULL}
              required
            />
            <Input
              label="Year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
          </div>

          <div className="mt-4 text-sm text-text-secondary">
            {salariesLoading ? "Loading salaries..." : `${activeCount} active salaries ready for generation`}
          </div>

          <Can resource="payroll" action="process">
            <Button onClick={handleGenerate} loading={generating} size="lg" className="mt-4">
              Generate Payslips
            </Button>
          </Can>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Combined Payslips (Approvals + My Payslips) ─── */

function CombinedPayslipsPanel() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { data: pendingData, isLoading: pendingLoading } = useEmployeePayslipsList({ limit: 100 });
  const { data: allData, isLoading: allLoading } = useEmployeePayslipsList({ limit: 200 });
  const updateMutation = useUpdateEmployeePayslip();
  const deleteMutation = useDeleteEmployeePayslip();
  const pending = (pendingData?.items || []).filter((p: EmployeePayslip) => p.status === "draft");
  const all = allData?.items || [];
  const payslips = search
    ? all.filter((p) => (p.employee_name || "").toLowerCase().includes(search.toLowerCase()))
    : all;

  const handleApprove = async (id: number) => {
    try {
      await updateMutation.mutateAsync({ id, payload: { status: "approved" } as any });
    } catch { /* ignore */ }
  };

  const handleMarkPaid = async (id: number) => {
    try {
      await updateMutation.mutateAsync({ id, payload: { status: "paid" } as any });
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
    } catch { /* ignore */ }
    setDeleteId(null);
  };

  if (pendingLoading || allLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Can resource="payroll" action="process">
        <Card>
          <CardHeader>Pending Approvals</CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Employee</th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Month</th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">Gross</th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">Deductions</th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">Net</th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pending.map((p: EmployeePayslip) => (
                    <tr key={p.id} className="hover:bg-surface-secondary/50">
                      <td className="px-4 py-3 text-text-primary">{p.employee_name || p.employee_id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-text-primary">{MONTHS_SHORT[p.month]} {p.year}</td>
                      <td className="px-4 py-3 text-right text-text-primary">{p.gross_amount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right text-red-600">{p.deduction_amount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right font-semibold text-text-primary">{p.net_amount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleApprove(p.id)}
                          disabled={updateMutation.isPending}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleMarkPaid(p.id)}
                          disabled={updateMutation.isPending}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Mark Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pending.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No pending payslips.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Can>

      <Card>
        <CardHeader>All Payslips</CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by employee name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Employee</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Month</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Gross</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Deductions</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Net</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Generated</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payslips.map((p: EmployeePayslip) => (
                  <tr key={p.id} className="hover:bg-surface-secondary/50">
                    <td className="px-4 py-3 text-text-primary">{p.employee_name || p.employee_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-text-primary">{MONTHS_SHORT[p.month]} {p.year}</td>
                    <td className="px-4 py-3 text-right font-medium text-text-primary">{p.gross_amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right text-red-600">{p.deduction_amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right font-semibold text-text-primary">{p.net_amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3"><span className={statusBadge(p.status)}>{p.status}</span></td>
                    <td className="px-4 py-3 text-text-secondary">{new Date(p.generated_on).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        href={`/payroll/payslips/${p.id}`}
                        className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
                      >
                        View
                      </Link>
                      <Can resource="payroll" action="process">
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                        >
                          Delete
                        </button>
                      </Can>
                    </td>
                  </tr>
                ))}
                {payslips.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">No payslips found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <Modal
            open={deleteId !== null}
            onClose={() => setDeleteId(null)}
            onConfirm={handleDelete}
            title="Delete Payslip"
            confirmLabel="Delete"
            loading={deleteMutation.isPending}
          >
            Are you sure you want to delete this payslip? This action cannot be undone.
          </Modal>
        </CardContent>
      </Card>
    </div>
  );
}

