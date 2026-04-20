import { api } from "./api-client";
import type { RoleSummary, RoleDetail, CreateRoleRequest, RankTier, RoleTemplate } from "@/types";

interface RoleListResponse {
  roles: RoleSummary[];
}

interface RoleResponse {
  role: RoleDetail;
}

export async function getRoles(): Promise<RoleSummary[]> {
  const { roles } = await api.get<RoleListResponse>("/api/v1/manage/roles");
  return roles;
}

export async function getRole(id: string): Promise<RoleDetail> {
  const { role } = await api.get<RoleResponse>(`/api/v1/manage/roles/${id}`);
  return role;
}

export async function createRole(
  payload: CreateRoleRequest
): Promise<RoleDetail> {
  const { role } = await api.post<RoleResponse>(
    "/api/v1/manage/roles",
    payload
  );
  return role;
}

export async function updateRole(
  id: string,
  payload: { role: { name: string; description: string; rank?: number } }
): Promise<RoleDetail> {
  const { role } = await api.put<RoleResponse>(
    `/api/v1/manage/roles/${id}`,
    payload
  );
  return role;
}

export async function getRoleRankGuide(): Promise<RankTier[]> {
  const { tiers } = await api.get<{ tiers: RankTier[] }>("/api/v1/manage/roles/rank_guide");
  return tiers;
}

export async function getRoleTemplates(): Promise<RoleTemplate[]> {
  const { templates } = await api.get<{ templates: RoleTemplate[] }>("/api/v1/manage/roles/templates");
  return templates;
}

export async function deleteRole(id: string): Promise<void> {
  await api.delete<void>(`/api/v1/manage/roles/${id}`);
}

export async function syncRolePermissions(
  id: string,
  permissionIds: string[]
): Promise<RoleDetail> {
  const { role } = await api.put<RoleResponse>(
    `/api/v1/manage/roles/${id}/permissions`,
    { permission_ids: permissionIds }
  );
  return role;
}
