import type { APIRoute } from "astro";
import { getAuth } from "@/lib/auth";
import { redirectWithError } from "@/lib/http";
import { sameOriginRedirect } from "@/lib/http";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const redirectTo = sameOriginRedirect(String(form.get("redirect") ?? ""));

  try {
    const { headers } = await getAuth().api.signInEmail({
      body: {
        email: String(form.get("email")),
        password: String(form.get("password")),
      },
      headers: request.headers, // forward incoming cookies
      returnHeaders: true, // capture Better Auth's Set-Cookie
    });

    headers.set("Location", redirectTo ?? "/dashboard");
    return new Response(null, { status: 302, headers });
  } catch {
    return redirectWithError("/signin", "Invalid email or password", redirectTo ? { redirect: redirectTo } : undefined);
  }
};
