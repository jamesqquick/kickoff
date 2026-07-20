import type { APIRoute } from "astro";
import { getAuth } from "@/lib/auth";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const firstName = (form.get("firstName") as string).trim();
  const lastName = (form.get("lastName") as string).trim();
  const email = form.get("email") as string;
  const password = form.get("password") as string;
  const role = form.get("role") as string;

  try {
    // Better Auth forwards unknown body fields to the database at runtime.
    // The base signUpEmail type doesn't include custom fields, so we cast.
    const body = { name: `${firstName} ${lastName}`, email, password, role } as {
      name: string;
      email: string;
      password: string;
    };

    const { headers } = await getAuth().api.signUpEmail({
      body,
      headers: request.headers,
      returnHeaders: true,
    });

    headers.set("Location", "/dashboard");
    return new Response(null, { status: 302, headers });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Could not create account. The email may already be in use.";
    const params = new URLSearchParams({ tab: "signup", error: message });
    return new Response(null, {
      status: 302,
      headers: { Location: `/signin?${params}` },
    });
  }
};
