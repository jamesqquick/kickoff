import { env } from "cloudflare:workers";

// Lazy singleton — created on first request so the env binding is available.
// Mirrors the pattern used in lib/db.ts and lib/auth.ts.
let _email: SendEmail | null = null;

export function getEmailSender(): SendEmail {
  if (!_email) {
    _email = env.EMAIL;
  }
  return _email;
}
