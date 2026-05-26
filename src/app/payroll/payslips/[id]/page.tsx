"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useRef } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui";
import { useEmployeePayslip } from "@/features/payroll/hooks";
import { PayslipTemplate } from "@/features/payroll/components/payslip-template";
import type { PayslipData } from "@/features/payroll/components/payslip-types";
import { numberToWords } from "@/features/payroll/components/payslip-template";

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: payslip, isLoading, error } = useEmployeePayslip(Number(id));
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!payslip) return;
    const name = (payslip.employee_name || "employee").toLowerCase().replace(/\s+/g, "-");
    const month = MONTHS[payslip.month || 0].toLowerCase();
    document.title = `${name}-${month}-${payslip.year}-payslip`;
    window.print();
  }, [payslip]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !payslip) {
    return (
      <>
        <TopBar title="Payslip" description="Not found" />
        <div className="px-8 py-6">
          <p className="text-text-muted">Payslip not found.</p>
          <Link href="/payroll?tab=payslips" className="text-primary-600 hover:text-primary-800">Back to payslips</Link>
        </div>
      </>
    );
  }

  const snapshot = payslip.component_snapshot as Record<string, any> | null;
  const rawEarnings: Record<string, number> = snapshot?.earnings || {};
  const rawDeductions: Record<string, number> = snapshot?.deductions || {};

  const companyAddress = payslip.company_address || "—";
  const workLocation = payslip.work_location || "—";

  const payslipData: PayslipData = {
    company: {
      name: payslip.company_name || "GammaHRMS",
      address: companyAddress,
      gstin: payslip.company_tax_id || undefined,
      cin: payslip.company_registration_number || undefined,
    },
    employee: {
      name: payslip.employee_name || "—",
      employeeId: payslip.employee_id,
      designation: payslip.employee_designation || "—",
      department: payslip.employee_department || "—",
      dateOfJoining: payslip.date_of_joining || "—",
      pan: "—",
      uan: "—",
      pfNumber: "—",
      bankName: "—",
      accountNumber: "—",
      ifsc: "—",
      workLocation: workLocation,
    },
    payPeriod: {
      month: MONTHS_FULL[payslip.month],
      year: payslip.year,
    },
    attendance: {
      totalWorkingDays: payslip.total_attendance,
      paidDays: payslip.paid_days,
      lopDays: payslip.lop_days ?? 0,
    },
    earnings: Object.entries(rawEarnings).map(([label, amount]) => ({
      label: label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      amount,
    })),
    deductions: Object.entries(rawDeductions).map(([label, amount]) => ({
      label: label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      amount,
    })),
    totals: {
      grossEarnings: payslip.gross_amount,
      totalDeductions: payslip.deduction_amount,
      netPay: payslip.net_amount,
    },
    additional: {
      amountInWords: numberToWords(payslip.net_amount),
      paymentMode: "Bank Transfer",
      generatedDate: new Date(payslip.generated_on).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }),
    },
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #payslip-print, #payslip-print * { visibility: visible; }
          #payslip-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { margin: 0; size: A4; }
        }
      `}</style>

      <div className="no-print">
        <TopBar
          title={`Payslip — ${MONTHS[payslip.month]} ${payslip.year}`}
          description={`${payslip.employee_name || "Employee"} | ${payslip.status}`}
        />
      </div>

      <div className="px-8 py-6 max-w-4xl mx-auto space-y-4 no-print">
        <div className="flex items-center justify-between">
          <Link href="/payroll?tab=payslips" className="text-sm text-primary-600 hover:text-primary-800">&larr; Back to payslips</Link>
          <Button onClick={handlePrint}>Download PDF</Button>
        </div>
      </div>

      <div id="payslip-print" className="px-8 pb-12 max-w-4xl mx-auto">
        <PayslipTemplate ref={printRef} data={payslipData} />
      </div>
    </>
  );
}
