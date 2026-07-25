import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { makeTournamentManagerService } from "@/services/tournament-manager-service";
import { toActionError } from "./utils";

export const tournamentManagers = {
  listManagers: defineAction({
    input: z.object({ tournamentId: z.string() }),
    handler: async ({ tournamentId }, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in required" });
      try {
        return await makeTournamentManagerService().listManagers(tournamentId, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  addManager: defineAction({
    input: z.object({
      tournamentId: z.string(),
      userId: z.string().min(1, "User ID is required"),
    }),
    handler: async ({ tournamentId, userId }, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in required" });
      try {
        return await makeTournamentManagerService().addManager(tournamentId, userId, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  removeManager: defineAction({
    input: z.object({
      tournamentId: z.string(),
      userId: z.string(),
    }),
    handler: async ({ tournamentId, userId }, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in required" });
      try {
        await makeTournamentManagerService().removeManager(tournamentId, userId, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  listInvites: defineAction({
    input: z.object({ tournamentId: z.string() }),
    handler: async ({ tournamentId }, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in required" });
      try {
        return await makeTournamentManagerService().listInvites(tournamentId, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  generateInvite: defineAction({
    input: z.object({ tournamentId: z.string() }),
    handler: async ({ tournamentId }, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in required" });
      try {
        return await makeTournamentManagerService().generateInvite(tournamentId, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  revokeInvite: defineAction({
    input: z.object({ inviteId: z.string() }),
    handler: async ({ inviteId }, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in required" });
      try {
        await makeTournamentManagerService().revokeInvite(inviteId, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  acceptInvite: defineAction({
    input: z.object({ token: z.string().min(1, "Token is required") }),
    handler: async ({ token }, context) => {
      const user = context.locals.user;
      if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in required" });
      try {
        return await makeTournamentManagerService().acceptInvite(token, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),
};
