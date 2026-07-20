import { describe, it, expect, vi } from "vitest";
import { PlayerService } from "./player-service";
import { NotFoundError } from "@/lib/errors";
import type { PlayerRepository } from "@/repositories/player-repository";
import type { Player } from "@/lib/schema";

// Minimal fake repo — only the methods PlayerService calls need to be implemented.
function makeFakeRepo(rows: Player[] = []): PlayerRepository {
  return {
    list: vi.fn(async () => rows),
    listWithProfile: vi.fn(async () => []),
    findById: vi.fn(async (id: string) => rows.find((p) => p.id === id)),
    findByIdWithProfile: vi.fn(async () => undefined),
    findByUserId: vi.fn(async (userId: string) =>
      rows.find((p) => p.userId === userId),
    ),
    insert: vi.fn(async (row) => ({ ...row }) as Player),
  } as unknown as PlayerRepository;
}

const basePlayer: Player = {
  id: "player-1",
  userId: "user-1",
  createdAt: 1000,
  updatedAt: 1000,
};

describe("PlayerService.listPlayers", () => {
  it("returns an empty array when the repo is empty", async () => {
    const service = new PlayerService(makeFakeRepo([]));
    const result = await service.listPlayers();
    expect(result).toEqual([]);
  });

  it("returns all players from the repository", async () => {
    const service = new PlayerService(makeFakeRepo([basePlayer]));
    const result = await service.listPlayers();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("player-1");
  });
});

describe("PlayerService.getPlayer", () => {
  it("returns the player when found", async () => {
    const service = new PlayerService(makeFakeRepo([basePlayer]));
    const result = await service.getPlayer("player-1");
    expect(result).toEqual(basePlayer);
  });

  it("throws NotFoundError when the player does not exist", async () => {
    const service = new PlayerService(makeFakeRepo([]));
    await expect(service.getPlayer("missing")).rejects.toThrow(NotFoundError);
  });
});

describe("PlayerService.createPlayerForUser", () => {
  it("inserts a new player row and returns it", async () => {
    const repo = makeFakeRepo([]);
    const service = new PlayerService(repo);
    const result = await service.createPlayerForUser("user-99");
    expect(repo.insert).toHaveBeenCalledOnce();
    expect(result.userId).toBe("user-99");
  });

  it("is idempotent — returns the existing row without a second insert", async () => {
    const repo = makeFakeRepo([basePlayer]);
    const service = new PlayerService(repo);
    const result = await service.createPlayerForUser("user-1");
    expect(repo.insert).not.toHaveBeenCalled();
    expect(result.id).toBe("player-1");
  });
});
