import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ishchi_admin_theme';

/** 'light' | 'dark' | null (follow the operating system) */
function storedPreference() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    // A private window can refuse storage; following the OS is a fine fallback.
    return null;
  }
}

function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

/**
 * Light/dark switch for the panel.
 *
 * The mobile app has had theme settings for a while, including a user-picked accent; the admin
 * panel was light-only, which is the one place the two surfaces disagreed. Follows the operating
 * system until the admin picks a side, and remembers the choice per browser.
 */
export default function ThemeToggle() {
  const [preference, setPreference] = useState(storedPreference);

  useEffect(() => {
    applyTheme(preference ?? (systemPrefersDark() ? 'dark' : 'light'));
    if (preference) return undefined;

    // Still following the OS, so track it live.
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return undefined;
    const onChange = (event) => applyTheme(event.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference]);

  const isDark = (preference ?? (systemPrefersDark() ? 'dark' : 'light')) === 'dark';

  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    setPreference(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembering the choice is better than failing to apply it.
    }
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? "Yorug' mavzuga o'tish" : "Qorong'i mavzuga o'tish"}
      title={isDark ? "Yorug' mavzu" : "Qorong'i mavzu"}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
