import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('staffsync_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // initial session check

  const logout = useCallback(() => {
    localStorage.removeItem('staffsync_token');
    setToken('');
    setUser(null);
  }, []);

  // Listen for global 401 events from the api interceptor
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('staffsync:unauthorized', handler);
    return () => window.removeEventListener('staffsync:unauthorized', handler);
  }, [logout]);

  // Rehydrate session on mount / token change
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    authAPI.getMe()
      .then((res) => {
        if (res.data.success) setUser(res.data.user);
        else logout();
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { token: t, user: u } = res.data;
    localStorage.setItem('staffsync_token', t);
    setToken(t);
    setUser(u);
    return u;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register(name, email, password);
    const { token: t, user: u } = res.data;
    localStorage.setItem('staffsync_token', t);
    setToken(t);
    setUser(u);
    return u;
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
