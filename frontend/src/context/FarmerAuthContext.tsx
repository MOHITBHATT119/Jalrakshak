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
const USER_KEY = 'jalrakshak_farmer_user';

const FarmerAuthContext = createContext<FarmerContextType | undefined>(undefined);

// Fallback demo farmers if backend is completely offline
const DEMO_FALLBACK_FARMERS: Record<string, FarmerUser> = {
  'ravi.desai@khet.in': {
    id: 'U003',
    name: 'Ravi Desai',
    email: 'ravi.desai@khet.in',
    phone: '+91 98250 11003',
    role: 'Farmer',
    village: 'Amreli',
    district: 'Amreli',
    land_area_ha: 4.5,
    primary_crops: 'Cotton, Groundnut',
    status: 'Active',
    is_demo: 1,
    notes: 'Progressive farmer from Amreli',
  },
  'bhavesh.joshi@khet.in': {
    id: 'U007',
    name: 'Bhavesh Joshi',
    email: 'bhavesh.joshi@khet.in',
    phone: '+91 98250 11007',
    role: 'Farmer',
    village: 'Surendranagar',
    district: 'Surendranagar',
    land_area_ha: 6.0,
    primary_crops: 'Groundnut, Wheat',
    status: 'Active',
    is_demo: 1,
    notes: 'Water conservation adopter',
  },
};

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
        } else if (res.status === 401) {
          // Token expired
          logout();
        }
      })
      .catch(() => {
        // Network offline, keep cached profile
      });
  }, [farmerToken]);

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
      const user: FarmerUser = data.user;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setFarmerToken(token);
      setFarmerUser(user);
      return null;
    } catch (err: any) {
      // Offline fallback for demo accounts
      const fallback = DEMO_FALLBACK_FARMERS[identifier.trim().toLowerCase()];
      if (fallback && password === 'farmer123') {
        const fakeToken = `demo_offline_token_${fallback.id}`;
        localStorage.setItem(TOKEN_KEY, fakeToken);
        localStorage.setItem(USER_KEY, JSON.stringify(fallback));
        setFarmerToken(fakeToken);
        setFarmerUser(fallback);
        return null;
      }
      return err?.message ?? 'Network error — could not reach server.';
    }
  }, []);

  const demoLogin = useCallback(async (email = 'ravi.desai@khet.in'): Promise<string | null> => {
    return login(email, 'farmer123');
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
      const user: FarmerUser = resData.user;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setFarmerToken(token);
      setFarmerUser(user);
      return null;
    } catch (err: any) {
      // Offline mock signup
      const newUser: FarmerUser = {
        id: `U_${Date.now().toString().slice(-4)}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'Farmer',
        village: data.village,
        district: data.district,
        land_area_ha: data.land_area_ha,
        primary_crops: data.primary_crops,
        status: 'Active',
        is_demo: 0,
        notes: 'Locally registered (offline mode)',
      };
      const fakeToken = `local_token_${newUser.id}`;
      localStorage.setItem(TOKEN_KEY, fakeToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setFarmerToken(fakeToken);
      setFarmerUser(newUser);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setFarmerToken(null);
    setFarmerUser(null);
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
