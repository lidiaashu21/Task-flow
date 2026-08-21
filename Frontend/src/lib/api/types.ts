export interface FetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | undefined>;
  signal?: AbortSignal;
}

/** An authenticated request function bound to the current session — see `AuthProvider.fetcher`. */
export type Fetcher = <T>(path: string, options?: FetchOptions) => Promise<T>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
