import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { makePlayerTeamService } from "@/services/player-team-service";
import { AppError } from "@/lib/errors";
import { toActionError } from "./utils";

export const playerTeams = {
  // Player requests to join a team. Only teamId is needed as input —
  // the service resolves the caller's player record from context.locals.user.
  requestJoin: defineAction({
    input: z.object({ teamId: z.string() }),
    handler: async ({ teamId }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makePlayerTeamService().requestJoin(teamId, user);
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),

  // Coach / admin adds a player directly (status = approved).
  add: defineAction({
    input: z.object({
      playerId: z.string(),
      teamId: z.string(),
      jerseyNumber: z.number().int().positive().optional(),
    }),
    handler: async ({ playerId, teamId, jerseyNumber }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makePlayerTeamService().addPlayer(playerId, teamId, user, jerseyNumber);
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),

  remove: defineAction({
    input: z.object({
      playerId: z.string(),
      teamId: z.string(),
    }),
    handler: async ({ playerId, teamId }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        await makePlayerTeamService().removePlayer(playerId, teamId, user);
        return { success: true };
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),

  listByTeam: defineAction({
    input: z.object({ teamId: z.string() }),
    handler: async ({ teamId }) => {
      try {
        return await makePlayerTeamService().listByTeam(teamId);
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),

  approveRequest: defineAction({
    input: z.object({ playerId: z.string(), teamId: z.string() }),
    handler: async ({ playerId, teamId }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makePlayerTeamService().approveRequest(playerId, teamId, user);
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),

  denyRequest: defineAction({
    input: z.object({ playerId: z.string(), teamId: z.string() }),
    handler: async ({ playerId, teamId }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        await makePlayerTeamService().denyRequest(playerId, teamId, user);
        return { success: true };
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),
};
