import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { makeDivisionService } from "@/services/division-service";
import { TournamentRegistrationRepository } from "@/repositories/tournament-registration-repository";
import { getDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { toActionError } from "./utils";

export const divisions = {
  list: defineAction({
    input: z.object({ tournamentId: z.string() }),
    handler: async ({ tournamentId }) => {
      try {
        return await makeDivisionService().getDivisionsForTournament(tournamentId);
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),

  create: defineAction({
    input: z.object({
      tournamentId: z.string(),
      name: z.string().min(1, "Division name is required"),
      maxTeams: z.number().int().positive().nullable().optional(),
    }),
    handler: async ({ tournamentId, name, maxTeams }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeDivisionService().createDivision(tournamentId, { name, maxTeams }, user);
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),

  update: defineAction({
    input: z.object({
      id: z.string(),
      name: z.string().min(1, "Division name is required").optional(),
      maxTeams: z.number().int().positive().nullable().optional(),
    }),
    handler: async ({ id, name, maxTeams }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeDivisionService().updateDivision(id, { name, maxTeams }, user);
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),

  delete: defineAction({
    input: z.object({ id: z.string() }),
    handler: async ({ id }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        await makeDivisionService().deleteDivision(id, user);
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),

  // Returns the number of team registrations in a division.
  // Called by DivisionManager before showing the delete confirmation dialog.
  getRegistrationCount: defineAction({
    input: z.object({ id: z.string() }),
    handler: async ({ id }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      const repo = new TournamentRegistrationRepository(getDb());
      return repo.countByDivision(id);
    },
  }),
};
