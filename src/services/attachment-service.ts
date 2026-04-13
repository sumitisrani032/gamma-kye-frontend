import { api } from "./api-client";
import type { Attachment, CreateAttachmentRequest } from "@/types";

export async function createAttachment(
  payload: CreateAttachmentRequest
): Promise<Attachment> {
  return api.post<Attachment>("/api/v1/attachments", payload);
}

export async function getAttachment(id: string): Promise<Attachment> {
  return api.get<Attachment>(`/api/v1/attachments/${id}`);
}

export async function deleteAttachment(id: string): Promise<void> {
  await api.delete<void>(`/api/v1/attachments/${id}`);
}
