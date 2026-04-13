"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { tokens } from "@/lib/tokens";
import { decodeJwt } from "@/lib/jwt";
import { getCurrentTenant, logout as logoutApi } from "@/services/auth-service";
import type { User, Tenant } from "@/types";

interface AuthState {
  user: Pick<User, "id" | "role"> | null;
  tenant: Tenant | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tenant: null,
    loading: true,
    isAuthenticated: false,
  });

  const refreshAuth = useCallback(async () => {
    const accessToken = tokens.getAccess();
    if (!accessToken) {
      setState({ user: null, tenant: null, loading: false, isAuthenticated: false });
      return;
    }

    try {
      const payload = decodeJwt(accessToken);
      if (!payload) {
        tokens.clear();
        setState({ user: null, tenant: null, loading: false, isAuthenticated: false });
        return;
      }

      const user = { id: payload.user_id, role: payload.role };
      let tenant: Tenant | null = null;

      try {
        tenant = await getCurrentTenant();
      } catch {
        // Tenant fetch may fail if API is down — still set user from token
      }

      setState({ user, tenant, loading: false, isAuthenticated: true });
    } catch {
      tokens.clear();
      setState({ user: null, tenant: null, loading: false, isAuthenticated: false });
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  return (
    <AuthContext.Provider value={{ ...state, refreshAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
