import type { RequestHandler } from "express";

/**
 * Rate limiters converted to pass-through to remove all rate-limiting restrictions
 * on API calls, login, registration, and password recovery.
 */
export const apiRateLimiter: RequestHandler = (_req, _res, next) => {
  next();
};

export const authRateLimiter: RequestHandler = (_req, _res, next) => {
  next();
};
