import { getEmailSender } from "@/lib/email";
import { BaseEmailService, h, formatExpiry } from "@/lib/base-email-service";
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

// ─── Project-specific constants ──────────────────────────────────────────────

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  waitlisted: "Waitlisted",
  rejected: "Rejected",
};

// ─── Service ────────────────────────────────────────────────────────────────

export class EmailService extends BaseEmailService {
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
  <tr><td><strong>Team</strong></td><td>${h(teamName)}</td></tr>
  <tr><td><strong>Tournament</strong></td><td>${h(tournamentName)}</td></tr>
  <tr><td><strong>Division</strong></td><td>${h(divisionName)}</td></tr>
  <tr><td><strong>Status</strong></td><td>${statusLabel}</td></tr>
</table>
${directorNote ? `<p><strong>Note from director:</strong> ${h(directorNote)}</p>` : ""}
`.trim();

    await this.send({ to, subject, text, html });
  }

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
  <tr><td><strong>Team</strong></td><td>${h(teamName)}</td></tr>
  <tr><td><strong>Tournament</strong></td><td>${h(tournamentName)}</td></tr>
  <tr><td><strong>Division</strong></td><td>${h(divisionName)}</td></tr>
</table>
`.trim();

    await Promise.all(to.map((recipient) => this.send({ to: recipient, subject, text, html })));
  }

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
<p>You have been invited to become a manager of <strong>${h(tournamentName)}</strong>.</p>
<p><a href="${h(inviteUrl)}">Accept your invite</a></p>
<p>This invite expires on ${expiry}.</p>
`.trim();

    await this.send({ to, subject, text, html });
  }

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
<p>Hi ${h(firstName)},</p>
<p>Welcome to <strong>Kickoff</strong> — your home for soccer tournament management.</p>
<p>Get started by creating or joining a team.</p>
`.trim();

    await this.send({ to, subject, text, html });
  }

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
<p><a href="${h(resetUrl)}">Reset your password</a></p>
<p>This link expires on ${expiry}.</p>
<p>If you did not request a password reset, you can ignore this email.</p>
`.trim();

    await this.send({ to, subject, text, html });
  }

  async sendPlayerJoinedTeam(to: string, params: PlayerJoinedTeamParams): Promise<void> {
    const { playerName, teamName } = params;
    const subject = `${playerName} joined ${teamName}`;

    const text = `Good news — ${playerName} has joined your team ${teamName}.`;

    const html = `<p>Good news — <strong>${h(playerName)}</strong> has joined your team <strong>${h(teamName)}</strong>.</p>`;

    await this.send({ to, subject, text, html });
  }

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
<p>You have been invited to join <strong>${h(teamName)}</strong> on Kickoff.</p>
<p><a href="${h(inviteUrl)}">Accept your invite</a></p>
<p>This invite expires on ${expiry}.</p>
`.trim();

    await this.send({ to, subject, text, html });
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function makeEmailService(): EmailService {
  return new EmailService(getEmailSender());
}
