import { useAuthStore } from '../stores/authStore';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; success: boolean }> {
  const token = useAuthStore.getState().accessToken;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  // Don't logout on rate limit (429) – only on auth failure (401)
  if (res.status === 429) {
    return { success: false, error: json.error ?? 'Too many requests. Please try again in a few minutes.' };
  }

  if (res.status === 401 && token) {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      const refreshRes = await fetch(`${BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const refreshJson = await refreshRes.json();
      if (refreshJson.success && refreshJson.data?.accessToken) {
        useAuthStore.getState().setTokens(refreshJson.data.accessToken);
        return request(path, options);
      }
    }
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined') window.location.href = '/login';
  }

  if (!res.ok) {
    return { success: false, error: json.error ?? res.statusText };
  }
  return { success: true, data: json.data ?? json };
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
