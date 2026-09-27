import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ToastContext = createContext(null);

let nextId = 1;

/**
 * One place for "saved", "deleted" and "that failed".
 *
 * Each page used to render its own inline message in its own position, so the same outcome looked
 * different from page to page, and a confirmation at the bottom of a long form was easy to miss.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((message, tone = 'info') => {
    const id = nextId++;
    setToasts((current) => [...current, { id, message, tone }]);
    return id;
  }, []);

  const api = useMemo(
    () => ({
      show,
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    // Errors stay until dismissed: they usually need reading twice, and often acting on.
    if (toast.tone === 'error') return undefined;
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className={`toast toast-${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        className="toast-dismiss"
        onClick={() => onDismiss(toast.id)}
        aria-label="Yopish"
      >
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
}
