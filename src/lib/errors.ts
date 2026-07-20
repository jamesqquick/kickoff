// Domain errors — thrown by services, never by repositories or pages.
// Actions map these to ActionError via toActionError() in src/actions/index.ts.

export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(
    public readonly resource: string,
    public readonly id: string,
  ) {
    super(`${resource} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ForbiddenError extends AppError {
  constructor(public readonly action: string) {
    super(`Not allowed to perform action: ${action}`);
    this.name = "ForbiddenError";
  }
}
