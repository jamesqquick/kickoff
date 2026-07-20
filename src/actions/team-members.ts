import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { makeTeamMemberService } from "@/services/team-member-service";
import { AppError } from "@/lib/errors";
import { toActionError } from "./utils";

export const teamMembers = {
  // Any authenticated user can request to join a team.
  // The service resolves the caller's identity from context.locals.user.
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
        if (err instanceof AppError) throw toActionError(err);
        throw err;
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
        if (err instanceof AppError) throw toActionError(err);
        throw err;
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
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),

  listByTeam: defineAction({
    input: z.object({ teamId: z.string() }),
    handler: async ({ teamId }) => {
      try {
        return await makeTeamMemberService().listByTeam(teamId);
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
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
        if (err instanceof AppError) throw toActionError(err);
        throw err;
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
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),
};
