import { EMAIL_FROM_ADDRESS, EMAIL_SENDING_ENABLED } from "astro:env/server";

// ─── Generic helpers ─────────────────────────────────────────────────────────

/**
 * Escape user-controlled strings before embedding in HTML email bodies.
 * Import and use this in every subclass template that interpolates user data.
 */
export function h(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Format a Unix ms timestamp as a human-readable expiry string.
 * Example: "July 31, 2026 at 2:00 PM UTC"
 */
export function formatExpiry(expiresAt: number): string {
  return new Date(expiresAt).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

// ─── Base class ───────────────────────────────────────────────────────────────

/**
 * Infrastructure base for all transactional email services.
 *
 * Handles the three cross-cutting concerns that are identical in every project:
 *   1. Graceful no-op when EMAIL_FROM_ADDRESS is not configured (safe to deploy
 *      before the sending domain is set up).
 *   2. Kill switch: skips real sends unless EMAIL_SENDING_ENABLED=true.
 *      Defaults to false everywhere, including production — sending must be
 *      explicitly turned on (e.g. `wrangler secret put EMAIL_SENDING_ENABLED`)
 *      once the sending domain is ready, and can be turned back off the same
 *      way without a redeploy.
 *   3. Best-effort error handling: send failures are caught and logged, never
 *      propagated — email must never break a primary operation.
 *
 * Usage: extend this in a project-specific service, call `this.send()` from
 * each typed method, and define `makeXxxEmailService()` as the factory.
 *
 * @example
 * ```ts
 * export class EmailService extends BaseEmailService {
 *   async sendWelcome(to: string, { firstName }: WelcomeParams): Promise<void> {
 *     await this.send({
 *       to,
 *       subject: "Welcome!",
 *       text: `Hi ${firstName}, welcome.`,
 *       html: `<p>Hi ${h(firstName)}, welcome.</p>`,
 *     });
 *   }
 * }
 * ```
 */
export abstract class BaseEmailService {
  constructor(protected readonly sender: SendEmail) {}

  protected async send({
    to,
    subject,
    text,
    html,
  }: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    // Email is not configured — skip silently.
    if (!EMAIL_FROM_ADDRESS) return;

    // Kill switch: skip actual sending unless explicitly enabled. Defaults
    // to false in every environment, so local dev never sends real email.
    if (!EMAIL_SENDING_ENABLED) {
      console.log("[email] EMAIL_SENDING_ENABLED=false — skipping send", { to, subject });
      return;
    }

    try {
      await this.sender.send({
        from: EMAIL_FROM_ADDRESS,
        to,
        subject,
        text,
        html,
      });
    } catch (err) {
      // Email is best-effort — log but never propagate so callers are not blocked.
      console.error("[email] Failed to send email", { to, subject, err });
    }
  }
}
