import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { makeTeamService } from "@/services/team-service";
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";
import type { AppError } from "@/lib/errors";

// Map domain errors to ActionError codes.
// Used by all actions — keep this in sync with ARCHITECTURE.md.
function toActionError(err: AppError): ActionError {
  if (err instanceof NotFoundError) {
    return new ActionError({ code: "NOT_FOUND", message: err.message });
  }
  if (err instanceof ForbiddenError) {
    return new ActionError({ code: "FORBIDDEN", message: err.message });
  }
  if (err instanceof ValidationError) {
    return new ActionError({ code: "BAD_REQUEST", message: err.message });
  }
  return new ActionError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
}

export const teams = {
  list: defineAction({
    handler: async () => {
      const service = makeTeamService();
      return service.listTeams();
    },
  }),

  get: defineAction({
    input: z.object({ id: z.string() }),
    handler: async ({ id }) => {
      const service = makeTeamService();
      try {
        return await service.getTeam(id);
      } catch (err) {
        if (err instanceof NotFoundError) throw toActionError(err);
        throw err;
      }
    },
  }),

  create: defineAction({
    input: z.object({
      name: z.string().min(1, "Team name is required"),
      city: z.string().min(1, "City is required"),
      division: z.string().min(1, "Division is required"),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }

      const service = makeTeamService();
      try {
        return await service.createTeam(input, user);
      } catch (err) {
        if (err instanceof ForbiddenError || err instanceof ValidationError) {
          throw toActionError(err);
        }
        throw err;
      }
    },
  }),
};
