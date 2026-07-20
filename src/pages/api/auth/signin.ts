import type { APIRoute } from "astro";
import { getAuth } from "@/lib/auth";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const email = form.get("email") as string;
  const password = form.get("password") as string;

  try {
    const { headers } = await getAuth().api.signInEmail({
      body: { email, password },
      headers: request.headers,
      returnHeaders: true,
    });

    headers.set("Location", "/dashboard");
    return new Response(null, { status: 302, headers });
  } catch {
    const params = new URLSearchParams({ error: "Invalid email or password" });
    return new Response(null, {
      status: 302,
      headers: { Location: `/signin?${params}` },
    });
  }
};
