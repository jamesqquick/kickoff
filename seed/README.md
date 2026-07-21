# Local Seed Data

Populates the local D1 database with representative test fixtures. Run after
migrations when setting up a worktree:

```bash
pnpm db:migrate:local && pnpm db:seed:local
```

**The seed wipes all app and auth data first**, so it is safe to re-run on a
fresh worktree. Do not run against the remote database.

## Test Accounts

All accounts use the password **`Test1234!`**

| Email | Role | Notes |
|---|---|---|
| `admin@kickoff.test` | admin | Full admin access; owns Ghost FC (rejected team) |
| `coach-a@kickoff.test` | player | Owns River Hawks (approved) and Storm United (pending) |
| `player1@kickoff.test` | player | Member of River Hawks (approved), Storm United (pending), Ghost FC (approved) |
| `player2@kickoff.test` | player | Member of River Hawks (pending), Storm United (rejected) |

## Teams

| ID | Name | Status | Owner |
|---|---|---|---|
| `team_a` | River Hawks | approved | coach-a |
| `team_b` | Storm United | pending | coach-a |
| `team_c` | Ghost FC | rejected | admin |

## Team Memberships

| Member | Team | Jersey | Status |
|---|---|---|---|
| player1 | River Hawks | 7 | approved |
| player2 | River Hawks | — | pending |
| player1 | Storm United | — | pending |
| player2 | Storm United | — | rejected |
| player1 | Ghost FC | 99 | approved |

## Tournaments

| Name | Derived Status | Dates |
|---|---|---|
| Spring Invitational 2025 | past | 2025-03-01 → 2025-03-15 |
| Summer Classic 2026 | active | 2026-06-01 → 2026-08-31 |
| Fall Championship 2026 | upcoming | 2026-12-01 → 2026-12-20 |

## Updating the Seed

When a PR adds a new table or a column that affects feature behavior, update
`seed/seed.sql` with representative rows. This is required as part of the PR —
see the Seed Data section in `AGENTS.md`.

### Regenerating the password hash

The password hash in `seed.sql` was generated with Better Auth's `hashPassword`
function (Node `crypto.scrypt`). If you ever need to regenerate it:

```bash
node --input-type=module <<'EOF'
import { hashPassword } from './node_modules/.pnpm/@better-auth+utils@0.4.2/node_modules/@better-auth/utils/dist/password.node.mjs';
console.log(await hashPassword('Test1234!'));
EOF
```

Paste the output into every `password` value in the `account` INSERT block.
