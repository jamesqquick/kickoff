import { getEmailSender } from "@/lib/email";
import { EMAIL_FROM_ADDRESS, SEND_EMAIL_IN_DEV } from "astro:env/server";
import type { RegistrationStatus } from "@/lib/schema";

// ─── Parameter types ────────────────────────────────────────────────────────

export interface RegistrationStatusChangedParams {
  teamName: string;
  tournamentName: string;
  divisionName: string;
  status: RegistrationStatus;
  directorNote?: string;
}

export interface NewRegistrationSubmittedParams {
  teamName: string;
  tournamentName: string;
  divisionName: string;
}

export interface ManagerInviteParams {
  tournamentName: string;
  inviteUrl: string;
  expiresAt: number; // Unix ms timestamp
}

export interface WelcomeParams {
  firstName: string;
}

export interface PasswordResetParams {
  resetUrl: string;
  expiresAt: number; // Unix ms timestamp
}

export interface PlayerJoinedTeamParams {
  playerName: string;
  teamName: string;
}

export interface TeamPlayerInviteParams {
  teamName: string;
  inviteUrl: string;
  expiresAt: number; // Unix ms timestamp
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatExpiry(expiresAt: number): string {
  return new Date(expiresAt).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  waitlisted: "Waitlisted",
  rejected: "Rejected",
};

// ─── Service ────────────────────────────────────────────────────────────────

export class EmailService {
  constructor(private readonly sender: SendEmail) {}

  /**
   * Notify the team coach when a director actions their registration.
   * Failures are caught and logged — email is best-effort and must not break
   * the registration status update.
   */
  async sendRegistrationStatusChanged(
    to: string,
    params: RegistrationStatusChangedParams,
  ): Promise<void> {
    const { teamName, tournamentName, divisionName, status, directorNote } = params;
    const statusLabel = STATUS_LABELS[status];

    const subject = `Registration ${statusLabel}: ${teamName} — ${tournamentName}`;

    const text = [
      `Your registration status has been updated.`,
      ``,
      `Team: ${teamName}`,
      `Tournament: ${tournamentName}`,
      `Division: ${divisionName}`,
      `Status: ${statusLabel}`,
      ...(directorNote ? [``, `Note from director: ${directorNote}`] : []),
    ].join("\n");

    const html = `
<p>Your registration status has been updated.</p>
<table>
  <tr><td><strong>Team</strong></td><td>${teamName}</td></tr>
  <tr><td><strong>Tournament</strong></td><td>${tournamentName}</td></tr>
  <tr><td><strong>Division</strong></td><td>${divisionName}</td></tr>
  <tr><td><strong>Status</strong></td><td>${statusLabel}</td></tr>
</table>
${directorNote ? `<p><strong>Note from director:</strong> ${directorNote}</p>` : ""}
`.trim();

    await this.send({ to, subject, text, html });
  }

  /**
   * Notify all tournament directors and managers when a team registers.
   * Failures are caught and logged per recipient.
   */
  async sendNewRegistrationSubmitted(
    to: string[],
    params: NewRegistrationSubmittedParams,
  ): Promise<void> {
    const { teamName, tournamentName, divisionName } = params;
    const subject = `New Registration: ${teamName} — ${tournamentName}`;

    const text = [
      `A new team has registered for your tournament.`,
      ``,
      `Team: ${teamName}`,
      `Tournament: ${tournamentName}`,
      `Division: ${divisionName}`,
    ].join("\n");

    const html = `
<p>A new team has registered for your tournament.</p>
<table>
  <tr><td><strong>Team</strong></td><td>${teamName}</td></tr>
  <tr><td><strong>Tournament</strong></td><td>${tournamentName}</td></tr>
  <tr><td><strong>Division</strong></td><td>${divisionName}</td></tr>
</table>
`.trim();

    await Promise.all(to.map((recipient) => this.send({ to: recipient, subject, text, html })));
  }

  /**
   * Send a manager invite link to the specified email address.
   */
  async sendManagerInvite(to: string, params: ManagerInviteParams): Promise<void> {
    const { tournamentName, inviteUrl, expiresAt } = params;
    const expiry = formatExpiry(expiresAt);
    const subject = `You've been invited to manage ${tournamentName}`;

    const text = [
      `You have been invited to become a manager of ${tournamentName}.`,
      ``,
      `Accept your invite: ${inviteUrl}`,
      ``,
      `This invite expires on ${expiry}.`,
    ].join("\n");

    const html = `
<p>You have been invited to become a manager of <strong>${tournamentName}</strong>.</p>
<p><a href="${inviteUrl}">Accept your invite</a></p>
<p>This invite expires on ${expiry}.</p>
`.trim();

    await this.send({ to, subject, text, html });
  }

  /**
   * Send a welcome email to a newly signed-up user.
   */
  async sendWelcome(to: string, params: WelcomeParams): Promise<void> {
    const { firstName } = params;
    const subject = "Welcome to Kickoff!";

    const text = [
      `Hi ${firstName},`,
      ``,
      `Welcome to Kickoff — your home for soccer tournament management.`,
      ``,
      `Get started by creating or joining a team.`,
    ].join("\n");

    const html = `
<p>Hi ${firstName},</p>
<p>Welcome to <strong>Kickoff</strong> — your home for soccer tournament management.</p>
<p>Get started by creating or joining a team.</p>
`.trim();

    await this.send({ to, subject, text, html });
  }

  /**
   * Send a password reset link.
   */
  async sendPasswordReset(to: string, params: PasswordResetParams): Promise<void> {
    const { resetUrl, expiresAt } = params;
    const expiry = formatExpiry(expiresAt);
    const subject = "Reset your Kickoff password";

    const text = [
      `We received a request to reset your password.`,
      ``,
      `Reset your password: ${resetUrl}`,
      ``,
      `This link expires on ${expiry}.`,
      ``,
      `If you did not request a password reset, you can ignore this email.`,
    ].join("\n");

    const html = `
<p>We received a request to reset your password.</p>
<p><a href="${resetUrl}">Reset your password</a></p>
<p>This link expires on ${expiry}.</p>
<p>If you did not request a password reset, you can ignore this email.</p>
`.trim();

    await this.send({ to, subject, text, html });
  }

  /**
   * Notify the coach when a player accepts a team invite.
   */
  async sendPlayerJoinedTeam(to: string, params: PlayerJoinedTeamParams): Promise<void> {
    const { playerName, teamName } = params;
    const subject = `${playerName} joined ${teamName}`;

    const text = [
      `Good news — ${playerName} has joined your team ${teamName}.`,
    ].join("\n");

    const html = `<p>Good news — <strong>${playerName}</strong> has joined your team <strong>${teamName}</strong>.</p>`;

    await this.send({ to, subject, text, html });
  }

  /**
   * Send an email-scoped team invite link to a prospective player.
   */
  async sendTeamPlayerInvite(to: string, params: TeamPlayerInviteParams): Promise<void> {
    const { teamName, inviteUrl, expiresAt } = params;
    const expiry = formatExpiry(expiresAt);
    const subject = `You've been invited to join ${teamName}`;

    const text = [
      `You have been invited to join ${teamName} on Kickoff.`,
      ``,
      `Accept your invite: ${inviteUrl}`,
      ``,
      `This invite expires on ${expiry}.`,
    ].join("\n");

    const html = `
<p>You have been invited to join <strong>${teamName}</strong> on Kickoff.</p>
<p><a href="${inviteUrl}">Accept your invite</a></p>
<p>This invite expires on ${expiry}.</p>
`.trim();

    await this.send({ to, subject, text, html });
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async send({
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
    // Dev guard: skip actual sending unless SEND_EMAIL_IN_DEV is enabled.
    if (!SEND_EMAIL_IN_DEV) {
      console.log("[email] SEND_EMAIL_IN_DEV=false — skipping send", { to, subject });
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

// ─── Factory ────────────────────────────────────────────────────────────────

export function makeEmailService(): EmailService {
  return new EmailService(getEmailSender());
}
