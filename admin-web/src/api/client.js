const TOKEN_KEY = 'ishchi_admin_access_token';
const REFRESH_KEY = 'ishchi_admin_refresh_token';

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function saveSession(accessToken, refreshToken) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('refresh failed');
        const data = await res.json();
        saveSession(data.accessToken, data.refreshToken);
        return data.accessToken;
      })
      .catch(() => {
        clearSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(method, path, { body, query, isForm, retry = true } = {}) {
  const url = new URL(path, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }

  const headers = {};
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 401 && retry && path !== '/api/auth/refresh') {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request(method, path, { body, query, isForm, retry: false });
    }
    clearSession();
    window.location.hash = '#/login';
    throw new ApiError("Sessiya muddati tugadi", 401);
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = data?.message || "Noma'lum xatolik yuz berdi";
    throw new ApiError(message, res.status, data?.fieldErrors);
  }

  return data;
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body) => request('POST', path, { body }),
  postForm: (path, formData) => request('POST', path, { body: formData, isForm: true }),
  patch: (path, body) => request('PATCH', path, { body }),
  patchForm: (path, formData) => request('PATCH', path, { body: formData, isForm: true }),
  del: (path) => request('DELETE', path, {}),
};
