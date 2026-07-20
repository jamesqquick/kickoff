// Stub for the cloudflare:workers virtual module used by lib/db.ts and lib/auth.ts.
// Only imported in the Vitest Node environment — never bundled for production.
export const env = {} as Record<string, unknown>;
