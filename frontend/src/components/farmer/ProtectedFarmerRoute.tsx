import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useFarmerAuth } from '../../context/FarmerAuthContext';

interface ProtectedFarmerRouteProps {
  children: React.ReactNode;
}

export const ProtectedFarmerRoute: React.FC<ProtectedFarmerRouteProps> = ({ children }) => {
  const { isAuthenticated } = useFarmerAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/farmer/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedFarmerRoute;
