import { api } from "./api-client";
import type { OvertimeRule, OvertimeRuleFormData } from "@/types";

const BASE = "/api/v1/manage/overtime_rules";

export async function listOvertimeRules(): Promise<OvertimeRule[]> {
  const data = await api.get<{ overtime_rules: OvertimeRule[] }>(BASE);
  return data.overtime_rules;
}

export async function createOvertimeRule(overtime_rule: OvertimeRuleFormData): Promise<void> {
  await api.post(BASE, { overtime_rule });
}

export async function updateOvertimeRule(id: string, overtime_rule: Partial<OvertimeRuleFormData>): Promise<void> {
  await api.put(`${BASE}/${id}`, { overtime_rule });
}
