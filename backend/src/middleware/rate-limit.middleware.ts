import rateLimit from "express-rate-limit";
import { AppError } from "../shared/error/app-error.js";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/** General ceiling for the whole API — generous enough to never bother a normal client. */
export const apiRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests());
  },
});

/**
 * Tighter limit for credential- and email-sending endpoints (login, register, password reset,
 * resend-verification) — the actual brute-force/spam surface, so it gets a stricter budget
 * than the rest of the API.
 */
export const authRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests("Too many attempts — please wait a few minutes and try again"));
  },
});
