import { describe, it, expect, vi } from "vitest";
import { TournamentService } from "./tournament-service";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { TournamentRepository } from "@/repositories/tournament-repository";
import type { Tournament } from "@/lib/schema";
import type { AppUser } from "@/lib/auth";

function makeFakeRepo(rows: Tournament[] = [], ownerOrManager = false): TournamentRepository {
  return {
    list: vi.fn(async () => rows),
    listForDirector: vi.fn(async () => rows),
    findById: vi.fn(async (id: string) => rows.find((t) => t.id === id)),
    findBySlug: vi.fn(async (slug: string) => rows.find((t) => t.slug === slug)),
    insert: vi.fn(async (row) => ({ ...row }) as Tournament),
    update: vi.fn(async (id, fields) => {
      const t = rows.find((r) => r.id === id);
      return { ...t, ...fields } as Tournament;
    }),
    delete: vi.fn(async () => {}),
    isOwnerOrManager: vi.fn(async () => ownerOrManager),
    isOwner: vi.fn(async () => ownerOrManager),
    listManagers: vi.fn(async () => []),
    addManager: vi.fn(async (row) => ({ ...row })),
    removeManager: vi.fn(async () => {}),
    findManager: vi.fn(async () => undefined),
    listInvites: vi.fn(async () => []),
    createInvite: vi.fn(async (row) => ({ ...row })),
    findInviteByToken: vi.fn(async () => undefined),
    acceptInvite: vi.fn(async (id) => ({ id }) as never),
    revokeInvite: vi.fn(async () => {}),
    countOwnedByUser: vi.fn(async () => 0),
  } as unknown as TournamentRepository;
}

const baseTournament: Tournament = {
  id: "t-1",
  name: "Spring Invitational 2026",
  slug: "spring-invitational-2026",
  startDate: "2099-04-01", // far future → status = "upcoming"
  endDate: "2099-04-03",
  registrationDeadline: null,
  location: null,
  description: null,
  registrationFee: null,
  createdBy: "user-1",
  createdAt: 1000,
  updatedAt: 1000,
};

// Platform admin — bypasses all capability checks
const adminUser: AppUser = {
  id: "user-1",
  role: "admin",
  isCoach: false,
  isDirector: false,
} as unknown as AppUser;

// Pure director who owns the tournament (ownerOrManager = true in repo)
const directorOwner: AppUser = {
  id: "user-2",
  role: "user",
  isCoach: false,
  isDirector: true,
} as unknown as AppUser;

// Regular user with no capabilities
const regularUser: AppUser = {
  id: "user-3",
  role: "user",
  isCoach: true,
  isDirector: false,
} as unknown as AppUser;

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
  it("throws ForbiddenError when caller has no director or admin capability", async () => {
    const service = new TournamentService(makeFakeRepo());
    await expect(
      service.createTournament({ name: "Test Cup" }, regularUser),
    ).rejects.toThrow(ForbiddenError);
  });

  it("director can create a tournament", async () => {
    const repo = makeFakeRepo();
    const service = new TournamentService(repo);
    const result = await service.createTournament(
      { name: "Fall Classic 2026", startDate: "2026-09-01", endDate: "2026-09-03" },
      directorOwner,
    );
    expect(repo.insert).toHaveBeenCalledOnce();
    expect(result.name).toBe("Fall Classic 2026");
    expect(result.slug).toBe("fall-classic-2026");
    expect(result.createdBy).toBe(directorOwner.id);
  });

  it("admin can create a tournament", async () => {
    const repo = makeFakeRepo();
    const service = new TournamentService(repo);
    const result = await service.createTournament(
      { name: "Fall Classic 2026", startDate: "2026-09-01", endDate: "2026-09-03" },
      adminUser,
    );
    expect(repo.insert).toHaveBeenCalledOnce();
    expect(result.name).toBe("Fall Classic 2026");
    expect(result.slug).toBe("fall-classic-2026");
  });

  it("auto-generates a slug from the name", async () => {
    const repo = makeFakeRepo();
    const service = new TournamentService(repo);
    const result = await service.createTournament({ name: "Spring Invitational 2026" }, adminUser);
    expect(result.slug).toBe("spring-invitational-2026");
  });
});

describe("TournamentService.updateTournament", () => {
  it("throws ForbiddenError when caller is not owner/manager and not admin", async () => {
    // ownerOrManager = false
    const service = new TournamentService(makeFakeRepo([baseTournament], false));
    await expect(
      service.updateTournament("t-1", { name: "New Name" }, directorOwner),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when caller has no isDirector flag", async () => {
    const service = new TournamentService(makeFakeRepo([baseTournament], true));
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

  it("director who is owner/manager can update dates", async () => {
    const repo = makeFakeRepo([baseTournament], true); // ownerOrManager = true
    const service = new TournamentService(repo);
    const result = await service.updateTournament(
      "t-1",
      { startDate: "2099-06-01", endDate: "2099-06-03" },
      directorOwner,
    );
    expect(repo.update).toHaveBeenCalledOnce();
    expect(result.startDate).toBe("2099-06-01");
  });

  it("admin can update regardless of ownership", async () => {
    const repo = makeFakeRepo([baseTournament], false); // ownerOrManager = false, but admin
    const service = new TournamentService(repo);
    const result = await service.updateTournament(
      "t-1",
      { startDate: "2099-06-01", endDate: "2099-06-03" },
      adminUser,
    );
    expect(repo.update).toHaveBeenCalledOnce();
    expect(result.startDate).toBe("2099-06-01");
  });
});

describe("TournamentService.deleteTournament", () => {
  it("throws ForbiddenError when caller has no isDirector flag", async () => {
    const service = new TournamentService(makeFakeRepo([baseTournament], true));
    await expect(service.deleteTournament("t-1", regularUser)).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when director is not owner/manager", async () => {
    const service = new TournamentService(makeFakeRepo([baseTournament], false));
    await expect(service.deleteTournament("t-1", directorOwner)).rejects.toThrow(ForbiddenError);
  });

  it("throws NotFoundError when tournament does not exist", async () => {
    const service = new TournamentService(makeFakeRepo([]));
    await expect(service.deleteTournament("missing", adminUser)).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when tournament is active", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const active = { ...baseTournament, startDate: today, endDate: null };
    const service = new TournamentService(makeFakeRepo([active], false));
    await expect(service.deleteTournament("t-1", adminUser)).rejects.toThrow(
      "Cannot delete an active tournament",
    );
  });

  it("admin can delete a draft tournament", async () => {
    const repo = makeFakeRepo([baseTournament], false);
    const service = new TournamentService(repo);
    await service.deleteTournament("t-1", adminUser);
    expect(repo.delete).toHaveBeenCalledWith("t-1");
  });

  it("director who owns the tournament can delete a draft tournament", async () => {
    const repo = makeFakeRepo([baseTournament], true);
    const service = new TournamentService(repo);
    await service.deleteTournament("t-1", directorOwner);
    expect(repo.delete).toHaveBeenCalledWith("t-1");
  });
});
