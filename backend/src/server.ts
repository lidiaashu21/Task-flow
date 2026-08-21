import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { client } from "./config/database.js";
import { logger } from "./lib/logger.js";
import { initSocketServer } from "./realtime/socket.js";

async function start(): Promise<void> {
  try {
    await client`select 1`;

    logger.info("Database connection established");
  } catch (error) {
    logger.error("Failed to connect to the database", {
      error: (error as Error).message,
    });

    process.exit(1);
  }

  const httpServer = createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`TaskFlow API started successfully on port ${env.PORT}`);
    logger.info(`Health check: http://localhost:${env.PORT}/health`);
    logger.info(`Socket.IO listening on the same port`);
  });
}

start();
