import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { makePlayerService } from "@/services/player-service";
import { AppError } from "@/lib/errors";
import { toActionError } from "./utils";

export const players = {
  // No 'create' action — player rows are auto-created at user signup
  // via the Better Auth databaseHooks.user.create.after hook in src/lib/auth.ts.

  list: defineAction({
    handler: async () => {
      try {
        return await makePlayerService().listPlayers();
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),

  get: defineAction({
    input: z.object({ id: z.string() }),
    handler: async ({ id }) => {
      try {
        return await makePlayerService().getPlayer(id);
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),
};
