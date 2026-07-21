import { describe, it, expect, vi } from "vitest";
import { TeamService } from "./team-service";
import { NotFoundError } from "@/lib/errors";
import type { TeamRepository } from "@/repositories/team-repository";
import type { Team } from "@/lib/schema";
import type { AppUser } from "@/lib/auth";

// Minimal fake repo — only the methods TeamService calls need to be implemented.
function makeFakeRepo(teams: Team[] = []): TeamRepository {
  return {
    list: vi.fn(async () => teams),
    findById: vi.fn(async (id: string) => teams.find((t) => t.id === id)),
    insert: vi.fn(async (row) => ({ ...row } as Team)),
  } as unknown as TeamRepository;
}

const baseTeam: Team = {
  id: "team-1",
  name: "FC Velocity",
  city: "Austin, TX",
  division: "U18 Men's",
  color: "emerald",
  coachId: "user-1",
  status: "pending",
  createdAt: 1000,
  updatedAt: 1000,
};

const adminUser = { id: "user-1", role: "admin" } as unknown as AppUser;
const regularUser = { id: "user-2", role: "user" } as unknown as AppUser;

describe("TeamService.getTeam", () => {
  it("returns the team when found", async () => {
    const service = new TeamService(makeFakeRepo([baseTeam]));
    const result = await service.getTeam("team-1");
    expect(result).toEqual(baseTeam);
  });

  it("throws NotFoundError when team does not exist", async () => {
    const service = new TeamService(makeFakeRepo([]));
    await expect(service.getTeam("missing")).rejects.toThrow(NotFoundError);
  });
});

describe("TeamService.createTeam", () => {
  it("any authenticated user can create a team", async () => {
    const repo = makeFakeRepo();
    const service = new TeamService(repo);
    const result = await service.createTeam(
      { name: "X", city: "Y", division: "Z", color: "emerald" },
      regularUser,
    );
    expect(repo.insert).toHaveBeenCalledOnce();
    expect(result.coachId).toBe(regularUser.id);
  });

  it("inserts and returns a new team — sets caller as owner", async () => {
    const repo = makeFakeRepo();
    const service = new TeamService(repo);
    const result = await service.createTeam(
      { name: "FC Velocity", city: "Austin, TX", division: "U18 Men's", color: "sky" },
      adminUser,
    );
    expect(repo.insert).toHaveBeenCalledOnce();
    expect(result.name).toBe("FC Velocity");
    expect(result.status).toBe("pending");
    expect(result.coachId).toBe(adminUser.id);
  });
});

describe("TeamService.listTeams", () => {
  it("returns all teams from the repository", async () => {
    const service = new TeamService(makeFakeRepo([baseTeam]));
    const result = await service.listTeams();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("team-1");
  });
});
