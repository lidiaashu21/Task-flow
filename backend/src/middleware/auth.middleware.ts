import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { AppError } from "../shared/error/app-error.js";

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/** Case-insensitive scheme match, tolerant of extra whitespace — `Authorization: Bearer <token>`. */
function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;

  const [scheme, ...rest] = header.trim().split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== "bearer") return null;

  const token = rest.join(" ").trim();
  return token.length > 0 ? token : null;
}

/** Requires a valid `Authorization: Bearer <token>` header and attaches `req.user`. */
export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    next(AppError.unauthorized("Missing or invalid Authorization header"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(AppError.unauthorized("Invalid or expired access token"));
  }
}
