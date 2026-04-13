import { api } from "./api-client";
import type {
  WorkflowInstance,
  WorkflowDefinition,
  CreateWorkflowDefinitionRequest,
  CreateStepRequest,
  WorkflowStep,
} from "@/types";

/* ------------------------------------------------------------------ */
/*  Workflow Instances (Approvals) — /api/v1/workflow_instances        */
/* ------------------------------------------------------------------ */

export interface WorkflowInstanceListParams {
  my_pending?: boolean;
  status?: string;
}

export async function getWorkflowInstances(
  params?: WorkflowInstanceListParams
): Promise<WorkflowInstance[]> {
  const searchParams = new URLSearchParams();
  if (params?.my_pending) searchParams.set("my_pending", "true");
  if (params?.status) searchParams.set("status", params.status);
  const qs = searchParams.toString();
  return api.get<WorkflowInstance[]>(
    `/api/v1/workflow_instances${qs ? `?${qs}` : ""}`
  );
}

export async function getWorkflowInstance(
  id: string
): Promise<WorkflowInstance> {
  return api.get<WorkflowInstance>(`/api/v1/workflow_instances/${id}`);
}

export async function approveWorkflow(
  id: string,
  comments: string
): Promise<WorkflowInstance> {
  return api.post<WorkflowInstance>(
    `/api/v1/workflow_instances/${id}/approve`,
    { comments }
  );
}

export async function rejectWorkflow(
  id: string,
  comments: string
): Promise<WorkflowInstance> {
  return api.post<WorkflowInstance>(
    `/api/v1/workflow_instances/${id}/reject`,
    { comments }
  );
}

export async function cancelWorkflow(
  id: string
): Promise<WorkflowInstance> {
  return api.post<WorkflowInstance>(
    `/api/v1/workflow_instances/${id}/cancel`
  );
}

/* ------------------------------------------------------------------ */
/*  Workflow Definitions — /api/v1/manage/workflow_definitions         */
/* ------------------------------------------------------------------ */

export async function getWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
  return api.get<WorkflowDefinition[]>("/api/v1/manage/workflow_definitions");
}

export async function getWorkflowDefinition(
  id: string
): Promise<WorkflowDefinition> {
  return api.get<WorkflowDefinition>(
    `/api/v1/manage/workflow_definitions/${id}`
  );
}

export async function createWorkflowDefinition(
  payload: CreateWorkflowDefinitionRequest
): Promise<WorkflowDefinition> {
  return api.post<WorkflowDefinition>(
    "/api/v1/manage/workflow_definitions",
    payload
  );
}

export async function updateWorkflowDefinition(
  id: string,
  payload: Partial<CreateWorkflowDefinitionRequest>
): Promise<WorkflowDefinition> {
  return api.put<WorkflowDefinition>(
    `/api/v1/manage/workflow_definitions/${id}`,
    payload
  );
}

export async function deleteWorkflowDefinition(id: string): Promise<void> {
  await api.delete<void>(`/api/v1/manage/workflow_definitions/${id}`);
}

/* ------------------------------------------------------------------ */
/*  Workflow Steps — nested under definitions                         */
/* ------------------------------------------------------------------ */

export async function addWorkflowStep(
  definitionId: string,
  payload: CreateStepRequest
): Promise<WorkflowStep> {
  return api.post<WorkflowStep>(
    `/api/v1/manage/workflow_definitions/${definitionId}/steps`,
    payload
  );
}

export async function updateWorkflowStep(
  definitionId: string,
  stepId: string,
  payload: Partial<CreateStepRequest>
): Promise<WorkflowStep> {
  return api.put<WorkflowStep>(
    `/api/v1/manage/workflow_definitions/${definitionId}/steps/${stepId}`,
    payload
  );
}

export async function deleteWorkflowStep(
  definitionId: string,
  stepId: string
): Promise<void> {
  await api.delete<void>(
    `/api/v1/manage/workflow_definitions/${definitionId}/steps/${stepId}`
  );
}
