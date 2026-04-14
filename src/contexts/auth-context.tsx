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
import {
  setPermissions,
  clearPermissions,
  can,
  canWithScope,
  canAccessModule,
  getScope,
} from "@/lib/permissions";
import { getMe, logout as logoutApi } from "@/services/auth-service";
import { getSetupStatus } from "@/services/tenant-service";
import type { User, Tenant } from "@/types";

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  isAuthenticated: boolean;
  setupRequired: boolean;
}

interface AuthContextValue extends AuthState {
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
  can: (resource: string, action: string) => boolean;
  canWithScope: (resource: string, action: string, requiredScope: string) => boolean;
  canAccessModule: (resource: string) => boolean;
  getScope: (resource: string, action: string) => string | null;
}

const UNAUTHENTICATED: AuthState = {
  user: null,
  tenant: null,
  loading: false,
  isAuthenticated: false,
  setupRequired: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ...UNAUTHENTICATED,
    loading: true,
  });

  const refreshAuth = useCallback(async () => {
    const accessToken = tokens.getAccess();
    if (!accessToken) {
      clearPermissions();
      setState(UNAUTHENTICATED);
      return;
    }

    try {
      const { user, tenant } = await getMe();
      setPermissions(user.permissions);

      let setupRequired = false;
      try {
        const setupStatus = await getSetupStatus();
        setupRequired = setupStatus.setup_required;
      } catch {
        // If setup_status fails (e.g. non-admin), treat as not required
      }

      setState({ user, tenant, loading: false, isAuthenticated: true, setupRequired });
    } catch {
      tokens.clear();
      clearPermissions();
      setState(UNAUTHENTICATED);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        refreshAuth,
        logout,
        can,
        canWithScope,
        canAccessModule,
        getScope,
      }}
    >
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
