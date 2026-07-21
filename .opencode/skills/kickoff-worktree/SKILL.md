---
name: kickoff-worktree
description: Create a git worktree for a new feature branch in this kickoff project. Sets up the worktree in ./.worktrees/, copies .env, syncs Astro types, copies .wrangler state, and runs the local D1 migration. Use when starting work on a new issue or feature branch, when the user says "new worktree", "create a worktree", "work on issue #N in a worktree", or "set up a worktree for".
---

## What this skill does

Creates an isolated git worktree under `.worktrees/`, then runs the kickoff-specific bootstrap steps so the new checkout is immediately ready for `astro dev`.

## Steps

### 1. Determine the branch name

Derive a branch name from the issue number and a short slug, following conventional naming:

```
feat/issue-<N>-<short-slug>
```

Example: `feat/issue-22-admin-teams-coach-view`

### 2. Create the worktree

Worktrees always go in `.worktrees/` (gitignored). Use a directory name that mirrors the branch slug:

```bash
git worktree add .worktrees/<slug> -b <branch-name>
```

Example:
```bash
git worktree add .worktrees/issue-22-admin-teams-coach-view -b feat/issue-22-admin-teams-coach-view
```

### 3. Copy `.env`

The `.env` file is gitignored and must be copied manually:

```bash
cp .env .worktrees/<slug>/.env
```

### 4. Sync Astro types

The `.astro/` generated types directory is gitignored. Run `astro sync` inside the worktree to regenerate them:

```bash
cd .worktrees/<slug> && pnpm astro sync
```

### 5. Copy `.wrangler` state

The local D1 database lives in `.wrangler/state/`. Copy it from the main checkout so the worktree shares the same local data:

```bash
cp -R .wrangler .worktrees/<slug>/.wrangler
```

### 6. Run local D1 migration and seed

Apply any pending migrations, then populate the database with test fixtures:

```bash
cd .worktrees/<slug> && pnpm db:migrate:local && pnpm db:seed:local
```

The seed wipes all app and auth data and inserts a representative fixture set.
See `seed/README.md` for the test account list (password: `Test1234!`).

If the migrate step fails with a workerd runtime error, wrangler may be outdated. Update it:

```bash
cd .worktrees/<slug> && pnpm add -D wrangler@latest
```

Then re-run `pnpm db:migrate:local && pnpm db:seed:local`.

## Full command sequence

```bash
# From the repo root
SLUG=issue-<N>-<short-slug>
BRANCH=feat/$SLUG

git worktree add .worktrees/$SLUG -b $BRANCH
cp .env .worktrees/$SLUG/.env
cp -R .wrangler .worktrees/$SLUG/.wrangler
cd .worktrees/$SLUG
pnpm astro sync
pnpm db:migrate:local && pnpm db:seed:local
```

## Verify

After setup, confirm the worktree is ready:

```bash
cd .worktrees/$SLUG && pnpm tsc --noEmit
```

Zero errors means the worktree is ready for `astro dev`.

## Notes

- `.worktrees/` is listed in `.gitignore` — worktree directories are never committed.
- The worktree shares the same `pnpm-lock.yaml` and `node_modules` graph as the main checkout via pnpm's content-addressable store.
- If `pnpm install` is needed inside the worktree (e.g., after a lockfile update on main), run it explicitly from within the worktree directory.
- Never copy `.worktrees/` itself into a nested worktree.
