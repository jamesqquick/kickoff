import { and, count, desc, eq, isNull } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db";
import { notifications } from "@/lib/schema";
import type { NewNotification, Notification } from "@/lib/schema";

export class NotificationRepository {
  constructor(private readonly db: AppDatabase) {}

  async listForUser(userId: string, limit = 10): Promise<Notification[]> {
    return this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .all();
  }

  async unreadCount(userId: string): Promise<number> {
    const rows = await this.db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
      .all();
    return rows[0]?.count ?? 0;
  }

  async findById(id: string): Promise<Notification | undefined> {
    const results = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);
    return results[0];
  }

  async insert(row: NewNotification): Promise<Notification> {
    const results = await this.db.insert(notifications).values(row).returning();
    return results[0];
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const results = await this.db
      .update(notifications)
      .set({ readAt: Date.now(), updatedAt: Date.now() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return results[0];
  }

  async markAllRead(userId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ readAt: Date.now(), updatedAt: Date.now() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  }
}
