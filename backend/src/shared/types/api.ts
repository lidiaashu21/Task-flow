export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  /** Correlates this response with server-side logs — see `middleware/request-id.middleware.ts`. */
  requestId: string;
}
