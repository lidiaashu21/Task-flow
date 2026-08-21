import type { NextFunction, Request, Response } from "express";
import { z, type ZodType } from "zod";
import { AppError } from "../shared/error/app-error.js";

type RequestPart = "body" | "query" | "params";

interface ValidatedRequest {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

export function validate(schema: ZodType, part: RequestPart = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      next(
        AppError.badRequest(
          "Validation failed",
          z.flattenError(result.error).fieldErrors,
        ),
      );
      return;
    }

    const validated =
      (res.locals.validated as ValidatedRequest | undefined) ?? {};

    validated[part] = result.data;

    res.locals.validated = validated;

    // Controllers read directly from req.query/req.body/req.params, so the parsed (and
    // Zod-defaulted/coerced) result needs to land back there too — not just in res.locals.
    // In Express 5, req.query is a prototype getter that re-parses the raw query string on
    // every access (no caching) — mutating what it returns is a no-op. Defining an own property
    // on this request instance shadows that getter for the rest of the request.
    Object.defineProperty(req, part, {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });

    next();
  };
}
