import { api } from "./api-client";
import type { Attachment, CreateAttachmentRequest } from "@/types";

interface AttachmentResponse {
  attachment: Attachment;
}

export async function createAttachment(
  payload: CreateAttachmentRequest
): Promise<Attachment> {
  const { attachment } = await api.post<AttachmentResponse>(
    "/api/v1/attachments",
    payload
  );
  return attachment;
}

export async function getAttachment(id: string): Promise<Attachment> {
  const { attachment } = await api.get<AttachmentResponse>(
    `/api/v1/attachments/${id}`
  );
  return attachment;
}

export async function deleteAttachment(id: string): Promise<void> {
  await api.delete<void>(`/api/v1/attachments/${id}`);
}
