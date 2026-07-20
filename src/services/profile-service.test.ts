import { describe, it, expect, vi } from "vitest";
import { ProfileService } from "./profile-service";
import type { ProfileRepository } from "@/repositories/profile-repository";
import type { Profile } from "@/lib/schema";

const baseProfile: Profile = {
  id: "profile-1",
  userId: "user-1",
  phone: "555-0100",
  dateOfBirth: "1990-01-15",
  addressStreet: "123 Main St",
  addressApt: null,
  addressCity: "Austin",
  addressState: "TX",
  addressZip: "78701",
  addressCountry: "United States",
  createdAt: 1000,
  updatedAt: 1000,
};

function makeFakeRepo(row?: Profile): ProfileRepository {
  return {
    findByUserId: vi.fn(async () => row),
    upsert: vi.fn(async (r) => ({ ...r }) as Profile),
  } as unknown as ProfileRepository;
}

describe("ProfileService.getProfile", () => {
  it("returns the profile when found", async () => {
    const service = new ProfileService(makeFakeRepo(baseProfile));
    const result = await service.getProfile("user-1");
    expect(result).toEqual(baseProfile);
  });

  it("returns null when no profile row exists yet", async () => {
    const service = new ProfileService(makeFakeRepo(undefined));
    const result = await service.getProfile("user-99");
    expect(result).toBeNull();
  });
});

describe("ProfileService.updateProfile", () => {
  it("calls upsert with the correct userId and fields", async () => {
    const repo = makeFakeRepo(undefined);
    const service = new ProfileService(repo);
    await service.updateProfile("user-1", { phone: "512-555-0001" });
    expect(repo.upsert).toHaveBeenCalledOnce();
    const arg = vi.mocked(repo.upsert).mock.calls[0][0];
    expect(arg.userId).toBe("user-1");
    expect(arg.phone).toBe("512-555-0001");
  });

  it("returns the upserted profile", async () => {
    const repo = makeFakeRepo(undefined);
    const service = new ProfileService(repo);
    const result = await service.updateProfile("user-1", { phone: "512-555-0001" });
    expect(result.userId).toBe("user-1");
  });

  it("preserves existing fields when only a subset is updated", async () => {
    const repo = makeFakeRepo(baseProfile);
    const service = new ProfileService(repo);
    await service.updateProfile("user-1", { phone: "999-0000" });
    const arg = vi.mocked(repo.upsert).mock.calls[0][0];
    // New phone
    expect(arg.phone).toBe("999-0000");
    // Existing address preserved
    expect(arg.addressCity).toBe("Austin");
  });
});
