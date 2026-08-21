import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

try {
  const database = await sql`
    SELECT
      current_database() AS database,
      current_user AS user,
      current_schema() AS schema
  `;

  const extension = await sql`
    SELECT
      extname,
      extnamespace::regnamespace AS schema
    FROM pg_extension
    WHERE extname = 'citext'
  `;

  const type = await sql`
    SELECT
      n.nspname AS schema_name,
      t.typname AS type_name
    FROM pg_type t
    JOIN pg_namespace n
      ON n.oid = t.typnamespace
    WHERE t.typname = 'citext'
  `;

  console.log("DATABASE:");
  console.table(database);

  console.log("CITEXT EXTENSION:");
  console.table(extension);

  console.log("CITEXT TYPE:");
  console.table(type);
} catch (error) {
  console.error("ERROR:", error);
} finally {
  await sql.end();
}