import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "./schema";

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

// Lazy singleton — created on first request so the env binding is available.
// Mirrors the pattern used in lib/auth.ts.
let _db: AppDatabase | null = null;

export function getDb(): AppDatabase {
  if (!_db) {
    _db = drizzle(env.DB, { schema });
  }
  return _db;
}
