import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { client } from "./config/database.js";
import { logger } from "./lib/logger.js";
import { initSocketServer } from "./realtime/socket.js";

async function start(): Promise<void> {
  try {
    // Verify database connection before starting the API.
    await client`SELECT 1`;

    logger.info("Database connection established");

    const httpServer = createServer(app);

    // Initialize Socket.IO on the same HTTP server.
    initSocketServer(httpServer);

    // Render requires the server to listen on 0.0.0.0.
    httpServer.listen(env.PORT, "0.0.0.0", () => {
      logger.info(`TaskFlow API started successfully on port ${env.PORT}`);
      logger.info(`Health check available at /health`);
      logger.info("Socket.IO listening on the same port");
    });

    httpServer.on("error", (error) => {
      logger.error("HTTP server failed to start", {
        error: error instanceof Error ? error.message : String(error),
      });

      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to start TaskFlow server", {
      error: error instanceof Error ? error.message : String(error),
    });

    process.exit(1);
  }
}

start();
