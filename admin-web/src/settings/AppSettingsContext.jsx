import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';

const AppSettingsContext = createContext(null);

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    return api.get('/api/admin/settings')
      .then((data) => { setSettings(data); setError(null); return data; })
      .catch((e) => { setError(e.message || "Sozlamalarni yuklab bo'lmadi"); throw e; });
  }, []);

  useEffect(() => { refresh().catch(() => {}); }, [refresh]);

  return (
    <AppSettingsContext.Provider value={{ settings, error, refresh, walletEnabled: settings?.walletEnabled ?? false }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
}
