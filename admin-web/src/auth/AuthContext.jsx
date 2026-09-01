import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { getAccessToken, getRefreshToken, saveSession, clearSession } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('unknown'); // unknown | authenticated | unauthenticated
  const [error, setError] = useState(null);

  useEffect(() => {
    const hasToken = Boolean(getAccessToken() && getRefreshToken());
    setStatus(hasToken ? 'authenticated' : 'unauthenticated');
  }, []);

  const login = useCallback(async (phone, password) => {
    setError(null);
    try {
      const result = await api.post('/api/auth/login', { phone, password });
      if (result.role !== 'ADMIN') {
        throw new Error("Bu hisob administrator emas");
      }
      saveSession(result.accessToken, result.refreshToken);
      setStatus('authenticated');
    } catch (e) {
      setError(e.message || "Kirishda xatolik yuz berdi");
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    clearSession();
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
    <AuthContext.Provider value={{ status, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
