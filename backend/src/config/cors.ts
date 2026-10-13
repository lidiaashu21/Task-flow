import type { CorsOptions } from "cors";
import { env } from "./env.js";

export const allowedOrigins = [
  "https://task-flow-2dju-ochre.vercel.app",
  "https://task-flow-nt2m.vercel.app",
  "http://localhost:3000",

  "https://hoppscotch.io",
  ...(env.FRONTEND_URL ? [env.FRONTEND_URL] : []),
];

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const normalizedOrigin = origin.replace(/\/+$/, "");

  if (
    allowedOrigins.some(
      (allowed) => allowed.replace(/\/+$/, "") === normalizedOrigin,
    )
  ) {
    return true;
  }

  // Support Vercel deployment preview URLs for task-flow
  if (/^https:\/\/task-flow-[a-z0-9-]+\.vercel\.app$/.test(normalizedOrigin)) {
    return true;
  }

  return false;
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cookie",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Set-Cookie"],
};
