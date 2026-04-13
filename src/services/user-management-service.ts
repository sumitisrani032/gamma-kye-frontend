import { api } from "./api-client";
import type { ManagedUser, ManagedUserDetail, UserStatus } from "@/types";

interface UserListResponse {
  users: ManagedUser[];
}

interface UserResponse {
  user: ManagedUser;
}

export async function getUsers(status?: UserStatus): Promise<ManagedUser[]> {
  const qs = status ? `?status=${status}` : "";
  const { users } = await api.get<UserListResponse>(
    `/api/v1/manage/users${qs}`
  );
  return users;
}

export async function getUser(id: string): Promise<ManagedUserDetail> {
  return api.get<ManagedUserDetail>(`/api/v1/manage/users/${id}`);
}

export async function updateUser(
  id: string,
  payload: { user: Partial<Pick<ManagedUser, "first_name" | "last_name" | "status">> }
): Promise<ManagedUser> {
  const { user } = await api.put<UserResponse>(
    `/api/v1/manage/users/${id}`,
    payload
  );
  return user;
}

export async function assignRole(
  userId: string,
  roleId: string
): Promise<void> {
  await api.post<void>(`/api/v1/manage/users/${userId}/assign_role`, {
    role_id: roleId,
  });
}

export async function removeRole(
  userId: string,
  roleId: string
): Promise<void> {
  await api.delete<void>(`/api/v1/manage/users/${userId}/remove_role`, {
    role_id: roleId,
  });
}
