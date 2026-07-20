# Architecture

Astro 7 + Cloudflare Workers. Modular monolith. Server-first.

## Stack

| Area | Choice |
|---|---|
| Framework | Astro 7, React (islands only) |
| Styling | Tailwind CSS, shadcn/ui |
| Deployment | Cloudflare Workers |
| Database | Cloudflare D1 |
| Storage | Cloudflare R2 |
| Cache / Config | Cloudflare KV |
| Background Jobs | Cloudflare Workflows + Queues |
| Auth | Better Auth |
| Payments | Stripe |
| Email | Cloudflare Email |

## Request Flow

```
Browser → Cloudflare Worker → Astro Page → Action / Service → Repository → D1 / R2 / External
```

## Layers

**Pages** — Routing and rendering only. Fetch data from services. No business logic.

**Actions** — Handle user mutations. Define input schema inline with Zod via `defineAction({ input: z.object({...}) })`. Use `z.infer<typeof schema>` for any TypeScript types derived from action inputs — never duplicate a Zod schema as a manual TypeScript type. Validate input, authenticate, call a service. No SQL, no business rules.

**API Endpoints** (`src/pages/api/`) — External consumers (webhooks, public feeds, exports, future mobile API) **and** auth mutations that must set/clear the session cookie. See [Auth Routes](#auth-routes--exception-to-api-endpoints-are-external-only).

**Services** — All business logic. No HTTP, no Astro. Examples: `TeamService`, `ScheduleService`, `PlayerService`.

**Repositories** — All database access. No HTTP, no business logic. Examples: `TeamRepository`, `GameRepository`.

## Rendering

- **SSR** (default): admin, coach, referee, registration, payments, user data
- **Prerender**: static marketing pages (FAQ, rules, about, sponsor info)

## React Usage

Only where stateful interaction is required: schedule builder, bracket editor, drag-and-drop, live scores, dynamic roster editor. Everything else is Astro.

## Forms

HTML forms + Astro Actions by default. Progressive enhancement. Server validation is authoritative.

**Exception:** any mutation whose response must set or clear a cookie (auth) cannot use Actions — Astro Actions do not forward the internal `Set-Cookie` to the browser. Those use POST API routes instead. See [Auth Routes](#auth-routes--exception-to-api-endpoints-are-external-only).

## Background Jobs

Long-running work (email, SMS, imports, schedule generation, report generation) goes through Cloudflare Workflows or Queues — never in a request handler.

## Scheduling Engine

Isolated behind an interface (`SchedulingEngine.generate()`, `SchedulingEngine.validate()`). No Astro or HTTP dependencies. Unit-testable and background-runnable.

## Caching

Edge-cache public pages (schedules, results, brackets, venues). Never cache authenticated or sensitive responses.

## Environment Variables

Use Astro's built-in `astro:env` API. Never use `import.meta.env` directly or a manual env validation file.

Define all variables in `astro.config.mjs` with `envField`:

- `context: "server"` — only available server-side
- `context: "client"` — safe to expose in the browser
- `access: "secret"` — not included in the bundle
- `access: "public"` — included in the bundle

Enable `validateSecrets: true` so missing required secrets fail at Worker startup, not at runtime.

Import from the appropriate virtual module:

- Server vars: `import { DATABASE_URL } from "astro:env/server"`
- Client vars: `import { PUBLIC_APP_URL } from "astro:env/client"`

## Middleware

Auth, session lookup, current user population, security headers, logging, request IDs. Authorization enforced inside services.

## Auth Routes — exception to "API endpoints are external-only"

Better Auth sets the session via `Set-Cookie` on its **own** response. Astro
Actions do **not** forward those headers to the browser, so auth mutations that
set or clear the session cookie live as POST API routes under
`src/pages/api/auth/`, not as Actions. Better Auth itself (`getAuth()`) is the
service — do not wrap it in an `AuthService`.

Canonical pattern — forward incoming cookies in, capture Better Auth's headers
out, and reuse that same `Headers` object for the redirect so the cookie and
the `Location` ship together:

```ts
// src/pages/api/auth/signin.ts
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
      returnHeaders: true,      // capture Better Auth's Set-Cookie
    });
    headers.set("Location", "/dashboard");
    return new Response(null, { status: 302, headers });
  } catch {
    // Always redirect back to the form with ?error= — never return raw text.
    return redirectWithError("/signin", "Invalid email or password");
  }
};
```

Rules for `src/pages/api/auth/*`:

- Always pass `headers: request.headers` in and `returnHeaders: true` out, then
  reuse that `Headers` for the 302 — otherwise the session cookie is lost.
- On failure, **redirect** to the originating form via `redirectWithError()`
  (`src/lib/http.ts`), adding `{ tab: "signup" }` where relevant. Never return
  plain-text or JSON errors from these routes.
- Parse form fields with `String(form.get("x"))`, not `as string` — the cast
  lies when a field is missing.
- Custom Better Auth fields (e.g. `role`) aren't in the base `signUpEmail`
  type. Cast the `body`; don't duplicate the type.
- Static routes here (`signin.ts`, `signout.ts`, `signin/google.ts`) take
  precedence over the `[...all].ts` catch-all that mounts Better Auth's own
  handlers.
