import { api } from "./api-client";
import type { MyRequestsParams, MyRequestsResponse } from "@/types";

const BASE = "/api/v1/my_requests";

/**
 * Unified list of the current user's submitted requests across leaves,
 * WFH, and attendance regularizations. Replaces the old
 * `/workflow_instances?my_requests=true` shape.
 */
export async function getMyRequests(
  params?: MyRequestsParams,
): Promise<MyRequestsResponse> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.type) qs.set("type", params.type);
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.per_page) qs.set("per_page", String(params.per_page));
  const query = qs.toString();
  return api.get<MyRequestsResponse>(`${BASE}${query ? `?${query}` : ""}`);
}
