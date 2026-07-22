import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { makeRosterImportService } from "@/services/roster-import-service";
import { getDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { toActionError } from "./utils";

// Zod shape for a single validated row passed back from the client on confirm.
const validatedRowSchema = z.object({
  rowNumber: z.number().int(),
  status: z.enum(["valid", "error", "duplicate"]),
  email: z.string(),
  name: z.string(),
  jerseyNumber: z.number().int().positive().nullable(),
  dateOfBirth: z.string().nullable(),
  phone: z.string().nullable(),
  playerId: z.string().nullable(),
  errors: z.array(z.string()),
});

export const rosterImport = {
  // Step 1: Parse and validate the uploaded file. No DB writes.
  // Returns per-row results so the client can render the preview table.
  upload: defineAction({
    accept: "form",
    input: z.object({
      teamId: z.string(),
      file: z.instanceof(File),
    }),
    handler: async ({ teamId, file }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        const buffer = await file.arrayBuffer();
        const rows = await makeRosterImportService().parseAndValidate(
          buffer,
          file.name,
          teamId,
          user,
        );
        return { rows };
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),

  // Step 2: Commit the valid rows. Called after the coach reviews the preview and confirms.
  confirm: defineAction({
    input: z.object({
      teamId: z.string(),
      rows: z.array(validatedRowSchema),
    }),
    handler: async ({ teamId, rows }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        const result = await makeRosterImportService().commitImport(
          rows,
          teamId,
          user,
          getDb(),
        );
        return result;
      } catch (err) {
        if (err instanceof AppError) throw toActionError(err);
        throw err;
      }
    },
  }),
};
