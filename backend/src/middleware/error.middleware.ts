import type { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/error/app-error.js";
import { ErrorCode } from "../shared/error/error-codes.js";
import { logger } from "../lib/logger.js";
import type { ApiErrorResponse } from "../shared/types/api.js";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Print the REAL error in the VS Code terminal
  console.error("\n========================================");
  console.error("🔥 SERVER ERROR");
  console.error("========================================");
  console.error("Request:", req.method, req.originalUrl);
  console.error("Request ID:", req.id);

  if (err instanceof Error) {
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
  } else {
    console.error("Unknown error:", err);
  }

  console.error("========================================\n");

  // Handle known application errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, {
        requestId: req.id,
        path: req.path,
        stack: err.stack,
      });
    }

    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      requestId: req.id,
    };

    res.status(err.statusCode).json(body);
    return;
  }

  // Handle unknown errors
  const error = err instanceof Error ? err : new Error("Unknown server error");

  logger.error(error.message, {
    requestId: req.id,
    path: req.path,
    stack: error.stack,
  });

  // TEMPORARY DEBUG RESPONSE
  // This exposes the real error so we can find the Google OAuth problem.
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message,
    },
    requestId: req.id,
  };

  res.status(500).json(body);
}
