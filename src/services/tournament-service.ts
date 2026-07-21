import type { AppUser } from "@/lib/auth";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { TournamentRepository } from "@/repositories/tournament-repository";
import { getTournamentStatus } from "@/lib/utils";
import type { Tournament } from "@/lib/schema";

export interface CreateTournamentInput {
  name: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateTournamentInput {
  name?: string;
  startDate?: string | null;
  endDate?: string | null;
}

// Derive a URL-safe slug from a tournament name.
// e.g. "Spring Invitational 2026" → "spring-invitational-2026"
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// TournamentService — all business logic for tournaments.
// No HTTP, no Astro context. Receives currentUser for authorization checks.
export class TournamentService {
  constructor(private readonly tournaments: TournamentRepository) {}

  async listTournaments(): Promise<Tournament[]> {
    return this.tournaments.list();
  }

  async getTournament(id: string): Promise<Tournament> {
    const tournament = await this.tournaments.findById(id);
    if (!tournament) {
      throw new NotFoundError("Tournament", id);
    }
    return tournament;
  }

  async createTournament(input: CreateTournamentInput, currentUser: AppUser): Promise<Tournament> {
    if (currentUser.role !== "admin") {
      throw new ForbiddenError("create tournaments");
    }
    if (!input.name.trim()) {
      throw new ValidationError("name", "Tournament name is required");
    }

    const slug = slugify(input.name);
    const now = Date.now();

    return this.tournaments.insert({
      id: crypto.randomUUID(),
      name: input.name.trim(),
      slug,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateTournament(
    id: string,
    input: UpdateTournamentInput,
    currentUser: AppUser,
  ): Promise<Tournament> {
    if (currentUser.role !== "admin") {
      throw new ForbiddenError("update tournaments");
    }
    const tournament = await this.tournaments.findById(id);
    if (!tournament) {
      throw new NotFoundError("Tournament", id);
    }

    const fields: Parameters<TournamentRepository["update"]>[1] = {};

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new ValidationError("name", "Tournament name is required");
      }
      fields.name = input.name.trim();
      fields.slug = slugify(input.name);
    }
    if ("startDate" in input) fields.startDate = input.startDate ?? null;
    if ("endDate" in input) fields.endDate = input.endDate ?? null;

    return this.tournaments.update(id, fields);
  }

  async deleteTournament(id: string, currentUser: AppUser): Promise<void> {
    if (currentUser.role !== "admin") {
      throw new ForbiddenError("delete tournaments");
    }
    const tournament = await this.tournaments.findById(id);
    if (!tournament) {
      throw new NotFoundError("Tournament", id);
    }
    if (getTournamentStatus(tournament) === "active") {
      throw new ValidationError("status", "Cannot delete an active tournament");
    }
    await this.tournaments.delete(id);
  }
}

// DI factory — wire the service with its dependencies.
export function makeTournamentService(): TournamentService {
  return new TournamentService(new TournamentRepository(getDb()));
}
