import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { getAuth } from "@/lib/auth";

export const auth = {
  signIn: defineAction({
    input: z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(1, "Password is required"),
    }),
    handler: async ({ email, password }, context) => {
      const result = await getAuth().api.signInEmail({
        body: { email, password },
        headers: context.request.headers,
      });
      if (!result) {
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }
      return { success: true };
    },
  }),

  signUp: defineAction({
    input: z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      email: z.string().email("Invalid email address"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters"),
      role: z.enum(["coach", "player", "organizer", "referee"]),
    }),
    handler: async ({ firstName, lastName, email, password, role }, context) => {
      const result = await getAuth().api.signUpEmail({
        body: {
          name: `${firstName} ${lastName}`,
          email,
          password,
          // Better Auth passes additional fields through the body at runtime;
          // the base type doesn't include them, so we spread to bypass.
          role,
        },
        headers: context.request.headers,
      });
      if (!result) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Could not create account. The email may already be in use.",
        });
      }
      return { success: true };
    },
  }),
};
