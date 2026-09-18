import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AdminContextType {
  isAuthenticated: boolean;
  adminRole: string;
  adminUsername: string;
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
const REFRESH_TOKEN_KEY = 'jalrakshak_admin_refresh_token';
const ROLE_KEY  = 'jalrakshak_admin_role';
const USERNAME_KEY = 'jalrakshak_admin_username';

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(TOKEN_KEY)
  );
  const [adminRole, setAdminRole] = useState<string>(() =>
    sessionStorage.getItem(ROLE_KEY) || ''
  );
  const [adminUsername, setAdminUsername] = useState<string>(() =>
    sessionStorage.getItem(USERNAME_KEY) || ''
  );

  const isAuthenticated = Boolean(token);

  const logout = useCallback(() => {
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      fetch(`${_API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {});
    }
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
    setToken(null);
    setAdminRole('');
    setAdminUsername('');
  }, []);

  // Validate active JWT against GET /auth/me on mount or token change
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    fetch(`${_API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!isMounted) return;
        if (res.ok) {
          const profile = await res.json();
          const serverRole = profile.role || 'Water Administrator';
          const username = profile.username || profile.id || 'admin';
          setAdminRole(serverRole);
          setAdminUsername(username);
          sessionStorage.setItem(ROLE_KEY, serverRole);
          sessionStorage.setItem(USERNAME_KEY, username);
        } else if (res.status === 401 || res.status === 403) {
          // Token expired or invalid on server
          logout();
        }
      })
      .catch(() => {
        // Network offline, keep existing session state
      });

    return () => { isMounted = false; };
  }, [token, logout]);

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
      const refreshToken: string = data.refresh_token || '';

      sessionStorage.setItem(TOKEN_KEY, jwt);
      if (refreshToken) {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }

      // Fetch verified identity from /auth/me
      const meRes = await fetch(`${_API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (meRes.ok) {
        const profile = await meRes.json();
        const role = profile.role || 'Water Administrator';
        const user = profile.username || username;
        sessionStorage.setItem(ROLE_KEY, role);
        sessionStorage.setItem(USERNAME_KEY, user);
        setAdminRole(role);
        setAdminUsername(user);
      } else {
        sessionStorage.setItem(ROLE_KEY, 'Water Administrator');
        setAdminRole('Water Administrator');
      }

      setToken(jwt);
      return null; // success
    } catch (err: any) {
      return err?.message ?? 'Network error — could not reach backend.';
    }
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, adminRole, adminUsername, login, logout, token }}>
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
