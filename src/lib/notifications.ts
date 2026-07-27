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

// Human-readable label for each notification type.
// Used by NotificationBell and NotificationList to render a category badge.
// Add an entry here when adding a new NOTIFICATION_TYPES value.
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  [NOTIFICATION_TYPES.REGISTRATION_STATUS_CHANGED]: "Registration",
  [NOTIFICATION_TYPES.NEW_REGISTRATION_SUBMITTED]: "Registration",
  [NOTIFICATION_TYPES.PLAYER_JOINED_TEAM]: "Team",
};

/**
 * Short relative timestamp for notification list rows, e.g. "3h ago", "2d ago".
 * Used in bell dropdown where space is tight.
 */
export function formatNotificationRelativeTime(epochMs: number): string {
  const diff = Date.now() - epochMs;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(epochMs).toLocaleDateString();
}

/**
 * Full absolute timestamp for the dedicated notifications page,
 * e.g. "Nov 14, 2023, 10:00 AM".
 */
export function formatNotificationDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
