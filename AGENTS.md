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

- Pages call services directly. Never call internal API endpoints from pages.
- Actions validate input, authenticate, call a service, return result. No SQL, no business logic.
- Services own all business logic. No HTTP, no Astro context.
- Repositories own all database access. No HTTP, no business logic.
- API endpoints (`src/pages/api/`) are for external consumers only (webhooks, public feeds, exports).
- React only where stateful interaction is required. Everything else is Astro components.
- Long-running work goes through Cloudflare Workflows or Queues.
- Declare all environment variables in the `env.schema` in `astro.config.mjs` using `envField`. Import from `astro:env/server` or `astro:env/client` — never use `import.meta.env` directly.
- Actions define input validation inline via `defineAction({ input: z.object({...}) })`. Use `z.infer<typeof schema>` for any TypeScript types derived from those shapes — never duplicate a Zod schema as a manual TypeScript type.

### Folder Structure

```
src/
  pages/
    index.astro
    login.astro
    profile.astro

    schedule/
      index.astro
      division/
        [divisionId].astro
      team/
        [teamId].astro
      field/
        [fieldId].astro

    brackets/
      index.astro
      [divisionId].astro

    results/
      index.astro

    admin/
      index.astro
      tournament/
        settings.astro
        divisions.astro
        age-groups.astro
        venues.astro
        fields.astro
        rules.astro
      teams/
        index.astro
        [teamId].astro
        approve.astro
      players/
        index.astro
        [playerId].astro
      schedule/
        generate.astro
        editor.astro
        conflicts.astro
      games/
        index.astro
        [gameId].astro
        scores.astro
      volunteers/
        index.astro
        assignments.astro
        shifts.astro
      sponsors/
        index.astro
        packages.astro
      reports/
        index.astro
      users/
        index.astro
        roles.astro
      settings/
        index.astro

    coach/
      index.astro
      roster.astro
      registration.astro
      payments.astro
      messages.astro

    referee/
      index.astro
      assignments.astro
      game/
        [gameId].astro

    volunteer/
      index.astro
      shifts.astro

    api/
      public/
      webhooks/
      integrations/

  actions/        ← Astro Actions (mutations from forms/UI)
  services/       ← Business logic (TeamService, ScheduleService, etc.)
  repositories/   ← Database access (TeamRepository, GameRepository, etc.)
  components/
    ui/           ← shadcn primitives
    layout/       ← Layout components
  layouts/        ← BaseLayout.astro, AppLayout.astro
  lib/            ← Shared utilities
  styles/
    globals.css
```
