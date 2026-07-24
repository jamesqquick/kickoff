import type { APIRoute } from "astro";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { redirectWithError, sameOriginRedirect } from "@/lib/http";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const firstName = String(form.get("firstName")).trim();
  const lastName = String(form.get("lastName")).trim();
  const redirectTo = sameOriginRedirect(String(form.get("redirect") ?? ""));

  // Read capability flags from the form (at least one must be true)
  const isCoach = form.get("isCoach") === "1";
  const isDirector = form.get("isDirector") === "1";

  if (!isCoach && !isDirector) {
    return redirectWithError(
      "/signin",
      "Please select at least one capability (Coach or Director) to continue.",
      redirectTo ? { tab: "signup", redirect: redirectTo } : { tab: "signup" },
    );
  }

  try {
    // Step 1: create the Better Auth user (isCoach/isDirector default to false)
    const result = await getAuth().api.signUpEmail({
      body: {
        name: `${firstName} ${lastName}`,
        email: String(form.get("email")),
        password: String(form.get("password")),
      },
      headers: request.headers,
      returnHeaders: true,
    });

    const userId = result.response?.user?.id;
    const headers = result.headers;

    if (!userId) {
      return redirectWithError(
        "/signin",
        "Could not create account. The email may already be in use.",
        redirectTo ? { tab: "signup", redirect: redirectTo } : { tab: "signup" },
      );
    }

    // Step 2: set isCoach / isDirector via direct D1 update.
    // These fields have input:false in Better Auth additionalFields, so they
    // cannot be set via signUpEmail body — only server-side DB writes are allowed.
    await getDb()
      .$client.prepare(
        'UPDATE "user" SET isCoach = ?, isDirector = ?, updatedAt = ? WHERE id = ?',
      )
      .bind(isCoach ? 1 : 0, isDirector ? 1 : 0, Date.now(), userId)
      .run();

    headers.set("Location", redirectTo ?? "/dashboard");
    return new Response(null, { status: 302, headers });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Could not create account. The email may already be in use.";
    return redirectWithError(
      "/signin",
      message,
      redirectTo ? { tab: "signup", redirect: redirectTo } : { tab: "signup" },
    );
  }
};
