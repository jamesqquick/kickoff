import { useState } from "react";
import { Bell } from "lucide-react";
import { actions } from "astro:actions";
import { formatNotificationRelativeTime } from "@/lib/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notification } from "@/lib/schema";

interface Props {
  initialUnreadCount: number;
}

export function NotificationBell({ initialUnreadCount }: Props) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [items, setItems] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadNotifications() {
    if (loaded) return;
    setLoading(true);
    try {
      const { data } = await actions.notifications.list();
      if (data) setItems(data);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  function handleClickNotification(notification: Notification) {
    if (!notification.readAt) {
      // Optimistic update immediately — don't block navigation on the await.
      setUnreadCount((c) => Math.max(0, c - 1));
      setItems((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, readAt: Date.now() } : n)),
      );
      // Fire-and-forget: DB write completes even after this component unmounts.
      actions.notifications.markRead({ id: notification.id }).catch(console.error);
    }
    if (notification.referenceUrl) {
      window.location.href = notification.referenceUrl;
    }
  }

  async function handleMarkAllRead() {
    const now = Date.now();
    setUnreadCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    await actions.notifications.markAllRead();
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) loadNotifications();
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex items-center justify-center w-8 h-8 rounded-md text-(--color-muted) hover:bg-(--color-border-soft) hover:text-(--color-foreground) transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-(--color-primary) text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between py-2">
          <span className="text-sm font-semibold text-(--color-foreground)">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-(--color-primary) hover:underline cursor-pointer"
            >
              Mark all as read
            </button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {loading && (
          <div className="py-8 text-center text-sm text-(--color-muted)">Loading…</div>
        )}

        {!loading && loaded && items.length === 0 && (
          <div className="py-8 text-center text-sm text-(--color-muted)">
            No notifications yet
          </div>
        )}

        {!loading && loaded && items.length > 0 && (
          <>
            {items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onSelect={() => handleClickNotification(n)}
                className="flex flex-col items-start gap-1 px-3 py-2.5 cursor-pointer focus:bg-(--color-border-soft)"
              >
                <div className="flex w-full items-start gap-2">
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full transition-colors ${
                      n.readAt ? "bg-transparent" : "bg-(--color-primary)"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-snug truncate ${
                        n.readAt
                          ? "font-normal text-(--color-muted)"
                          : "font-semibold text-(--color-foreground)"
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-(--color-muted) leading-snug line-clamp-2">
                      {n.body}
                    </p>
                    <p className="mt-1 text-[11px] text-(--color-muted-fg)">
                      {formatNotificationRelativeTime(n.createdAt)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            {/* Plain anchor — avoids DropdownMenuItem's focus:bg-accent which maps
                to --color-accent (orange) in Tailwind v4 rather than the neutral
                --accent shadcn variable. */}
            <div className="px-2 py-1.5">
              <a
                href="/notifications"
                className="flex w-full items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium text-(--color-muted) hover:bg-(--color-border-soft) hover:text-(--color-foreground) transition-colors cursor-pointer"
              >
                View all notifications
              </a>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


