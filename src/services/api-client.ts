import { tokens } from "@/lib/tokens";
import { getApiBaseUrl } from "@/lib/tenant";
import type { ApiError } from "@/types";

function getBaseUrl(): string {
  if (typeof window === "undefined") return "";
  return getApiBaseUrl(window.location.hostname);
}

async function refreshTokens(): Promise<boolean> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/v1/auth/refresh`, {
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
  const url = `${getBaseUrl()}${path}`;
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

  const data = await response.json();

  if (!response.ok) {
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
