import type { APIRoute } from "astro";
import { getAuth } from "@/lib/auth";
import { redirectWithError } from "@/lib/http";

// Starts the Google OAuth flow. Better Auth's social sign-in is a POST to
// `/sign-in/social` that returns the provider URL as JSON — it has no
// browser-navigable GET endpoint. This route lets the plain anchor button work:
// it calls the server API, forwards Better Auth's Set-Cookie (OAuth state/PKCE)
// so the callback validates, and redirects the browser to Google.
export const GET: APIRoute = async ({ request }) => {
  const { headers, response } = await getAuth().api.signInSocial({
    body: { provider: "google", callbackURL: "/dashboard" },
    headers: request.headers,
    returnHeaders: true,
  });

  if (!response?.url) {
    return redirectWithError("/signin", "Could not start Google sign-in");
  }

  headers.set("Location", response.url);
  return new Response(null, { status: 302, headers });
};
