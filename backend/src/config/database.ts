import postgres from "postgres";
import { env, isProduction } from "./env.js";

export const client = postgres(env.DATABASE_URL, {
  max: isProduction ? 10 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: isProduction ? "require" : false,

  ...(isProduction ? { onnotice: () => {} } : {}),
});

export async function closeDatabaseConnection(): Promise<void> {
  await client.end({ timeout: 5 });
}
