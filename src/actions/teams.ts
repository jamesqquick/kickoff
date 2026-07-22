import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { makeTeamService } from "@/services/team-service";
import { toActionError } from "./utils";

export const teams = {
  list: defineAction({
    handler: async () => {
      try {
        return await makeTeamService().listTeams();
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  get: defineAction({
    input: z.object({ id: z.string() }),
    handler: async ({ id }) => {
      try {
        return await makeTeamService().getTeam(id);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  create: defineAction({
    input: z.object({
      name: z.string().min(1, "Team name is required"),
      city: z.string().min(1, "City is required"),
      color: z.string().default("emerald"),
      shortName: z.string().max(2).optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeTeamService().createTeam(input, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  update: defineAction({
    input: z.object({
      id: z.string(),
      name: z.string().min(1, "Team name is required"),
      city: z.string(),
      color: z.string().default("emerald"),
      shortName: z.string().max(2).optional(),
    }),
    handler: async ({ id, name, city, color, shortName }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeTeamService().updateTeam(id, { name, city, color, shortName }, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),
};
