import type { AppUser } from "@/lib/auth";
import { canManageTournament } from "@/lib/permissions";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { DivisionRepository } from "@/repositories/division-repository";
import { TournamentRepository } from "@/repositories/tournament-repository";
import type { Division } from "@/lib/schema";

export interface CreateDivisionInput {
  name: string;
  maxTeams?: number | null;
}

export interface UpdateDivisionInput {
  name?: string;
  maxTeams?: number | null;
}

export class DivisionService {
  constructor(
    private readonly divisionsRepo: DivisionRepository,
    private readonly tournamentsRepo: TournamentRepository,
  ) {}

  async getDivisionsForTournament(tournamentId: string): Promise<Division[]> {
    return this.divisionsRepo.listByTournament(tournamentId);
  }

  async getDivision(id: string): Promise<Division> {
    const division = await this.divisionsRepo.findById(id);
    if (!division) throw new NotFoundError("Division", id);
    return division;
  }

  async createDivision(
    tournamentId: string,
    input: CreateDivisionInput,
    currentUser: AppUser,
  ): Promise<Division> {
    const tournament = await this.tournamentsRepo.findById(tournamentId);
    if (!tournament) throw new NotFoundError("Tournament", tournamentId);

    const ownerOrManager = await this.tournamentsRepo.isOwnerOrManager(tournamentId, currentUser.id);
    if (!canManageTournament(currentUser, ownerOrManager)) {
      throw new ForbiddenError("create divisions for this tournament");
    }

    if (!input.name.trim()) {
      throw new ValidationError("name", "Division name is required");
    }

    const now = Date.now();
    return this.divisionsRepo.insert({
      id: crypto.randomUUID(),
      tournamentId,
      name: input.name.trim(),
      maxTeams: input.maxTeams ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateDivision(
    id: string,
    input: UpdateDivisionInput,
    currentUser: AppUser,
  ): Promise<Division> {
    const division = await this.divisionsRepo.findById(id);
    if (!division) throw new NotFoundError("Division", id);

    const ownerOrManager = await this.tournamentsRepo.isOwnerOrManager(
      division.tournamentId,
      currentUser.id,
    );
    if (!canManageTournament(currentUser, ownerOrManager)) {
      throw new ForbiddenError("update divisions for this tournament");
    }

    if (input.name !== undefined && !input.name.trim()) {
      throw new ValidationError("name", "Division name is required");
    }

    return this.divisionsRepo.update(id, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...("maxTeams" in input ? { maxTeams: input.maxTeams ?? null } : {}),
    });
  }

  // Deletion cascades to all registrations in the division.
  async deleteDivision(id: string, currentUser: AppUser): Promise<void> {
    const division = await this.divisionsRepo.findById(id);
    if (!division) throw new NotFoundError("Division", id);

    const ownerOrManager = await this.tournamentsRepo.isOwnerOrManager(
      division.tournamentId,
      currentUser.id,
    );
    if (!canManageTournament(currentUser, ownerOrManager)) {
      throw new ForbiddenError("delete divisions for this tournament");
    }

    await this.divisionsRepo.delete(id);
  }
}

export function makeDivisionService(): DivisionService {
  const db = getDb();
  return new DivisionService(
    new DivisionRepository(db),
    new TournamentRepository(db),
  );
}
