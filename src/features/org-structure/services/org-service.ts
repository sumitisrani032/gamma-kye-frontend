import { api } from "@/services/api-client";
import type { EmployeeDetail, OrgNode } from "@/types";

/**
 * Fetch all employees as flat OrgNode list with reporting_manager_id.
 *
 * Uses /employees directory (shows ALL employees to all users) for the list,
 * then fetches detail per employee for reporting_manager data.
 */

interface EmployeeDetailResponse {
  employee: EmployeeDetail;
}

const BATCH_SIZE = 10;

function toOrgNode(detail: EmployeeDetail): OrgNode {
  return {
    id: detail.id,
    employee_number: detail.employee_number,
    first_name: detail.first_name,
    last_name: detail.last_name,
    full_name: detail.full_name,
    email_official: detail.email_official,
    designation: detail.designation,
    department: detail.department,
    profile_photo_url: detail.profile_photo_url,
    reporting_manager_id: detail.reporting_manager?.id ?? null,
  };
}

/** Fetch employee detail from directory endpoint (available to all authenticated users). */
async function fetchDetail(id: string): Promise<EmployeeDetail> {
  const data = await api.get<EmployeeDetailResponse>(`/api/v1/employees/${id}`);
  return data.employee;
}

/** Fetch all employee IDs from directory (shows ALL employees, not scoped by role). */
async function fetchEmployeeIds(): Promise<string[]> {
  const data = await api.get<{ employees: { id: string }[] }>("/api/v1/employees");
  return data.employees.map((e) => e.id);
}

/** Fetch details in batches to avoid overwhelming the server. */
async function batchFetchDetails(ids: string[]): Promise<OrgNode[]> {
  const nodes: OrgNode[] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(fetchDetail));
    nodes.push(...results.map(toOrgNode));
  }
  return nodes;
}

/** Fetch the full org flat list for tree building. */
export async function getOrgFlatList(): Promise<OrgNode[]> {
  const ids = await fetchEmployeeIds();
  return batchFetchDetails(ids);
}

/** Fetch a single employee's detail as OrgNode. */
export async function getEmployeeOrgNode(id: string): Promise<OrgNode> {
  const detail = await fetchDetail(id);
  return toOrgNode(detail);
}

/** Fetch "My Team" data for a given employee ID. */
export async function getMyTeam(employeeId: string): Promise<{
  me: OrgNode;
  manager: OrgNode | null;
  peers: OrgNode[];
  directReports: OrgNode[];
}> {
  // 1. Fetch my detail
  const meDetail = await fetchDetail(employeeId);
  const me = toOrgNode(meDetail);

  // 2. Fetch manager (if exists)
  let manager: OrgNode | null = null;
  if (meDetail.reporting_manager) {
    const mgrDetail = await fetchDetail(meDetail.reporting_manager.id);
    manager = toOrgNode(mgrDetail);
  }

  // 3. Fetch all employees to find peers (same manager) and direct reports
  const allIds = await fetchEmployeeIds();
  const allNodes = await batchFetchDetails(allIds);

  const peers = allNodes.filter(
    (n) => n.reporting_manager_id === me.reporting_manager_id && n.id !== me.id
  );

  const directReports = allNodes.filter(
    (n) => n.reporting_manager_id === me.id
  );

  return { me, manager, peers, directReports };
}
