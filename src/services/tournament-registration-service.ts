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
    return this.registrationsRepo.insert({
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

    return this.registrationsRepo.updateStatus(registrationId, status, notes);
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
