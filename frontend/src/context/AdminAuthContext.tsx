import React, { createContext, useContext, useState } from 'react';

interface AdminContextType {
  isAuthenticated: boolean;
  adminRole: string;
  login: () => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('adminAuthenticated') === 'true';
  });
  
  const [adminRole, setAdminRole] = useState<string>(() => {
    return localStorage.getItem('adminRole') || '';
  });

  const login = () => {
    setIsAuthenticated(true);
    setAdminRole('Water Administrator');
    localStorage.setItem('adminAuthenticated', 'true');
    localStorage.setItem('adminRole', 'Water Administrator');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminRole('');
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminRole');
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, adminRole, login, logout }}>
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
