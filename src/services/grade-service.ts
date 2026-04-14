import { api } from "./api-client";
import type { Grade, GradeFormData } from "@/types";

const BASE = "/api/v1/manage/grades";

export async function listGrades(): Promise<Grade[]> {
  const data = await api.get<{ grades: Grade[] }>(BASE);
  return data.grades;
}

export async function createGrade(grade: GradeFormData): Promise<Grade> {
  const data = await api.post<{ grade: Grade }>(BASE, { grade });
  return data.grade;
}

export async function updateGrade(id: string, grade: Partial<GradeFormData>): Promise<Grade> {
  const data = await api.put<{ grade: Grade }>(`${BASE}/${id}`, { grade });
  return data.grade;
}

export async function deleteGrade(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}
