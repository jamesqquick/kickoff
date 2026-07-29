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
import { getDb } from "@/lib/db";
import { TeamMemberRepository } from "@/repositories/team-member-repository";
import { sendPasswordReset } from "@/lib/email";

// Extends Better Auth's base User with our custom additionalFields.
// Use this everywhere instead of `User` from "better-auth" + a cast.
// admin — platform-level superuser (assigned manually, never self-selected).
// referee — match official (assigned manually, never self-selected).
// user — default for all sign-ups; team ownership determines coach permissions.
// Platform-level role. "admin" = unscoped superuser. "user" = everyone else.
// The referee value is retained in the DB for legacy rows but unused in new logic.
export type UserRole = "admin" | "user";

export interface AppUser extends User {
  role: UserRole;
  isCoach: boolean;
  isDirector: boolean;
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
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordReset({ to: user.email, resetUrl: url });
      },
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
          input: false, // never set from raw user input; set by sign-up route or admin
        },
        isCoach: {
          type: "boolean",
          defaultValue: false,
          input: false, // set via two-step sign-up: signUpEmail() then updateUser()
        },
        isDirector: {
          type: "boolean",
          defaultValue: false,
          input: false, // set via two-step sign-up or when accepting a manager invite
        },
      },
    },
    databaseHooks: {
      session: {
        create: {
          // After every sign-in or sign-up, claim any pending_signup roster entries
          // whose email matches the newly authenticated user. This is what connects
          // an imported roster entry to a real user account.
          after: async (session) => {
            try {
              const db = getDb();
              const user = await db.$client
                .prepare("SELECT email FROM user WHERE id = ?")
                .bind(session.userId)
                .first<{ email: string }>();
              if (!user?.email) return;
              await new TeamMemberRepository(db).claimByEmail(user.email, session.userId);
            } catch (err) {
              // Non-fatal — log but never break sign-in
              console.error("[auth] Error claiming roster entries on session create:", err);
            }
          },
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
