export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
}

export interface RegisterTenantRequest {
  tenant: {
    name: string;
    subdomain: string;
    plan: string;
  };
  user: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name: string;
    last_name: string;
  };
}

export interface AuthResponse {
  user: User;
  tenant: Tenant;
  tokens: AuthTokens;
}

export interface TenantCheckResponse {
  exists: boolean;
  status?: string;
}

export interface ApiError {
  status: number;
  error?: string;
  errors?: Record<string, string[]>;
}
