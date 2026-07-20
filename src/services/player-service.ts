import { NotFoundError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import {
  PlayerRepository,
  type PlayerProfile,
} from "@/repositories/player-repository";
import type { Player } from "@/lib/schema";

// PlayerService — all business logic for players.
// No HTTP, no Astro context.
export class PlayerService {
  constructor(private readonly players: PlayerRepository) {}

  async listPlayers(): Promise<Player[]> {
    return this.players.list();
  }

  async listPlayersWithProfile(): Promise<PlayerProfile[]> {
    return this.players.listWithProfile();
  }

  async getPlayer(id: string): Promise<Player> {
    const player = await this.players.findById(id);
    if (!player) throw new NotFoundError("Player", id);
    return player;
  }

  async getPlayerWithProfile(id: string): Promise<PlayerProfile> {
    const player = await this.players.findByIdWithProfile(id);
    if (!player) throw new NotFoundError("Player", id);
    return player;
  }

  // Called only from the Better Auth user.create hook — never exposed as an action.
  // Idempotent: returns the existing row if one already exists for this userId.
  async createPlayerForUser(userId: string): Promise<Player> {
    const existing = await this.players.findByUserId(userId);
    if (existing) return existing;

    const now = Date.now();
    return this.players.insert({
      id: crypto.randomUUID(),
      userId,
      createdAt: now,
      updatedAt: now,
    });
  }
}

// DI factory — pages and actions call this; never instantiate PlayerService directly.
export function makePlayerService(): PlayerService {
  return new PlayerService(new PlayerRepository(getDb()));
}
