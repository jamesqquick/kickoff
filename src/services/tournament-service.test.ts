import { describe, it, expect, vi } from "vitest";
import { TournamentService } from "./tournament-service";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { TournamentRepository } from "@/repositories/tournament-repository";
import type { Tournament } from "@/lib/schema";
import type { AppUser } from "@/lib/auth";

function makeFakeRepo(rows: Tournament[] = []): TournamentRepository {
  return {
    list: vi.fn(async () => rows),
    findById: vi.fn(async (id: string) => rows.find((t) => t.id === id)),
    findBySlug: vi.fn(async (slug: string) => rows.find((t) => t.slug === slug)),
    insert: vi.fn(async (row) => ({ ...row }) as Tournament),
    update: vi.fn(async (id, fields) => {
      const t = rows.find((r) => r.id === id);
      return { ...t, ...fields } as Tournament;
    }),
  } as unknown as TournamentRepository;
}

const baseTournament: Tournament = {
  id: "t-1",
  name: "Spring Invitational 2026",
  slug: "spring-invitational-2026",
  status: "draft",
  startDate: "2026-04-01",
  endDate: "2026-04-03",
  createdAt: 1000,
  updatedAt: 1000,
};

const adminUser = { id: "user-1", role: "admin" } as unknown as AppUser;
const regularUser = { id: "user-2", role: "user" } as unknown as AppUser;

describe("TournamentService.getTournament", () => {
  it("returns the tournament when found", async () => {
    const service = new TournamentService(makeFakeRepo([baseTournament]));
    const result = await service.getTournament("t-1");
    expect(result).toEqual(baseTournament);
  });

  it("throws NotFoundError when tournament does not exist", async () => {
    const service = new TournamentService(makeFakeRepo([]));
    await expect(service.getTournament("missing")).rejects.toThrow(NotFoundError);
  });
});

describe("TournamentService.createTournament", () => {
  it("throws ForbiddenError when caller is not admin", async () => {
    const service = new TournamentService(makeFakeRepo());
    await expect(
      service.createTournament({ name: "Test Cup" }, regularUser),
    ).rejects.toThrow(ForbiddenError);
  });

  it("admin can create a tournament and gets back the inserted row", async () => {
    const repo = makeFakeRepo();
    const service = new TournamentService(repo);
    const result = await service.createTournament(
      { name: "Fall Classic 2026", startDate: "2026-09-01", endDate: "2026-09-03" },
      adminUser,
    );
    expect(repo.insert).toHaveBeenCalledOnce();
    expect(result.name).toBe("Fall Classic 2026");
    expect(result.slug).toBe("fall-classic-2026");
    expect(result.status).toBe("draft");
  });

  it("auto-generates a slug from the name", async () => {
    const repo = makeFakeRepo();
    const service = new TournamentService(repo);
    const result = await service.createTournament({ name: "Spring Invitational 2026" }, adminUser);
    expect(result.slug).toBe("spring-invitational-2026");
  });
});

describe("TournamentService.updateTournament", () => {
  it("throws ForbiddenError when caller is not admin", async () => {
    const service = new TournamentService(makeFakeRepo([baseTournament]));
    await expect(
      service.updateTournament("t-1", { name: "New Name" }, regularUser),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws NotFoundError when tournament does not exist", async () => {
    const service = new TournamentService(makeFakeRepo([]));
    await expect(
      service.updateTournament("missing", { name: "X" }, adminUser),
    ).rejects.toThrow(NotFoundError);
  });

  it("admin can promote status", async () => {
    const repo = makeFakeRepo([baseTournament]);
    const service = new TournamentService(repo);
    const result = await service.updateTournament("t-1", { status: "active" }, adminUser);
    expect(repo.update).toHaveBeenCalledOnce();
    expect(result.status).toBe("active");
  });
});
