import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { makeTournamentService } from "@/services/tournament-service";
import { AppError } from "@/lib/errors";
import { toActionError } from "./utils";

export const tournaments = {
  list: defineAction({
    handler: async () => {
      try {
        return await makeTournamentService().listTournaments();
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),

  create: defineAction({
    input: z.object({
      name: z.string().min(1, "Tournament name is required"),
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeTournamentService().createTournament(input, user);
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),

  update: defineAction({
    input: z.object({
      id: z.string(),
      name: z.string().min(1, "Tournament name is required").optional(),
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      status: z.enum(["draft", "active", "completed"]).optional(),
    }),
    handler: async ({ id, ...input }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeTournamentService().updateTournament(id, input, user);
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),
};
