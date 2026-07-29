// Email service stub — wire real send logic here when the Cloudflare Email
// Send infrastructure is available (see issue #41).
//
// All functions log intent in development so password reset URLs are still
// accessible during local testing without an email provider.

export interface PasswordResetEmailParams {
  to: string;
  resetUrl: string;
}

/**
 * Sends a password-reset email containing the one-time reset link.
 *
 * TODO: replace the console.warn stub with a real Cloudflare Email Send call
 * once the email infrastructure issue is resolved.
 */
export async function sendPasswordReset({
  to,
  resetUrl,
}: PasswordResetEmailParams): Promise<void> {
  // TODO: replace with Cloudflare Email Send when infrastructure is available.
  console.warn(
    `[email] sendPasswordReset not yet implemented.\n` +
      `  To: ${to}\n` +
      `  Reset URL: ${resetUrl}`,
  );
}
