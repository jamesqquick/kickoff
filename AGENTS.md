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
