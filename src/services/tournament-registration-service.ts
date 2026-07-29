import type { AppUser } from "@/lib/auth";
import { isAdmin, canManageTournament } from "@/lib/permissions";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { TournamentRegistrationRepository } from "@/repositories/tournament-registration-repository";
import type { RegistrationWithDetails } from "@/repositories/tournament-registration-repository";
import { DivisionRepository } from "@/repositories/division-repository";
import { TournamentRepository } from "@/repositories/tournament-repository";
import { TeamRepository } from "@/repositories/team-repository";
import type { TournamentRegistration, RegistrationStatus } from "@/lib/schema";
import { makeNotificationService } from "@/services/notification-service";
import { NOTIFICATION_TYPES } from "@/lib/notifications";

export class TournamentRegistrationService {
  constructor(
    private readonly registrationsRepo: TournamentRegistrationRepository,
    private readonly divisionsRepo: DivisionRepository,
    private readonly tournamentsRepo: TournamentRepository,
    private readonly teamsRepo: TeamRepository,
  ) {}

  async getRegistrationsForTournament(tournamentId: string): Promise<RegistrationWithDetails[]> {
    return this.registrationsRepo.listByTournament(tournamentId);
  }

  async getRegistrationsForTeam(teamId: string): Promise<RegistrationWithDetails[]> {
    return this.registrationsRepo.listByTeam(teamId);
  }

  /** Returns all pending registrations across all tournaments the director owns or manages. */
  async getPendingRegistrationsForDirector(userId: string): Promise<RegistrationWithDetails[]> {
    const tournaments = await this.tournamentsRepo.listForDirector(userId);
    if (tournaments.length === 0) return [];

    const allPending: RegistrationWithDetails[] = [];
    for (const t of tournaments) {
      const regs = await this.registrationsRepo.listByTournamentAndStatus(t.id, "pending");
      allPending.push(...regs);
    }
    return allPending;
  }

  async registerTeam(
    teamId: string,
    divisionId: string,
    currentUser: AppUser,
  ): Promise<TournamentRegistration> {
    // Verify the team exists and the caller is the coach.
    const team = await this.teamsRepo.findById(teamId);
    if (!team) throw new NotFoundError("Team", teamId);
    if (team.coachId !== currentUser.id && !isAdmin(currentUser)) {
      throw new ForbiddenError("register this team");
    }
    // Coaches must have the isCoach flag; admins bypass
    if (!currentUser.isCoach && !isAdmin(currentUser)) {
      throw new ForbiddenError("register teams for tournaments");
    }

    // Verify the division exists and load its tournament.
    const division = await this.divisionsRepo.findById(divisionId);
    if (!division) throw new NotFoundError("Division", divisionId);

    const tournament = await this.tournamentsRepo.findById(division.tournamentId);
    if (!tournament) throw new NotFoundError("Tournament", division.tournamentId);

    // Check registration deadline.
    if (tournament.registrationDeadline) {
      const deadline = new Date(tournament.registrationDeadline);
      if (new Date() > deadline) {
        throw new ValidationError(
          "registrationDeadline",
          "Registration for this tournament has closed",
        );
      }
    }

    // Check that the team isn't already registered in this tournament.
    const existing = await this.registrationsRepo.findByTeamAndTournament(
      teamId,
      division.tournamentId,
    );
    if (existing) {
      throw new ValidationError(
        "tournament",
        "This team is already registered in this tournament",
      );
    }

    // Check division capacity.
    if (division.maxTeams !== null) {
      const count = await this.registrationsRepo.countByDivision(divisionId);
      if (count >= division.maxTeams) {
        throw new ValidationError("division", "This division is full");
      }
    }

    const now = Date.now();
    const registration = await this.registrationsRepo.insert({
      id: crypto.randomUUID(),
      teamId,
      divisionId,
      tournamentId: division.tournamentId,
      status: "pending",
      registeredAt: new Date().toISOString(),
      notes: null,
      createdAt: now,
      updatedAt: now,
    });

    // Notify: tournament owner + co-managers that a new registration was submitted.
    void this.notifyDirectorsOfNewRegistration(team.name, tournament.name, tournament);

    return registration;
  }

  async updateRegistrationStatus(
    registrationId: string,
    status: RegistrationStatus,
    notes: string | undefined,
    currentUser: AppUser,
  ): Promise<TournamentRegistration> {
    const registration = await this.registrationsRepo.findById(registrationId);
    if (!registration) throw new NotFoundError("Registration", registrationId);

    const ownerOrManager = await this.tournamentsRepo.isOwnerOrManager(
      registration.tournamentId,
      currentUser.id,
    );
    if (!canManageTournament(currentUser, ownerOrManager)) {
      throw new ForbiddenError("update registration status for this tournament");
    }

    const updated = await this.registrationsRepo.updateStatus(registrationId, status, notes);

    // Notify: team coach that their registration status changed.
    void this.notifyCoachOfStatusChange(registration.teamId, status, notes, registration.tournamentId);

    return updated;
  }

  async markRegistrationPaid(
    registrationId: string,
    note: string | undefined,
    currentUser: AppUser,
  ): Promise<TournamentRegistration> {
    const registration = await this.registrationsRepo.findById(registrationId);
    if (!registration) throw new NotFoundError("Registration", registrationId);

    const ownerOrManager = await this.tournamentsRepo.isOwnerOrManager(
      registration.tournamentId,
      currentUser.id,
    );
    if (!canManageTournament(currentUser, ownerOrManager)) {
      throw new ForbiddenError("mark registrations as paid for this tournament");
    }

    const updated = await this.registrationsRepo.updatePaymentStatus(
      registrationId,
      Date.now(),
      note ?? null,
    );

    void this.notifyCoachOfPaymentReceived(registration.teamId, registration.tournamentId);

    return updated;
  }

  async markRegistrationUnpaid(
    registrationId: string,
    currentUser: AppUser,
  ): Promise<TournamentRegistration> {
    const registration = await this.registrationsRepo.findById(registrationId);
    if (!registration) throw new NotFoundError("Registration", registrationId);

    const ownerOrManager = await this.tournamentsRepo.isOwnerOrManager(
      registration.tournamentId,
      currentUser.id,
    );
    if (!canManageTournament(currentUser, ownerOrManager)) {
      throw new ForbiddenError("update payment status for this tournament");
    }

    return this.registrationsRepo.updatePaymentStatus(registrationId, null, null);
  }

  // ── Private notification helpers ─────────────────────────────────────────

  /**
   * Fire-and-forget: notify all directors/managers of a tournament that a team
   * has submitted a new registration. Errors are logged and swallowed — a
   * notification failure must never block the primary operation.
   */
  private async notifyDirectorsOfNewRegistration(
    teamName: string,
    tournamentName: string,
    tournament: { id: string; createdBy: string | null },
  ): Promise<void> {
    try {
      const notificationService = makeNotificationService();
      const payload = {
        type: NOTIFICATION_TYPES.NEW_REGISTRATION_SUBMITTED,
        title: "New registration submitted",
        body: `${teamName} has registered for ${tournamentName}.`,
        referenceUrl: `/director/tournaments/${tournament.id}/registrations`,
      };

      // Collect unique recipient user IDs: owner + all co-managers.
      const recipientIds = new Set<string>();
      if (tournament.createdBy) recipientIds.add(tournament.createdBy);

      const managers = await this.tournamentsRepo.listManagers(tournament.id);
      for (const m of managers) recipientIds.add(m.userId);

      await Promise.all(
        [...recipientIds].map((userId) => notificationService.createForUser(userId, payload)),
      );
    } catch (err) {
      console.error("[notifications] Failed to notify directors of new registration:", err);
    }
  }

  /**
   * Fire-and-forget: notify the team's coach that their registration payment
   * has been confirmed by the director. Errors are logged and swallowed.
   */
  private async notifyCoachOfPaymentReceived(
    teamId: string,
    tournamentId: string,
  ): Promise<void> {
    try {
      const team = await this.teamsRepo.findById(teamId);
      const tournament = await this.tournamentsRepo.findById(tournamentId);
      if (!team || !tournament) return;

      await makeNotificationService().createForUser(team.coachId, {
        type: NOTIFICATION_TYPES.REGISTRATION_MARKED_PAID,
        title: "Payment received",
        body: `Your registration payment for ${tournament.name} has been confirmed.`,
        referenceUrl: `/teams/${team.id}#registrations`,
      });
    } catch (err) {
      console.error("[notifications] Failed to notify coach of payment received:", err);
    }
  }

  /**
   * Fire-and-forget: notify the team's coach that a director actioned their
   * registration. Errors are logged and swallowed.
   */
  private async notifyCoachOfStatusChange(
    teamId: string,
    status: RegistrationStatus,
    notes: string | undefined,
    tournamentId: string,
  ): Promise<void> {
    // Moving a registration back to pending is a director-only housekeeping
    // action with no actionable meaning for the coach — skip the notification.
    if (status === "pending") return;

    try {
      const team = await this.teamsRepo.findById(teamId);
      const tournament = await this.tournamentsRepo.findById(tournamentId);
      if (!team || !tournament) return;

      const body = notes
        ? `Your registration for ${tournament.name} was ${status}. Director note: ${notes}`
        : `Your registration for ${tournament.name} was ${status}.`;

      await makeNotificationService().createForUser(team.coachId, {
        type: NOTIFICATION_TYPES.REGISTRATION_STATUS_CHANGED,
        title: `Registration ${status}`,
        body,
        referenceUrl: `/teams/${team.id}#registrations`,
      });
    } catch (err) {
      console.error("[notifications] Failed to notify coach of registration status change:", err);
    }
  }
}

export function makeTournamentRegistrationService(): TournamentRegistrationService {
  const db = getDb();
  return new TournamentRegistrationService(
    new TournamentRegistrationRepository(db),
    new DivisionRepository(db),
    new TournamentRepository(db),
    new TeamRepository(db),
  );
}
