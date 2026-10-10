import type { CorsOptions } from "cors";
import { env } from "./env.js";

const allowedOrigins = [
  "http://localhost:3000",
  env.FRONTEND_URL,
  "https://hoppscotch.io",
];

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
