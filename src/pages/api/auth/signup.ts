import type { APIRoute } from "astro";
import { getAuth } from "@/lib/auth";
import { redirectWithError } from "@/lib/http";
import { sameOriginRedirect } from "@/lib/http";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const firstName = String(form.get("firstName")).trim();
  const lastName = String(form.get("lastName")).trim();
  const redirectTo = sameOriginRedirect(String(form.get("redirect") ?? ""));

  try {
    const { headers } = await getAuth().api.signUpEmail({
      body: {
        name: `${firstName} ${lastName}`,
        email: String(form.get("email")),
        password: String(form.get("password")),
      },
      headers: request.headers, // forward incoming cookies
      returnHeaders: true, // capture Better Auth's Set-Cookie
    });

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
