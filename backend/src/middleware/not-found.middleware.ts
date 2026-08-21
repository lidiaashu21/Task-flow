import type { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/error/app-error.js";

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
