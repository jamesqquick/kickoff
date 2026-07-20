/// <reference path="../.astro/types.d.ts" />
/// <reference path="../worker-configuration.d.ts" />

declare namespace App {
  interface Locals {
    user: import("@/lib/auth").AppUser | null;
    session: import("better-auth").Session | null;
  }
}
