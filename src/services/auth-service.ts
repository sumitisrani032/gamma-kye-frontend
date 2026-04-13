import { api } from "./api-client";
import { tokens } from "@/lib/tokens";
import { getMainDomainUrl } from "@/lib/tenant";
import type {
  AuthResponse,
  LoginRequest,
  RegisterTenantRequest,
  RegisterUserRequest,
  Tenant,
} from "@/types";

export async function registerTenant(payload: RegisterTenantRequest): Promise<AuthResponse> {
  const baseUrl = getMainDomainUrl();

  const response = await fetch(`${baseUrl}/api/v1/auth/register/tenant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw { status: response.status, ...data };
  }

  tokens.set(data.tokens);
  return data as AuthResponse;
}

export async function registerUser(payload: RegisterUserRequest): Promise<AuthResponse> {
  const data = await api.post<AuthResponse>("/api/v1/auth/register/user", {
    user: payload,
  });
  tokens.set(data.tokens);
  return data;
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const data = await api.post<AuthResponse>("/api/v1/auth/login", payload);
  tokens.set(data.tokens);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await api.delete("/api/v1/auth/logout", {
      refresh_token: tokens.getRefresh(),
    });
  } finally {
    tokens.clear();
    window.location.href = "/login";
  }
}

export async function getCurrentTenant(): Promise<Tenant> {
  return api.get<Tenant>("/api/v1/tenant");
}
