import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!authService.isAuthenticated()) { setLoading(false); return; }
    try {
      const u = await userService.getMe();
      setUser(u);
    } catch {
      localStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (email, password) => {
    await authService.login(email, password);
    await fetchUser();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = () => fetchUser();

  return { user, loading, login, logout, refreshUser, isAuthenticated: !!user };
}
