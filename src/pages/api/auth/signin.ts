import type { APIRoute } from "astro";
import { getAuth } from "@/lib/auth";
import { redirectWithError } from "@/lib/http";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();

  try {
    const { headers } = await getAuth().api.signInEmail({
      body: {
        email: String(form.get("email")),
        password: String(form.get("password")),
      },
      headers: request.headers, // forward incoming cookies
      returnHeaders: true, // capture Better Auth's Set-Cookie
    });

    headers.set("Location", "/dashboard");
    return new Response(null, { status: 302, headers });
  } catch {
    return redirectWithError("/signin", "Invalid email or password");
  }
};
