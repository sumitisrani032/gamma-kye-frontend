import { api } from "./api-client";
import type { PermissionDetail } from "@/types";

interface PermissionListResponse {
  permissions: PermissionDetail[];
}

interface GroupedPermissionResponse {
  permissions: Record<string, PermissionDetail[]>;
}

export async function getPermissions(): Promise<PermissionDetail[]> {
  const { permissions } = await api.get<PermissionListResponse>(
    "/api/v1/manage/permissions"
  );
  return permissions;
}

export async function getGroupedPermissions(): Promise<
  Record<string, PermissionDetail[]>
> {
  const { permissions } = await api.get<GroupedPermissionResponse>(
    "/api/v1/manage/permissions?grouped=true"
  );
  return permissions;
}
