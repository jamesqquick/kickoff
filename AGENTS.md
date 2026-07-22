## Worktrees

New feature work goes in a worktree under `.worktrees/` (gitignored). Use the `kickoff-worktree` skill — it handles the full bootstrap: creates the branch, copies `.env` and `.wrangler` state, runs `astro sync`, and applies local D1 migrations.

```bash
# Quick reference — the skill documents every step
git worktree add .worktrees/<slug> -b feat/<slug>
cp .env .worktrees/<slug>/.env
cp -R .wrangler .worktrees/<slug>/.wrangler
cd .worktrees/<slug> && pnpm astro sync && pnpm db:migrate:local && pnpm db:seed:local
```

## Seed Data

- Local D1 is seeded via `pnpm db:seed:local` (runs `seed/seed.sql`).
- The seed wipes all app and auth data then re-inserts fixtures. Run it on a fresh worktree after `db:migrate:local`. See `seed/README.md` for the test account reference.
- When a PR adds a new table or a column that affects feature behavior, **update `seed/seed.sql` with representative rows**. This is required as part of the PR, not optional cleanup.
- All test accounts use the password `Test1234!`. Never use a real or production password in the seed file.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Architecture

See `ARCHITECTURE.md` for the full spec.

### Layers (top to bottom)

```
Astro Pages → Astro Actions / API Endpoints → Service Layer → Repository Layer → D1 / R2 / External Services
```

### Rules

- Every interactive element (`<button>`, custom clickable `<div>`/`<li>`, tab triggers) must include `cursor-pointer`. The `<Button>` component and `buttonVariants` already include it — add it manually to any raw `<button>` or non-anchor clickable element that doesn't use those.
- Pages call services directly. Never call internal API endpoints from pages.
- Actions validate input, authenticate, call a service, return result. No SQL, no business logic.
- Services own all business logic. No HTTP, no Astro context.
- Repositories own all database access. No HTTP, no business logic.
- API endpoints (`src/pages/api/`) are for external consumers only (webhooks, public feeds, exports).
- React only where stateful interaction is required. Everything else is Astro components.
- Long-running work goes through Cloudflare Workflows or Queues.
- Declare all environment variables in the `env.schema` in `astro.config.mjs` using `envField`. Import from `astro:env/server` or `astro:env/client` — never use `import.meta.env` directly.
- Actions define input validation inline via `defineAction({ input: z.object({...}) })`. Use `z.infer<typeof schema>` for any TypeScript types derived from those shapes — never duplicate a Zod schema as a manual TypeScript type.
- User-facing feedback uses toasts (Sonner), fired from React islands, never `<script>` blocks. See Toast Notifications below.

### Filterable Tables

Any table that needs status/category filtering uses the shared `FilterTabs` component (`src/components/ui/FilterTabs.tsx`). Never inline the tab bar markup — it is identical across all tables and must stay in one place.

```tsx
import { FilterTabs } from "@/components/ui/FilterTabs";
import type { FilterTab } from "@/components/ui/FilterTabs";

const TABS: FilterTab<StatusFilter>[] = [
  { label: "Pending", value: "pending" },
  { label: "All",     value: "all"     },
  // ...
];

<FilterTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} countFor={countFor} />
```

Reference implementations: `TeamsTable.tsx`, `TournamentsTable.tsx`, `RegistrationReviewTable.tsx`.

### Destructive Confirmations

Any action that permanently deletes or irreversibly mutates data **must** use a full-screen overlay confirmation — never an inline expand, browser `confirm()`, or toast-level prompt.

Pattern: a `fixed inset-0 z-50` semi-transparent backdrop with a centered card. The card must include:
- A clear title naming the specific resource being deleted
- A plain-language explanation of what will be destroyed (cascade effects included)
- A warning callout (amber or red) when the action affects other users (e.g. registered teams lose records)
- **Cancel** (outline) and **Confirm delete** (destructive) buttons; both disabled while the request is in flight

Reference implementation: `src/components/DeleteTournamentButton.tsx` and `src/components/DivisionManager.tsx`.

```tsx
{open && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="w-full max-w-sm rounded-xl border border-(--color-border) bg-(--color-card) p-6 shadow-xl mx-4">
      <h3 className="text-base font-semibold text-(--color-foreground) mb-2">
        Delete "{name}"?
      </h3>
      <div className="text-sm text-(--color-muted) space-y-2 mb-5">
        <p>Explain what will be destroyed.</p>
        {/* amber/red callout when other users are affected */}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
          {loading ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  </div>
)}
```

### Toast Notifications

Toasts use [Sonner](https://sonner.emilkowal.ski/). `<Toaster>` is mounted once in `AppLayout.astro` (bottom-right); `src/components/ui/sonner.tsx` maps our tokens — don't reinstall the shadcn default (it adds `next-themes`).

Fire from a React island, never an Astro `<script>` (they need loading state and will call Actions later):

```tsx
// src/components/SaveThingButton.tsx
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { delay } from "@/lib/utils";

export function SaveThingButton() {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    try {
      await delay(800); // TODO: swap for actions.thing.save(...)
      toast.success("Thing saved");
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setLoading(false);
    }
  }
  return <Button onClick={handleClick} disabled={loading}>{loading ? "Saving…" : "Save"}</Button>;
}
```

Mount with `<SaveThingButton client:load />`.

- `toast.success` for confirmations, `toast.error` for failures and client-side validation (validation toasts fire synchronously — no `delay`).
- Always `disabled` + a loading label during async work.
- Until Actions exist, simulate with `delay()` and leave a `// TODO: swap for actions.*`.

### Folder Structure

The core layers (`actions/`, `services/`, `repositories/`) are **type-grouped** flat directories — one file per domain entity. The global `AGENTS.md` "start flat, group by feature" rule applies _within_ each layer only if a single feature's files grow large enough to warrant it.

The `pages/` tree below is the **target state** as the tournament feature set matures. Add routes to it as work begins on each section; don't pre-create empty files.

```
src/
  pages/
    index.astro
    signin.astro
    dashboard.astro

    teams/
      index.astro          ← lists all teams (real data, Teams slice)
      register.astro       ← team registration form
      [id]/
        index.astro        ← team detail (real data, Teams slice)
        schedule.astro

    schedule/              ← target: add when scheduling work starts
    brackets/              ← target
    results/               ← target
    users/                 ← target
    admin/                 ← target (deep tree, add per feature)
    coach/                 ← target
    referee/               ← target
    volunteer/             ← target

    api/
      auth/                ← Better Auth cookie routes (see Auth Routes)
      public/              ← external consumers only
      webhooks/
      integrations/

  actions/        ← Astro Actions. One file per domain (teams.ts, players.ts, …)
                     src/actions/index.ts re-exports the `server` object.
  services/       ← Business logic. One file per domain (team-service.ts, …)
  repositories/   ← DB access. One file per domain (team-repository.ts, …)
  __mocks__/      ← Vitest stubs for Cloudflare virtual modules
  components/
    ui/           ← shadcn primitives
    layout/       ← layout-specific components (Sidebar, UserMenu)
                     Feature components live flat in components/ until there
                     are enough to warrant a sub-folder.
  layouts/        ← AppLayout.astro, BaseLayout.astro
  lib/            ← Shared utilities: db.ts, schema.ts, errors.ts, auth.ts, http.ts, utils.ts
  styles/
    globals.css
```
