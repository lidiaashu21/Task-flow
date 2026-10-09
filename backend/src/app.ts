import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import { corsOptions } from "./config/cors.js";
import { apiRoutes } from "./routes/index.js";
import { requestId } from "./middleware/request-id.middleware.js";
import { apiRateLimiter } from "./middleware/rate-limit.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

export const app = express();

app.use(requestId);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Root endpoint: confirms that the API server is running.
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskFlow API is running",
  });
});

// Health-check endpoint.
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// API endpoints.
app.use("/api", apiRateLimiter, apiRoutes);

// Keep these middleware at the end.
app.use(notFoundMiddleware);
app.use(errorMiddleware);
