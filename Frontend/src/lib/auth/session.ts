const ACCESS_TOKEN_KEY = "taskflow.accessToken";

/**
 * Access tokens are short-lived and only ever read client-side (sent as a Bearer header), so
 * localStorage is fine here — the long-lived refresh token lives in an httpOnly cookie instead.
 */
export function saveAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}
