import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { makeTeamInviteService } from "@/services/team-invite-service";
import { toActionError } from "./utils";

export const teamInvites = {
  // Coach: get the active invite for their team (creates one if none exists).
  getOrCreate: defineAction({
    input: z.object({ teamId: z.string() }),
    handler: async ({ teamId }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeTeamInviteService().getOrCreate(teamId, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  // Coach: revoke current token and generate a fresh one.
  regenerate: defineAction({
    input: z.object({ teamId: z.string() }),
    handler: async ({ teamId }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeTeamInviteService().regenerate(teamId, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  // Player: join a team via an invite token (auto-approved).
  join: defineAction({
    input: z.object({ token: z.string() }),
    handler: async ({ token }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeTeamInviteService().joinViaToken(token, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),
};
