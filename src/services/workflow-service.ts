import { api } from "./api-client";
import type {
  WorkflowInstance,
  WorkflowDefinition,
  WorkflowDefinitionSummary,
  CreateWorkflowDefinitionRequest,
  CreateStepRequest,
  WorkflowStep,
} from "@/types";

/* ------------------------------------------------------------------ */
/*  Response wrappers — backend uses named key wrapping                */
/* ------------------------------------------------------------------ */

interface WorkflowInstanceListResponse {
  workflow_instances: WorkflowInstance[];
}

interface WorkflowInstanceResponse {
  workflow_instance: WorkflowInstance;
}

interface WorkflowDefinitionListResponse {
  workflow_definitions: WorkflowDefinitionSummary[];
}

interface WorkflowDefinitionResponse {
  workflow_definition: WorkflowDefinition;
}

interface WorkflowStepResponse {
  step: WorkflowStep;
}

/* ------------------------------------------------------------------ */
/*  Workflow Instances (Approvals) — /api/v1/workflow_instances        */
/* ------------------------------------------------------------------ */

export interface WorkflowInstanceListParams {
  my_requests?: boolean;
  my_pending?: boolean;
  status?: string;
}

export async function getWorkflowInstances(
  params?: WorkflowInstanceListParams
): Promise<WorkflowInstance[]> {
  const searchParams = new URLSearchParams();
  if (params?.my_requests) searchParams.set("my_requests", "true");
  if (params?.my_pending) searchParams.set("my_pending", "true");
  if (params?.status) searchParams.set("status", params.status);
  const qs = searchParams.toString();
  const { workflow_instances } = await api.get<WorkflowInstanceListResponse>(
    `/api/v1/workflow_instances${qs ? `?${qs}` : ""}`
  );
  return workflow_instances;
}

export async function getWorkflowInstance(
  id: string
): Promise<WorkflowInstance> {
  const { workflow_instance } = await api.get<WorkflowInstanceResponse>(
    `/api/v1/workflow_instances/${id}`
  );
  return workflow_instance;
}

export async function approveWorkflow(
  id: string,
  comments: string
): Promise<WorkflowInstance> {
  const { workflow_instance } = await api.post<WorkflowInstanceResponse>(
    `/api/v1/workflow_instances/${id}/approve`,
    { comments }
  );
  return workflow_instance;
}

export async function rejectWorkflow(
  id: string,
  comments: string
): Promise<WorkflowInstance> {
  const { workflow_instance } = await api.post<WorkflowInstanceResponse>(
    `/api/v1/workflow_instances/${id}/reject`,
    { comments }
  );
  return workflow_instance;
}

export async function cancelWorkflow(
  id: string
): Promise<WorkflowInstance> {
  const { workflow_instance } = await api.post<WorkflowInstanceResponse>(
    `/api/v1/workflow_instances/${id}/cancel`
  );
  return workflow_instance;
}

/* ------------------------------------------------------------------ */
/*  Workflow Definitions — /api/v1/manage/workflow_definitions         */
/* ------------------------------------------------------------------ */

export async function getWorkflowDefinitions(): Promise<WorkflowDefinitionSummary[]> {
  const { workflow_definitions } =
    await api.get<WorkflowDefinitionListResponse>(
      "/api/v1/manage/workflow_definitions"
    );
  return workflow_definitions;
}

export async function getWorkflowDefinition(
  id: string
): Promise<WorkflowDefinition> {
  const { workflow_definition } =
    await api.get<WorkflowDefinitionResponse>(
      `/api/v1/manage/workflow_definitions/${id}`
    );
  return workflow_definition;
}

export async function createWorkflowDefinition(
  payload: CreateWorkflowDefinitionRequest
): Promise<WorkflowDefinition> {
  const { workflow_definition } =
    await api.post<WorkflowDefinitionResponse>(
      "/api/v1/manage/workflow_definitions",
      payload
    );
  return workflow_definition;
}

export async function updateWorkflowDefinition(
  id: string,
  payload: CreateWorkflowDefinitionRequest
): Promise<WorkflowDefinition> {
  const { workflow_definition } =
    await api.put<WorkflowDefinitionResponse>(
      `/api/v1/manage/workflow_definitions/${id}`,
      payload
    );
  return workflow_definition;
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
  const { step } = await api.post<WorkflowStepResponse>(
    `/api/v1/manage/workflow_definitions/${definitionId}/steps`,
    payload
  );
  return step;
}

export async function updateWorkflowStep(
  definitionId: string,
  stepId: string,
  payload: Partial<CreateStepRequest>
): Promise<WorkflowStep> {
  const { step } = await api.put<WorkflowStepResponse>(
    `/api/v1/manage/workflow_definitions/${definitionId}/steps/${stepId}`,
    payload
  );
  return step;
}

export async function deleteWorkflowStep(
  definitionId: string,
  stepId: string
): Promise<void> {
  await api.delete<void>(
    `/api/v1/manage/workflow_definitions/${definitionId}/steps/${stepId}`
  );
}
