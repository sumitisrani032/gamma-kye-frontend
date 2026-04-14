import { api } from "./api-client";
import type {
  MyProfileResponse,
  EmployeeDetail,
  PersonalDetail,
  PersonalDetailFormData,
  BankDetail,
  LeaveBalance,
  AttendanceSummary,
} from "@/types";

const BASE = "/api/v1/my_profile";

export async function getMyProfile(): Promise<MyProfileResponse> {
  return api.get<MyProfileResponse>(BASE);
}

export async function updateMyProfile(employee: Record<string, unknown>): Promise<EmployeeDetail> {
  const data = await api.patch<{ employee: EmployeeDetail }>(BASE, { employee });
  return data.employee;
}

export async function getPersonalDetails(): Promise<PersonalDetail | null> {
  const data = await api.get<{ personal_detail: PersonalDetail | null }>(`${BASE}/personal_details`);
  return data.personal_detail;
}

export async function updatePersonalDetails(personalDetail: PersonalDetailFormData): Promise<PersonalDetail> {
  const data = await api.patch<{ personal_detail: PersonalDetail }>(`${BASE}/update_personal_details`, { personal_detail: personalDetail });
  return data.personal_detail;
}

export async function getBankDetails(): Promise<BankDetail[]> {
  const data = await api.get<{ bank_details: BankDetail[] }>(`${BASE}/bank_details`);
  return data.bank_details;
}

export async function getDocuments(): Promise<{ id: string; file_name: string; file_type: string; created_at: string }[]> {
  const data = await api.get<{ documents: { id: string; file_name: string; file_type: string; created_at: string }[] }>(`${BASE}/documents`);
  return data.documents;
}

export async function getLeaveBalances(): Promise<LeaveBalance[]> {
  const data = await api.get<{ leave_balances: LeaveBalance[] }>(`${BASE}/leave_balances`);
  return data.leave_balances;
}

export async function getAttendanceSummary(year: number, month: number): Promise<AttendanceSummary> {
  const data = await api.get<{ attendance_summary: AttendanceSummary }>(`${BASE}/attendance_summary?year=${year}&month=${month}`);
  return data.attendance_summary;
}
