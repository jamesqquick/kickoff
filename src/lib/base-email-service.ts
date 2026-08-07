import { EMAIL_FROM_ADDRESS, EMAIL_SENDING_ENABLED } from "astro:env/server";

export function h(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
    if (!EMAIL_FROM_ADDRESS) return;

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
      console.error("[email] Failed to send email", { to, subject, err });
    }
  }
}
