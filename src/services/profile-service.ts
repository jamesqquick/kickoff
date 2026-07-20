import { getDb } from "@/lib/db";
import { ProfileRepository } from "@/repositories/profile-repository";
import type { Profile } from "@/lib/schema";

export interface UpdateProfileInput {
  phone?: string;
  dateOfBirth?: string;
  addressStreet?: string;
  addressApt?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
}

// ProfileService — business logic for the profiles table.
// No HTTP, no Astro context.
export class ProfileService {
  constructor(private readonly repo: ProfileRepository) {}

  // Returns null (not throws) — a new user has no profile row yet.
  async getProfile(userId: string): Promise<Profile | null> {
    return (await this.repo.findByUserId(userId)) ?? null;
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const now = Date.now();
    const existing = await this.repo.findByUserId(userId);
    return this.repo.upsert({
      id: existing?.id ?? crypto.randomUUID(),
      userId,
      phone: input.phone ?? existing?.phone ?? null,
      dateOfBirth: input.dateOfBirth ?? existing?.dateOfBirth ?? null,
      addressStreet: input.addressStreet ?? existing?.addressStreet ?? null,
      addressApt: input.addressApt ?? existing?.addressApt ?? null,
      addressCity: input.addressCity ?? existing?.addressCity ?? null,
      addressState: input.addressState ?? existing?.addressState ?? null,
      addressZip: input.addressZip ?? existing?.addressZip ?? null,
      addressCountry: input.addressCountry ?? existing?.addressCountry ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }
}

// DI factory — pages and actions call this; never instantiate ProfileService directly.
export function makeProfileService(): ProfileService {
  return new ProfileService(new ProfileRepository(getDb()));
}
