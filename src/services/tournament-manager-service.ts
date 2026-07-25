import type { AppUser } from "@/lib/auth";
import { canManageTournament, canManageManagersFor } from "@/lib/permissions";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { TournamentRepository } from "@/repositories/tournament-repository";
import type { TournamentManager, TournamentManagerInvite } from "@/lib/schema";
import { makeEmailService } from "@/services/email-service";
import { BETTER_AUTH_URL } from "astro:env/server";

// 48 hours in milliseconds
const INVITE_TTL_MS = 48 * 60 * 60 * 1000;

export interface ManagerWithUser extends TournamentManager {
  name: string;
  email: string;
}

/**
 * Set isDirector = true on the Better Auth user table.
 * Uses raw D1 because isDirector is an additionalField with input:false —
 * it cannot be set via the client-facing updateUser API, only server-side.
 */
async function grantDirectorFlag(userId: string): Promise<void> {
  const db = getDb();
  await db.$client
    .prepare("UPDATE \"user\" SET isDirector = 1, updatedAt = ? WHERE id = ?")
    .bind(Date.now(), userId)
    .run();
}

export class TournamentManagerService {
  constructor(private readonly tournamentsRepo: TournamentRepository) {}

  async listManagers(tournamentId: string, currentUser: AppUser): Promise<ManagerWithUser[]> {
    const ownerOrManager = await this.tournamentsRepo.isOwnerOrManager(
      tournamentId,
      currentUser.id,
    );
    if (!canManageTournament(currentUser, ownerOrManager)) {
      throw new ForbiddenError("view managers for this tournament");
    }

    const managers = await this.tournamentsRepo.listManagers(tournamentId);
    if (managers.length === 0) return [];

    // Fetch user details via raw D1 to avoid needing a session context
    const db = getDb();
    const results: ManagerWithUser[] = [];
    for (const m of managers) {
      const user = await db.$client
        .prepare("SELECT name, email FROM \"user\" WHERE id = ?")
        .bind(m.userId)
        .first<{ name: string; email: string }>();
      results.push({
        ...m,
        name: user?.name ?? "(unknown)",
        email: user?.email ?? "",
      });
    }
    return results;
  }

  async addManager(
    tournamentId: string,
    targetUserId: string,
    currentUser: AppUser,
  ): Promise<TournamentManager> {
    const isOwner = await this.tournamentsRepo.isOwner(tournamentId, currentUser.id);
    if (!canManageManagersFor(currentUser, isOwner)) {
      throw new ForbiddenError("add managers to this tournament");
    }

    // Prevent duplicate manager rows
    const existing = await this.tournamentsRepo.findManager(tournamentId, targetUserId);
    if (existing) {
      throw new ValidationError("userId", "This user is already a manager of this tournament");
    }

    const manager = await this.tournamentsRepo.addManager({
      id: crypto.randomUUID(),
      tournamentId,
      userId: targetUserId,
      addedBy: currentUser.id,
      createdAt: Date.now(),
    });

    // Grant isDirector=true — permanent, spec says never auto-revoked on removal
    await grantDirectorFlag(targetUserId);

    return manager;
  }

  async removeManager(
    tournamentId: string,
    targetUserId: string,
    currentUser: AppUser,
  ): Promise<void> {
    const isOwner = await this.tournamentsRepo.isOwner(tournamentId, currentUser.id);
    if (!canManageManagersFor(currentUser, isOwner)) {
      throw new ForbiddenError("remove managers from this tournament");
    }

    const existing = await this.tournamentsRepo.findManager(tournamentId, targetUserId);
    if (!existing) {
      throw new NotFoundError("Manager", targetUserId);
    }

    await this.tournamentsRepo.removeManager(tournamentId, targetUserId);
    // NOTE: isDirector is NOT revoked on removal (spec: once granted, stays)
  }

  async listInvites(
    tournamentId: string,
    currentUser: AppUser,
  ): Promise<TournamentManagerInvite[]> {
    const ownerOrManager = await this.tournamentsRepo.isOwnerOrManager(
      tournamentId,
      currentUser.id,
    );
    if (!canManageTournament(currentUser, ownerOrManager)) {
      throw new ForbiddenError("view invites for this tournament");
    }
    return this.tournamentsRepo.listInvites(tournamentId);
  }

  async generateInvite(
    tournamentId: string,
    currentUser: AppUser,
    /** Optional email to send the invite to. When provided, an invite email is sent. */
    email?: string,
  ): Promise<TournamentManagerInvite> {
    const isOwner = await this.tournamentsRepo.isOwner(tournamentId, currentUser.id);
    if (!canManageManagersFor(currentUser, isOwner)) {
      throw new ForbiddenError("generate invite links for this tournament");
    }

    const tournament = await this.tournamentsRepo.findById(tournamentId);
    if (!tournament) throw new NotFoundError("Tournament", tournamentId);

    const now = Date.now();
    const expiresAt = now + INVITE_TTL_MS;
    const token = generateToken();

    const invite = await this.tournamentsRepo.createInvite({
      id: crypto.randomUUID(),
      tournamentId,
      email: email ?? null,
      token,
      createdBy: currentUser.id,
      expiresAt,
      acceptedAt: null,
      createdAt: now,
    });

    // Send the invite email when an email address was provided (best-effort).
    if (email) {
      const inviteUrl = `${BETTER_AUTH_URL}/director/join/${token}`;
      makeEmailService()
        .sendManagerInvite(email, {
          tournamentName: tournament.name,
          inviteUrl,
          expiresAt,
        })
        .catch((err) => {
          console.error("[manager] Failed to send manager invite email", err);
        });
    }

    return invite;
  }

  async revokeInvite(inviteId: string, currentUser: AppUser): Promise<void> {
    // Fetch the invite directly by id to get tournamentId
    const db = getDb();
    const row = await db.$client
      .prepare("SELECT * FROM tournament_manager_invites WHERE id = ?")
      .bind(inviteId)
      .first<{ tournament_id: string; created_by: string }>();

    if (!row) throw new NotFoundError("Invite", inviteId);

    const isOwner = await this.tournamentsRepo.isOwner(row.tournament_id, currentUser.id);
    if (!canManageManagersFor(currentUser, isOwner)) {
      throw new ForbiddenError("revoke invites for this tournament");
    }

    await this.tournamentsRepo.revokeInvite(inviteId);
  }

  /**
   * Validate and accept a manager invite by token.
   * Creates a tournament_managers row and sets isDirector=true on the user.
   * Called by the /director/join/[token] accept action.
   */
  async acceptInvite(
    token: string,
    currentUser: AppUser,
  ): Promise<{ tournamentId: string; tournamentName: string }> {
    const invite = await this.tournamentsRepo.findInviteByToken(token);
    if (!invite) throw new NotFoundError("Invite", token);

    if (invite.acceptedAt !== null) {
      throw new ValidationError("token", "This invite has already been used");
    }
    if (Date.now() > invite.expiresAt) {
      throw new ValidationError("token", "This invite has expired");
    }

    const tournament = await this.tournamentsRepo.findById(invite.tournamentId);
    if (!tournament) throw new NotFoundError("Tournament", invite.tournamentId);

    // Prevent duplicate manager rows (idempotent if already a manager)
    const existing = await this.tournamentsRepo.findManager(
      invite.tournamentId,
      currentUser.id,
    );
    if (!existing) {
      await this.tournamentsRepo.addManager({
        id: crypto.randomUUID(),
        tournamentId: invite.tournamentId,
        userId: currentUser.id,
        addedBy: invite.createdBy,
        createdAt: Date.now(),
      });
    }

    // Stamp accepted_at (single-use)
    await this.tournamentsRepo.acceptInvite(invite.id);

    // Grant isDirector=true permanently
    await grantDirectorFlag(currentUser.id);

    return { tournamentId: tournament.id, tournamentName: tournament.name };
  }

  /**
   * Load invite details for the landing page (preview without accepting).
   * Returns null if token is invalid, expired, or already used.
   */
  async getInvitePreview(
    token: string,
  ): Promise<{
    invite: TournamentManagerInvite;
    tournamentName: string;
  } | null> {
    const invite = await this.tournamentsRepo.findInviteByToken(token);
    if (!invite) return null;
    if (invite.acceptedAt !== null) return null;
    if (Date.now() > invite.expiresAt) return null;

    const tournament = await this.tournamentsRepo.findById(invite.tournamentId);
    if (!tournament) return null;

    return { invite, tournamentName: tournament.name };
  }
}

export function makeTournamentManagerService(): TournamentManagerService {
  return new TournamentManagerService(new TournamentRepository(getDb()));
}

/** Generate a 48-char URL-safe hex token (24 random bytes). */
function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
