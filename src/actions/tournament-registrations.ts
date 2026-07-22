import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { makeTournamentRegistrationService } from "@/services/tournament-registration-service";
import { toActionError } from "./utils";

export const tournamentRegistrations = {
  listByTournament: defineAction({
    input: z.object({ tournamentId: z.string() }),
    handler: async ({ tournamentId }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeTournamentRegistrationService().getRegistrationsForTournament(tournamentId);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  listByTeam: defineAction({
    input: z.object({ teamId: z.string() }),
    handler: async ({ teamId }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeTournamentRegistrationService().getRegistrationsForTeam(teamId);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  register: defineAction({
    input: z.object({
      teamId: z.string(),
      divisionId: z.string(),
    }),
    handler: async ({ teamId, divisionId }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeTournamentRegistrationService().registerTeam(teamId, divisionId, user);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  updateStatus: defineAction({
    input: z.object({
      registrationId: z.string(),
      status: z.enum(["pending", "approved", "waitlisted", "rejected"]),
      notes: z.string().optional(),
    }),
    handler: async ({ registrationId, status, notes }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeTournamentRegistrationService().updateRegistrationStatus(
          registrationId,
          status,
          notes,
          user,
        );
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),
};
