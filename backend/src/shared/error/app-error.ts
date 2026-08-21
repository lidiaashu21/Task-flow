import { ErrorCode } from "./error-codes.js";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, ErrorCode.VALIDATION_ERROR, message, details);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(401, ErrorCode.UNAUTHORIZED, message);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError(403, ErrorCode.FORBIDDEN, message);
  }

  static notFound(message = "Not found"): AppError {
    return new AppError(404, ErrorCode.NOT_FOUND, message);
  }

  static conflict(message: string, code: ErrorCode = ErrorCode.CONFLICT): AppError {
    return new AppError(409, code, message);
  }

  static internal(message = "Something went wrong"): AppError {
    return new AppError(500, ErrorCode.INTERNAL_ERROR, message);
  }

  static tooManyRequests(message = "Too many requests — please try again later"): AppError {
    return new AppError(429, ErrorCode.TOO_MANY_REQUESTS, message);
  }
}
