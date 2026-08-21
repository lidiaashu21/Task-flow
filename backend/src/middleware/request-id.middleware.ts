import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      /** Per-request correlation ID — reused from an inbound `X-Request-Id` header if present. */
      id: string;
    }
  }
}

const REQUEST_ID_HEADER = "x-request-id";

/**
 * Attaches a correlation ID to every request before anything else runs, so it's available
 * to the error handler's logs and to the client for support/bug reports. Must be the first
 * middleware registered.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const inbound = req.headers[REQUEST_ID_HEADER];
  req.id = typeof inbound === "string" && inbound.length > 0 ? inbound : randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
}
