import { API_PORT, PYTHON_API_PORT } from "@/lib/constants";
import { tokens } from "@/lib/tokens";
import type { ApiError } from "@/types";

const PYTHON_SERVICES = ["payroll"];

function isPythonService(path: string): boolean {
  const match = path.match(/^\/api\/v1\/([^/]+)/);
  return match ? PYTHON_SERVICES.includes(match[1]) : false;
}

function getBackendBaseUrl(path: string): string {
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = isPythonService(path) ? PYTHON_API_PORT : API_PORT;
  return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
}

async function refreshTokens(): Promise<boolean> {
  try {
    const baseUrl = getBackendBaseUrl("/api/v1/auth/refresh");
    const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: tokens.getRefresh() }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    tokens.set(data.tokens);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBackendBaseUrl(path);
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const accessToken = tokens.getAccess();
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && tokens.getRefresh()) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${tokens.getAccess()}`;
      response = await fetch(url, { ...options, headers });
    } else {
      tokens.clear();
      window.location.href = "/login";
      throw { status: 401, error: "Session expired" } as ApiError;
    }
  }

  const data = response.status === 204 || response.status === 205 ? undefined : await response.json();

  if (!response.ok) {
    if (response.status === 403 && data.error === "Organization setup required") {
      window.location.href = "/setup";
      throw { status: 403, error: data.error } as ApiError;
    }

    const error: ApiError = { status: response.status, ...data };
    throw error;
  }

  return data as T;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
};
