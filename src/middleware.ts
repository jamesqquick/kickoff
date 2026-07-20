import { defineMiddleware } from "astro:middleware";
import { getAuth } from "@/lib/auth";
import type { AppUser } from "@/lib/auth";

// Routes that don't require authentication
const PUBLIC_ROUTES = new Set(["/signin", "/"]);

// Better Auth's own API routes — always pass through
const AUTH_API_PATTERN = /^\/api\/auth\//;

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals, redirect, url } = context;

  if (AUTH_API_PATTERN.test(url.pathname)) {
    return next();
  }

  const session = await getAuth().api.getSession({
    headers: request.headers,
  });

  // Cast to AppUser: Better Auth returns the base User type but our schema
  // always includes `role` via additionalFields — the cast is safe at runtime.
  locals.user = (session?.user ?? null) as AppUser | null;
  locals.session = session?.session ?? null;

  // Redirect unauthenticated users away from protected routes
  if (!locals.user && !PUBLIC_ROUTES.has(url.pathname)) {
    return redirect("/signin");
  }

  // Redirect authenticated users away from sign-in
  if (locals.user && url.pathname === "/signin") {
    return redirect("/dashboard");
  }

  return next();
});
