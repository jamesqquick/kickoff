import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { makeNotificationService } from "@/services/notification-service";
import { toActionError } from "./utils";

export const notifications = {
  /** Fetch the 10 most recent notifications for the current user. */
  list: defineAction({
    handler: async (_input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeNotificationService().listForUser(user.id);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  /** Mark a single notification as read. Returns the updated notification. */
  markRead: defineAction({
    input: z.object({ id: z.string() }),
    handler: async ({ id }, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        return await makeNotificationService().markRead(id, user.id);
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  /** Mark all notifications for the current user as read. */
  markAllRead: defineAction({
    handler: async (_input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }
      try {
        await makeNotificationService().markAllRead(user.id);
        return { success: true };
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),
};
