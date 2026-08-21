export type FieldErrors = Record<string, string[] | undefined>;

/** Mirrors the backend's `ApiErrorResponse` envelope — see `shared/types/api.ts` in the API. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldErrors | undefined;

  constructor(status: number, code: string, message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}
