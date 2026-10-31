/**
 * Utility cung cấp Authorization Header chứa JWT Token cho mọi request gọi tới Backend
 */
export function getAuthHeaders(): Record<string, string> {
  try {
    const directToken = localStorage.getItem('aaa_jwt_token');
    if (directToken && directToken.trim()) {
      return { Authorization: `Bearer ${directToken.trim()}` };
    }
    const raw = localStorage.getItem('aaa_admin_auth') || sessionStorage.getItem('aaa_admin_auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.token && parsed.token.trim()) {
        return { Authorization: `Bearer ${parsed.token.trim()}` };
      }
    }
  } catch {
    // ignore
  }
  return {};
}

/**
 * Wrapper cho fetch tự động gắn Authorization Header
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  const authHeaders = getAuthHeaders();
  for (const [key, val] of Object.entries(authHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, val);
    }
  }
  return fetch(input, {
    ...init,
    headers,
  });
}
