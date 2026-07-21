import { betterAuth } from "better-auth";
import type { User } from "better-auth";
import { D1Dialect } from "kysely-d1";
import { env } from "cloudflare:workers";
import {
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from "astro:env/server";

// Extends Better Auth's base User with our custom additionalFields.
// Use this everywhere instead of `User` from "better-auth" + a cast.
// admin — platform-level superuser (assigned manually, never self-selected).
// referee — match official (assigned manually, never self-selected).
// user — default for all sign-ups; team ownership determines coach permissions.
export type UserRole = "admin" | "referee" | "user";
export interface AppUser extends User {
  role: UserRole;
}

// Extracted so TypeScript can infer the full return type, including
// additionalFields inference, without an `any` cast on the singleton.
function createAuth() {
  return betterAuth({
    database: new D1Dialect({ database: env.DB }),
    secret: BETTER_AUTH_SECRET,
    baseURL: BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: true,
          defaultValue: "user",
          input: false, // role is never accepted from user input
        },
      },
    },
  });
}

// Lazy singleton — created on first request so env bindings are available.
let _auth: ReturnType<typeof createAuth> | null = null;

export function getAuth(): ReturnType<typeof createAuth> {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}
