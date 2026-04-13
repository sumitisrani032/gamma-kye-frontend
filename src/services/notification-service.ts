import { api } from "./api-client";
import type { NotificationListResponse } from "@/types";

export async function getNotifications(
  unread?: boolean
): Promise<NotificationListResponse> {
  const params = unread ? "?unread=true" : "";
  return api.get<NotificationListResponse>(`/api/v1/notifications${params}`);
}

export async function markRead(id: string): Promise<void> {
  await api.patch<void>(`/api/v1/notifications/${id}/mark_read`);
}

export async function markAllRead(): Promise<void> {
  await api.post<void>("/api/v1/notifications/mark_all_read");
}
