import { Pool } from "pg";

declare global {
  var __realtaiPgPool: Pool | undefined;
}

export function getPostgresPool() {
  if (!globalThis.__realtaiPgPool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("Falta la variable de entorno DATABASE_URL");
    }

    globalThis.__realtaiPgPool = new Pool({
      connectionString,
      ssl: false,
    });
  }

  return globalThis.__realtaiPgPool;
}
