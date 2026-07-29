import { defineMiddleware } from "astro:middleware";
import { getAuth } from "@/lib/auth";
import type { AppUser } from "@/lib/auth";

const PUBLIC_ROUTES = new Set(["/signin", "/"]);
const PUBLIC_PREFIXES = [
  "/join/",
  "/director/join/", // manager invite landing — public so invitee can authenticate first
];
const AUTH_API_PATTERN = /^\/api\/auth\//;

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals, redirect, url } = context;

  if (AUTH_API_PATTERN.test(url.pathname)) return next();

  const session = await getAuth().api.getSession({ headers: request.headers });
  locals.user = (session?.user ?? null) as AppUser | null;
  locals.session = session?.session ?? null;

  const { pathname } = url;

  // ── Unauthenticated users ──────────────────────────────────────────────────
  if (!locals.user) {
    if (!isPublicRoute(pathname)) {
      return redirect(`/signin?redirect=${encodeURIComponent(pathname)}`);
    }
    return next();
  }

  // ── Authenticated: bounce off sign-in page ─────────────────────────────────
  if (pathname === "/signin") {
    return redirect("/dashboard");
  }

  const user = locals.user;

  // ── Onboarding gate: no capabilities set yet ──────────────────────────────
  // Catches both Google OAuth signups (which bypass the checkbox form) and any
  // edge case where flags were never written. Redirect to settings so the user
  // can pick Coach / Director before accessing the rest of the app.
  // Exclude /_actions/* so action POST requests are never intercepted.
  const needsOnboarding =
    !user.isCoach && !user.isDirector && user.role !== "admin";
  if (needsOnboarding && pathname !== "/settings" && !pathname.startsWith("/_actions/")) {
    return redirect("/settings?onboarding=1");
  }

  // ── Admin-only routes (/admin/*) ───────────────────────────────────────────
  if (pathname.startsWith("/admin/")) {
    if (user.role !== "admin") return redirect("/dashboard");
    return next();
  }

  // ── Director routes (/director/*) — except the public join landing ─────────
  if (pathname.startsWith("/director/") && !pathname.startsWith("/director/join/")) {
    if (!user.isDirector && user.role !== "admin") return redirect("/dashboard");
    return next();
  }

  // ── Coach-only pages ────────────────────────────────────────────────────────
  const coachOnlyPaths = ["/my-teams", "/teams/register"];
  const isCoachOnlyExact = coachOnlyPaths.includes(pathname);
  // /teams/[id]/edit  and  /tournaments/[id]/register
  const isCoachOnlyDynamic =
    /^\/teams\/[^/]+\/edit$/.test(pathname) ||
    /^\/tournaments\/[^/]+\/register$/.test(pathname);

  if ((isCoachOnlyExact || isCoachOnlyDynamic) && !user.isCoach && user.role !== "admin") {
    return redirect("/dashboard");
  }

  return next();
});
