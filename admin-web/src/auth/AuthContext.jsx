import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { getAccessToken, getRefreshToken, saveSession, clearSession } from '../api/client.js';

const AuthContext = createContext(null);

const ROLE_KEY = 'ishchi_admin_role';

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('unknown'); // unknown | authenticated | unauthenticated
  const [role, setRole] = useState(localStorage.getItem(ROLE_KEY) || null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const hasToken = Boolean(getAccessToken() && getRefreshToken());
    setStatus(hasToken ? 'authenticated' : 'unauthenticated');
    setRole(localStorage.getItem(ROLE_KEY));
  }, []);

  const login = useCallback(async (phone, password) => {
    setError(null);
    try {
      const result = await api.post('/api/auth/login', { phone, password });
      if (result.role !== 'ADMIN' && result.role !== 'OPERATOR') {
        throw new Error("Bu hisob administrator yoki operator emas");
      }
      saveSession(result.accessToken, result.refreshToken);
      localStorage.setItem(ROLE_KEY, result.role);
      setRole(result.role);
      setStatus('authenticated');
    } catch (e) {
      setError(e.message || "Kirishda xatolik yuz berdi");
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    clearSession();
    localStorage.removeItem(ROLE_KEY);
    setRole(null);
    setStatus('unauthenticated');
    if (refreshToken) {
      try {
        await api.post('/api/auth/logout', { refreshToken });
      } catch {
        // best-effort
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ status, role, isOperator: role === 'OPERATOR', isAdmin: role === 'ADMIN', error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
