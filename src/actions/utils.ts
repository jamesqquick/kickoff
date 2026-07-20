import { ActionError } from "astro:actions";
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "@/lib/errors";

// Converts a domain error thrown by a service into an Astro ActionError.
// Import this in every action handler's catch block — never inline the mapping.
//
// | Domain error    | ActionError code      |
// |-----------------|-----------------------|
// | NotFoundError   | NOT_FOUND             |
// | ForbiddenError  | FORBIDDEN             |
// | ValidationError | BAD_REQUEST           |
// | other AppError  | INTERNAL_SERVER_ERROR |
export function toActionError(err: AppError): ActionError {
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
