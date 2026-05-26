export interface CompanyInfo {
  name: string;
  address: string;
  gstin?: string;
  cin?: string;
  logo?: string;
}

export interface EmployeeInfo {
  name: string;
  employeeId: string;
  designation?: string;
  department?: string;
  dateOfJoining?: string;
  pan?: string;
  uan?: string;
  pfNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  workLocation?: string;
}

export interface PayPeriod {
  month: string;
  year: number;
}

export interface Attendance {
  totalWorkingDays: number;
  paidDays: number;
  leaveBalance?: number;
  lopDays?: number;
}

export interface SalaryLineItem {
  label: string;
  amount: number;
}

export interface PayslipTotals {
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
}

export interface AdditionalDetails {
  amountInWords: string;
  paymentMode?: string;
  generatedDate: string;
  hrSignature?: string;
  authorizedSignature?: string;
}

export interface PayslipData {
  company: CompanyInfo;
  employee: EmployeeInfo;
  payPeriod: PayPeriod;
  attendance: Attendance;
  earnings: SalaryLineItem[];
  deductions: SalaryLineItem[];
  totals: PayslipTotals;
  additional: AdditionalDetails;
}
