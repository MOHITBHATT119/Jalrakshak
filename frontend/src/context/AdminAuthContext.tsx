import React, { createContext, useContext, useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AdminContextType {
  isAuthenticated: boolean;
  adminRole: string;
  /** Calls POST /auth/login, stores JWT in sessionStorage. Returns error string on failure. */
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  /** The raw JWT — consumed by api.ts interceptor */
  token: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve API base (mirrors api.ts)
// ─────────────────────────────────────────────────────────────────────────────

declare const __API_BASE__: string;
const _API_BASE = (typeof __API_BASE__ !== 'undefined' && __API_BASE__)
  ? `${__API_BASE__}/api/v1`
  : '/api/v1';

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AdminAuthContext = createContext<AdminContextType | undefined>(undefined);

const TOKEN_KEY = 'jalrakshak_admin_token';
const ROLE_KEY  = 'jalrakshak_admin_role';

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(TOKEN_KEY)
  );
  const [adminRole, setAdminRole] = useState<string>(() =>
    sessionStorage.getItem(ROLE_KEY) || ''
  );

  const isAuthenticated = Boolean(token);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${_API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return body?.detail ?? `Login failed (${res.status})`;
      }

      const data = await res.json();
      const jwt: string = data.access_token;

      sessionStorage.setItem(TOKEN_KEY, jwt);
      sessionStorage.setItem(ROLE_KEY, 'Water Administrator');
      setToken(jwt);
      setAdminRole('Water Administrator');
      return null; // success
    } catch (err: any) {
      return err?.message ?? 'Network error — could not reach backend.';
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    setToken(null);
    setAdminRole('');
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, adminRole, login, logout, token }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
