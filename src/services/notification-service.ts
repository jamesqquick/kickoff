import { NotFoundError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { NotificationRepository } from "@/repositories/notification-repository";
import type { Notification } from "@/lib/schema";
import type { NotificationType } from "@/lib/notifications";

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  referenceUrl?: string;
}

export class NotificationService {
  constructor(private readonly notificationsRepo: NotificationRepository) {}

  async createForUser(userId: string, payload: NotificationPayload): Promise<Notification> {
    const now = Date.now();
    return this.notificationsRepo.insert({
      id: crypto.randomUUID(),
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      referenceUrl: payload.referenceUrl ?? null,
      readAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  async listForUser(userId: string, limit = 10): Promise<Notification[]> {
    return this.notificationsRepo.listForUser(userId, limit);
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepo.findById(id);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundError("Notification", id);
    }
    return this.notificationsRepo.markRead(id, userId);
  }

  async markAllRead(userId: string): Promise<void> {
    return this.notificationsRepo.markAllRead(userId);
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notificationsRepo.unreadCount(userId);
  }
}

export function makeNotificationService(): NotificationService {
  return new NotificationService(new NotificationRepository(getDb()));
}
