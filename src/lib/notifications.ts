// Notification type constants — stored in notifications.type column.
// All business logic that creates notifications must use one of these values
// so the UI can render type-specific icons or copy if needed in the future.
export const NOTIFICATION_TYPES = {
  /** A director approved, rejected, or waitlisted a team's tournament registration. */
  REGISTRATION_STATUS_CHANGED: "registration_status_changed",
  /** A team submitted a registration for a tournament the user directs or manages. */
  NEW_REGISTRATION_SUBMITTED: "new_registration_submitted",
  /** A player joined a team the user coaches via the invite link. */
  PLAYER_JOINED_TEAM: "player_joined_team",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
