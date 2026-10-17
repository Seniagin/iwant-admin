/**
 * The admin session: a token from `POST /admin/auth/login`, kept in
 * localStorage, sent with every request to the API.
 *
 * The services call `fetch` directly in dozens of places, so instead of
 * threading a header through each, `installAdminFetch` wraps `window.fetch`
 * once: requests to the API get the Authorization header, and a 401 from it
 * ends the session (the app then shows the sign-in page).
 */
const TOKEN_KEY = 'iwant.adminToken';
export const ADMIN_LOGOUT_EVENT = 'iwant:admin-logout';

const API_URL = process.env.REACT_APP_API_URL ?? '';

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode: the session lasts as long as the tab */
  }
  if (!token) window.dispatchEvent(new Event(ADMIN_LOGOUT_EVENT));
}

export async function adminLogin(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(typeof message === 'string' && message ? message : `Sign-in failed (HTTP ${res.status})`);
  }
  setAdminToken(body.token);
}

let installed = false;

export function installAdminFetch(): void {
  if (installed || !API_URL) return;
  installed = true;
  const original = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith(API_URL)) return original(input, init);

    const token = getAdminToken();
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

    const res = await original(input, { ...init, headers });
    if (res.status === 401 && !url.endsWith('/admin/auth/login')) setAdminToken(null);
    return res;
  };
}
