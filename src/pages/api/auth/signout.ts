import type { APIRoute } from "astro";
import { getAuth } from "@/lib/auth";

// Signs the user out. Better Auth's own `/sign-out` endpoint returns JSON, so
// this wrapper calls the server API, forwards its Set-Cookie (which clears the
// session cookie), and issues a browser redirect to the sign-in page. A static
// route under /api/auth takes precedence over the [...all] catch-all.
export const POST: APIRoute = async ({ request }) => {
  const { headers } = await getAuth().api.signOut({
    headers: request.headers,
    returnHeaders: true,
  });

  headers.set("Location", "/signin");
  return new Response(null, { status: 302, headers });
};
