import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { getDb } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { TournamentRepository } from "@/repositories/tournament-repository";
import { toActionError } from "./utils";
import { ValidationError, ForbiddenError } from "@/lib/errors";

/**
 * Update isCoach / isDirector directly in the auth user table.
 * These fields have input:false in Better Auth additionalFields, so they
 * cannot be set via getAuth().api.updateUser() with a user session —
 * only direct DB writes are safe here.
 */
async function setCapabilityFlags(
  userId: string,
  isCoach: boolean,
  isDirector: boolean,
): Promise<void> {
  const db = getDb();
  await db.$client
    .prepare(
      'UPDATE "user" SET isCoach = ?, isDirector = ?, updatedAt = ? WHERE id = ?',
    )
    .bind(isCoach ? 1 : 0, isDirector ? 1 : 0, Date.now(), userId)
    .run();
}

export const settings = {
  /**
   * Self-serve capability toggle. Guards:
   *  - At least one of isCoach / isDirector must remain true (non-admins).
   *  - Cannot disable isDirector while the user owns any tournament.
   */
  updateCapabilities: defineAction({
    input: z.object({
      isCoach: z.boolean(),
      isDirector: z.boolean(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in required" });

      // Admins are not subject to capability guards
      if (!isAdmin(user)) {
        if (!input.isCoach && !input.isDirector) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: "At least one capability (Coach or Director) must remain enabled.",
          });
        }

        // Cannot disable isDirector while owning any tournament
        if (user.isDirector && !input.isDirector) {
          const repo = new TournamentRepository(getDb());
          const ownedCount = await repo.countOwnedByUser(user.id);
          if (ownedCount > 0) {
            throw new ActionError({
              code: "BAD_REQUEST",
              message:
                `You cannot disable Tournament Director while you own ${ownedCount} tournament${ownedCount === 1 ? "" : "s"}. Transfer or delete your tournaments first.`,
            });
          }
        }
      }

      try {
        await setCapabilityFlags(user.id, input.isCoach, input.isDirector);
        return { isCoach: input.isCoach, isDirector: input.isDirector };
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  /**
   * Admin-only: set capability flags on any user.
   * Used by /admin/users/ management page.
   */
  adminSetCapabilities: defineAction({
    input: z.object({
      userId: z.string(),
      isCoach: z.boolean(),
      isDirector: z.boolean(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in required" });
      if (!isAdmin(user)) {
        throw new ActionError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      try {
        await setCapabilityFlags(input.userId, input.isCoach, input.isDirector);
        return { userId: input.userId, isCoach: input.isCoach, isDirector: input.isDirector };
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),
};
