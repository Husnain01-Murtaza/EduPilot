import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, token, initialized, isLoading, fetchCurrentUser, logout } = useAuthStore();

  useEffect(() => {
    if (token && !user && !initialized) fetchCurrentUser();
  }, [token, user, initialized, fetchCurrentUser]);

  return {
    user,
    token,
    logout,
    isAuthenticated: !!token,
    isReady: initialized && (!token || !!user),
    isLoading,
    isStaff: user?.role === 'admin' || user?.role === 'super_admin',
  };
};
