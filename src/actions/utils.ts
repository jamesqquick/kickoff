import { ActionError } from "astro:actions";
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "@/lib/errors";

// Converts any thrown value into a sanitized Astro ActionError.
// Raw DB / infrastructure errors are logged server-side and replaced with a
// generic message so internal details never reach the client.
//
// | Input                | ActionError code      |
// |----------------------|-----------------------|
// | NotFoundError        | NOT_FOUND             |
// | ForbiddenError       | FORBIDDEN             |
// | ValidationError      | BAD_REQUEST           |
// | ActionError (pass-through) | (unchanged)     |
// | other AppError       | INTERNAL_SERVER_ERROR |
// | anything else        | INTERNAL_SERVER_ERROR (sanitized) |
export function toActionError(err: unknown): ActionError {
  // Already an ActionError — pass through (e.g. UNAUTHORIZED thrown inline).
  if (err instanceof ActionError) return err;

  if (err instanceof NotFoundError) {
    return new ActionError({ code: "NOT_FOUND", message: err.message });
  }
  if (err instanceof ForbiddenError) {
    return new ActionError({ code: "FORBIDDEN", message: err.message });
  }
  if (err instanceof ValidationError) {
    return new ActionError({ code: "BAD_REQUEST", message: err.message });
  }
  if (err instanceof AppError) {
    return new ActionError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
  }

  // Unknown error — log the real cause server-side, return a generic message.
  console.error("[action] Unexpected error:", err);
  return new ActionError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong. Please try again.",
  });
}
