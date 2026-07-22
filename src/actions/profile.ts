import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { getAuth } from "@/lib/auth";
import { makeProfileService } from "@/services/profile-service";
import { toActionError } from "./utils";

export const profile = {
  save: defineAction({
    input: z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string(),
      phone: z.string().optional(),
      dateOfBirth: z.string().optional(),
      addressStreet: z.string().optional(),
      addressApt: z.string().optional(),
      addressCity: z.string().optional(),
      addressState: z.string().optional(),
      addressZip: z.string().optional(),
      addressCountry: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }

      // Update name in the Better Auth user table.
      const name = [input.firstName, input.lastName].filter(Boolean).join(" ");
      try {
        await getAuth().api.updateUser({
          body: { name },
          headers: context.request.headers,
        });
      } catch {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not update name. Please try again.",
        });
      }

      // Upsert extended profile fields.
      try {
        await makeProfileService().updateProfile(user.id, {
          phone: input.phone || undefined,
          dateOfBirth: input.dateOfBirth || undefined,
          addressStreet: input.addressStreet || undefined,
          addressApt: input.addressApt || undefined,
          addressCity: input.addressCity || undefined,
          addressState: input.addressState || undefined,
          addressZip: input.addressZip || undefined,
          addressCountry: input.addressCountry || undefined,
        });
      } catch (err) {
        throw toActionError(err);
      }
    },
  }),

  updatePassword: defineAction({
    input: z
      .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
        confirmPassword: z.string().min(1, "Please confirm your new password"),
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "You must be signed in" });
      }

      try {
        await getAuth().api.changePassword({
          body: {
            currentPassword: input.currentPassword,
            newPassword: input.newPassword,
            revokeOtherSessions: false,
          },
          headers: context.request.headers,
        });
      } catch {
        // Better Auth throws when the current password is wrong; don't expose the raw message.
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Current password is incorrect.",
        });
      }
    },
  }),
};
