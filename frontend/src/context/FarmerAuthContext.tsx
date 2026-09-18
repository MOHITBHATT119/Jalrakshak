import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface FarmerUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  village: string;
  district: string;
  land_area_ha: number;
  primary_crops: string;
  status: string;
  last_active?: string;
  created_at?: string;
  is_demo?: number;
  notes?: string;
}

export interface FarmerSignupData {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  village: string;
  district: string;
  land_area_ha: number;
  primary_crops: string;
}

export interface FarmerContextType {
  farmerUser: FarmerUser | null;
  farmerToken: string | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<string | null>;
  demoLogin: (email?: string) => Promise<string | null>;
  signup: (data: FarmerSignupData) => Promise<string | null>;
  logout: () => void;
  updateProfileLocally: (updates: Partial<FarmerUser>) => void;
}

declare const __API_BASE__: string;
const _API_BASE = (typeof __API_BASE__ !== 'undefined' && __API_BASE__)
  ? `${__API_BASE__}/api/v1`
  : '/api/v1';

const TOKEN_KEY = 'jalrakshak_farmer_token';
const REFRESH_TOKEN_KEY = 'jalrakshak_farmer_refresh_token';
const USER_KEY = 'jalrakshak_farmer_user';

const FarmerAuthContext = createContext<FarmerContextType | undefined>(undefined);

export function FarmerAuthProvider({ children }: { children: React.ReactNode }) {
  const [farmerToken, setFarmerToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );

  const [farmerUser, setFarmerUser] = useState<FarmerUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const isAuthenticated = Boolean(farmerToken && farmerUser);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      fetch(`${_API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setFarmerToken(null);
    setFarmerUser(null);
  }, []);

  // Sync /me on initial load if token exists
  useEffect(() => {
    if (!farmerToken) return;

    fetch(`${_API_BASE}/auth/farmer/me`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    })
      .then(async (res) => {
        if (res.ok) {
          const u = await res.json();
          setFarmerUser(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        } else if (res.status === 401 || res.status === 403) {
          // Token expired or invalid on server
          logout();
        }
      })
      .catch(() => {
        // Network offline, keep cached profile
      });
  }, [farmerToken, logout]);

  const login = useCallback(async (identifier: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${_API_BASE}/auth/farmer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return body?.detail ?? `Login failed (${res.status})`;
      }

      const data = await res.json();
      const token: string = data.access_token;
      const refreshToken: string = data.refresh_token || '';
      const user: FarmerUser = data.user;

      localStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setFarmerToken(token);
      setFarmerUser(user);
      return null;
    } catch (err: any) {
      return err?.message ?? 'Network error — could not reach server.';
    }
  }, []);

  const demoLogin = useCallback(async (email = 'ravi.desai@khet.in'): Promise<string | null> => {
    const err = await login(email, 'farmer123');
    if (err) {
      return login(email, 'Farmer@Secure123');
    }
    return null;
  }, [login]);

  const signup = useCallback(async (data: FarmerSignupData): Promise<string | null> => {
    try {
      const res = await fetch(`${_API_BASE}/auth/farmer/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return body?.detail ?? `Registration failed (${res.status})`;
      }

      const resData = await res.json();
      const token: string = resData.access_token;
      const refreshToken: string = resData.refresh_token || '';
      const user: FarmerUser = resData.user;

      localStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setFarmerToken(token);
      setFarmerUser(user);
      return null;
    } catch (err: any) {
      return err?.message ?? 'Network error — could not register account.';
    }
  }, []);

  const updateProfileLocally = useCallback((updates: Partial<FarmerUser>) => {
    setFarmerUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <FarmerAuthContext.Provider
      value={{
        farmerUser,
        farmerToken,
        isAuthenticated,
        login,
        demoLogin,
        signup,
        logout,
        updateProfileLocally,
      }}
    >
      {children}
    </FarmerAuthContext.Provider>
  );
}

export function useFarmerAuth() {
  const context = useContext(FarmerAuthContext);
  if (context === undefined) {
    throw new Error('useFarmerAuth must be used within a FarmerAuthProvider');
  }
  return context;
}
