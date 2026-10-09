import { API_BASE_URL } from "../config";
import { ApiError, type FieldErrors } from "./error";
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
interface ApiErrorResponse {
  success: false;
  error: { code: string; message: string; details?: unknown };
  requestId: string;
}
interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | undefined>;
  signal?: AbortSignal;
  token?: string;
}
function buildUrl(
  path: string,
  query?: Record<string, string | undefined>,
): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return url.toString();
}
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const json = (await response.json().catch(() => null)) as
    ApiSuccessResponse<T> | ApiErrorResponse | null;

  if (!response.ok || !json?.success) {
    const details =
      json && !json.success
        ? (json.error.details as FieldErrors | undefined)
        : undefined;
    throw new ApiError(
      response.status,
      json && !json.success ? json.error.code : "UNKNOWN_ERROR",
      (json && !json.success && json.error.message) ||
        "Something went wrong. Please try again.",
      details,
    );
  }

  return json.data;
}
