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

**Actions** — Handle user mutations. Validate input, authenticate, call a service. No SQL, no business rules.

**API Endpoints** (`src/pages/api/`) — External consumers only: webhooks, public feeds, exports, future mobile API.

**Services** — All business logic. No HTTP, no Astro. Examples: `TeamService`, `ScheduleService`, `PlayerService`.

**Repositories** — All database access. No HTTP, no business logic. Examples: `TeamRepository`, `GameRepository`.

## Rendering

- **SSR** (default): admin, coach, referee, registration, payments, user data
- **Prerender**: static marketing pages (FAQ, rules, about, sponsor info)

## React Usage

Only where stateful interaction is required: schedule builder, bracket editor, drag-and-drop, live scores, dynamic roster editor. Everything else is Astro.

## Forms

HTML forms + Astro Actions by default. Progressive enhancement. Server validation is authoritative.

## Background Jobs

Long-running work (email, SMS, imports, schedule generation, report generation) goes through Cloudflare Workflows or Queues — never in a request handler.

## Scheduling Engine

Isolated behind an interface (`SchedulingEngine.generate()`, `SchedulingEngine.validate()`). No Astro or HTTP dependencies. Unit-testable and background-runnable.

## Caching

Edge-cache public pages (schedules, results, brackets, venues). Never cache authenticated or sensitive responses.

## Middleware

Auth, session lookup, current user population, security headers, logging, request IDs. Authorization enforced inside services.
