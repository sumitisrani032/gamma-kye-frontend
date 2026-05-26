"use client";

import { forwardRef } from "react";
import type { PayslipData } from "./payslip-types";

interface Props {
  data: PayslipData;
}

function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const convert = (num: number): string => {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + convert(num % 100) : "");
    if (num < 100000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
    if (num < 10000000) return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + convert(num % 100000) : "");
    return convert(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + convert(num % 10000000) : "");
  };
  const [rupees, paise] = Number(n).toFixed(2).split(".");
  let result = convert(parseInt(rupees)) + " Rupees";
  if (parseInt(paise) > 0) result += " and " + convert(parseInt(paise)) + " Paise";
  return result + " Only";
}

export const PayslipTemplate = forwardRef<HTMLDivElement, Props>(function PayslipTemplate({ data }, ref) {
  const { company, employee, payPeriod, attendance, earnings, deductions, totals, additional } = data;

  return (
    <div ref={ref} className="bg-white text-gray-800 print:bg-white">
      <div className="max-w-[210mm] mx-auto border border-gray-300 print:border print:border-gray-300">
        {/* Watermark */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none text-[100px] font-bold text-gray-600 rotate-[-30deg] select-none">
            COMPUTER GENERATED PAYSLIP
          </div>

          {/* ─── HEADER ─── */}
          <div className="border-b-2 border-gray-800 px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium border border-gray-300">
                  Logo
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">{company.name}</h1>
                  <p className="text-xs text-gray-600 mt-0.5 max-w-md leading-relaxed">{company.address}</p>
                  <div className="flex gap-4 mt-1 text-[10px] text-gray-500">
                    {company.gstin && <span>GSTIN: {company.gstin}</span>}
                    {company.cin && <span>CIN: {company.cin}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-gray-900 uppercase tracking-wider">Payslip</p>
                <p className="text-xs text-gray-600 mt-0.5">For the month of</p>
                <p className="text-sm font-semibold text-gray-800">{payPeriod.month} {payPeriod.year}</p>
              </div>
            </div>
          </div>

          {/* ─── EMPLOYEE DETAILS ─── */}
          <div className="border-b border-gray-300 px-8 py-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Employee Details</h2>
            <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 text-xs">
              <div><span className="text-gray-500">Name</span><p className="font-medium text-gray-900">{employee.name}</p></div>
              <div><span className="text-gray-500">Employee ID</span><p className="font-mono text-gray-900">{employee.employeeId}</p></div>
              <div><span className="text-gray-500">Designation</span><p className="text-gray-900">{employee.designation || "—"}</p></div>
              <div><span className="text-gray-500">Department</span><p className="text-gray-900">{employee.department || "—"}</p></div>
              <div><span className="text-gray-500">Date of Joining</span><p className="text-gray-900">{employee.dateOfJoining || "—"}</p></div>
              <div><span className="text-gray-500">Work Location</span><p className="text-gray-900">{employee.workLocation || "—"}</p></div>
              <div><span className="text-gray-500">PAN</span><p className="font-mono text-gray-900">{employee.pan || "—"}</p></div>
              <div><span className="text-gray-500">UAN</span><p className="font-mono text-gray-900">{employee.uan || "—"}</p></div>
              <div><span className="text-gray-500">PF No.</span><p className="font-mono text-gray-900">{employee.pfNumber || "—"}</p></div>
              <div><span className="text-gray-500">Bank Name</span><p className="text-gray-900">{employee.bankName || "—"}</p></div>
              <div><span className="text-gray-500">Account No.</span><p className="font-mono text-gray-900">{employee.accountNumber || "—"}</p></div>
              <div><span className="text-gray-500">IFSC Code</span><p className="font-mono text-gray-900">{employee.ifsc || "—"}</p></div>
            </div>
          </div>

          {/* ─── ATTENDANCE + PAY PERIOD ─── */}
          <div className="border-b border-gray-300 px-8 py-3">
            <div className="grid grid-cols-5 gap-4 text-xs">
              <div className="text-center border-r border-gray-200">
                <p className="text-gray-500">Pay Month</p>
                <p className="font-semibold text-gray-900">{payPeriod.month} {payPeriod.year}</p>
              </div>
              <div className="text-center border-r border-gray-200">
                <p className="text-gray-500">Working Days</p>
                <p className="font-semibold text-gray-900">{attendance.totalWorkingDays}</p>
              </div>
              <div className="text-center border-r border-gray-200">
                <p className="text-gray-500">Paid Days</p>
                <p className="font-semibold text-green-700">{attendance.paidDays}</p>
              </div>
              <div className="text-center border-r border-gray-200">
                <p className="text-gray-500">LOP Days</p>
                <p className="font-semibold text-red-700">{attendance.lopDays ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Leave Balance</p>
                <p className="font-semibold text-gray-900">{attendance.leaveBalance ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* ─── SALARY BREAKDOWN ─── */}
          <div className="px-8 py-4">
            <div className="grid grid-cols-2 gap-8">
              {/* Earnings */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 border-b border-gray-300 pb-1">Earnings</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-1.5 text-left font-medium text-gray-500">Component</th>
                      <th className="py-1.5 text-right font-medium text-gray-500">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((item) => (
                      <tr key={item.label} className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-800">{item.label}</td>
                        <td className="py-1.5 text-right font-medium text-gray-800">{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold bg-gray-50">
                      <td className="py-1.5 text-gray-900">Total Earnings</td>
                      <td className="py-1.5 text-right text-gray-900">{totals.grossEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 border-b border-gray-300 pb-1">Deductions</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-1.5 text-left font-medium text-gray-500">Component</th>
                      <th className="py-1.5 text-right font-medium text-gray-500">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deductions.map((item) => (
                      <tr key={item.label} className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-800">{item.label}</td>
                        <td className="py-1.5 text-right font-medium text-red-700">{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold bg-gray-50">
                      <td className="py-1.5 text-gray-900">Total Deductions</td>
                      <td className="py-1.5 text-right text-red-700">{totals.totalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Pay */}
            <div className="mt-4 border-2 border-gray-800 rounded-md bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net Pay</p>
                  <p className="text-xl font-bold text-gray-900">₹ {totals.netPay.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-gray-500 italic mt-0.5">{additional.amountInWords}</p>
                </div>
                <div className="text-right text-xs text-gray-500 space-y-0.5">
                  <p>Gross: ₹ {totals.grossEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                  <p>Deductions: ₹ {totals.totalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── ADDITIONAL DETAILS ─── */}
          <div className="border-t border-gray-300 px-8 py-3 flex items-center justify-between text-[10px] text-gray-500">
            <div className="flex gap-6">
              <span>Payment Mode: <span className="font-medium text-gray-700">{additional.paymentMode || "Bank Transfer"}</span></span>
              <span>Generated: <span className="font-medium text-gray-700">{additional.generatedDate}</span></span>
            </div>
            <p className="italic">Computer Generated Payslip</p>
          </div>

          {/* ─── SIGNATURES ─── */}
          <div className="border-t border-gray-300 px-8 py-6">
            <div className="flex justify-between text-xs">
              <div className="text-center">
                <div className="w-40 border-b border-gray-400 mb-1 pt-6" />
                <p className="text-gray-500">HR Signature</p>
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-gray-400 mb-1 pt-6" />
                <p className="text-gray-500">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export { numberToWords };
