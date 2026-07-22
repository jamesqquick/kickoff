import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { makeTeamMemberService } from "@/services/team-member-service";
import { toActionError } from "./utils";

export const teamMembers = {
  // Any authenticated user can request to join a team.
  requestJoin: defineAction({
    input: z.object({ teamId: z.string() }),
    handler: async ({ teamId }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeTeamMemberService().requestJoin(teamId, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  // Team owner / admin adds a user directly (status = approved).
  add: defineAction({
    input: z.object({
      userId: z.string(),
      teamId: z.string(),
      jerseyNumber: z.number().int().positive().optional(),
    }),
    handler: async ({ userId, teamId, jerseyNumber }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeTeamMemberService().addMember(userId, teamId, user, jerseyNumber);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  remove: defineAction({
    input: z.object({
      userId: z.string(),
      teamId: z.string(),
    }),
    handler: async ({ userId, teamId }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        await makeTeamMemberService().removeMember(userId, teamId, user);
        return { success: true };
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  listByTeam: defineAction({
    input: z.object({ teamId: z.string() }),
    handler: async ({ teamId }) => {
      try {
        return await makeTeamMemberService().listByTeam(teamId);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  approveRequest: defineAction({
    input: z.object({ userId: z.string(), teamId: z.string() }),
    handler: async ({ userId, teamId }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeTeamMemberService().approveRequest(userId, teamId, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  denyRequest: defineAction({
    input: z.object({ userId: z.string(), teamId: z.string() }),
    handler: async ({ userId, teamId }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        await makeTeamMemberService().denyRequest(userId, teamId, user);
        return { success: true };
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),
};
