import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const ProtectedRoute = ({ children, staffOnly = false }) => {
  const { isAuthenticated, isReady, isStaff } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isReady) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>;
  if (staffOnly && !isStaff) return <Navigate to="/dashboard" replace />;
  return children;
};
