import type { APIRoute } from "astro";
import { getAuth } from "@/lib/auth";
import { redirectWithError } from "@/lib/http";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const firstName = String(form.get("firstName")).trim();
  const lastName = String(form.get("lastName")).trim();

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

    headers.set("Location", "/dashboard");
    return new Response(null, { status: 302, headers });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Could not create account. The email may already be in use.";
    return redirectWithError("/signin", message, { tab: "signup" });
  }
};
