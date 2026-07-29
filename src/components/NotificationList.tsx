import { useState } from "react";
import { actions } from "astro:actions";
import { toast } from "sonner";
import type { Notification } from "@/lib/schema";
import {
  NOTIFICATION_TYPE_LABELS,
  formatNotificationDate,
} from "@/lib/notifications";

interface Props {
  initialNotifications: Notification[];
}

export function NotificationList({ initialNotifications }: Props) {
  const [items, setItems] = useState(initialNotifications);

  const unreadCount = items.filter((n) => !n.readAt).length;

  function handleClick(notification: Notification) {
    if (!notification.readAt) {
      // Optimistic update — fire-and-forget DB write, don't block navigation.
      setItems((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, readAt: Date.now() } : n,
        ),
      );
      actions.notifications.markRead({ id: notification.id }).catch(console.error);
    }
    if (notification.referenceUrl) {
      window.location.href = notification.referenceUrl;
    }
  }

  async function handleMarkAllRead() {
    const prev = [...items];
    const now = Date.now();
    setItems((current) => current.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    try {
      await actions.notifications.markAllRead();
    } catch {
      setItems(prev);
      toast.error("Could not mark notifications as read. Try again.");
    }
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-(--color-border) bg-(--color-surface) px-6 py-12 text-center">
        <p className="text-sm text-(--color-muted)">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {unreadCount > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-(--color-primary) hover:underline cursor-pointer"
          >
            Mark all as read
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => handleClick(n)}
              className={[
                "w-full flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors hover:bg-(--color-card-hover) cursor-pointer",
                n.readAt
                  ? "border-(--color-border) bg-(--color-surface)"
                  : "border-(--color-primary)/20 bg-(--color-primary-subtle)",
              ].join(" ")}
            >
              {/* Unread dot */}
              <span
                className={[
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  n.readAt ? "bg-transparent" : "bg-(--color-primary)",
                ].join(" ")}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className={[
                      "text-sm leading-snug",
                      n.readAt
                        ? "font-normal text-(--color-foreground)"
                        : "font-semibold text-(--color-foreground)",
                    ].join(" ")}
                  >
                    {n.title}
                  </p>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-(--color-border-soft) text-(--color-muted)">
                    {NOTIFICATION_TYPE_LABELS[n.type] ?? n.type}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-(--color-muted) leading-snug">{n.body}</p>
                <p className="mt-1 text-xs text-(--color-muted-fg)">
                  {formatNotificationDate(n.createdAt)}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
