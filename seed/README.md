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

| Email | Role | My Teams scenario |
|---|---|---|
| `admin@kickoff.test` | admin | **Both sections** — Created: Ghost FC (rejected) · Joined: River Hawks + Northside FC (both approved) |
| `coach-a@kickoff.test` | player | **Both sections** — Created: River Hawks (approved), Storm United (pending) · Joined: Ghost FC (pending), Northside FC (approved) |
| `coach-b@kickoff.test` | player | **Both sections** — Created: Coastal FC + Iron City United (both approved) · Joined: River Hawks (approved), Northside FC (pending) |
| `coach-c@kickoff.test` | player | **Created only** — Desert Wolves (pending), Red Canyon AC (rejected) · Joined: empty state |
| `coach-d@kickoff.test` | player | **Both sections** — Created: Northside FC + Silver Arrows (both approved) · Joined: Iron City United (approved) |
| `player1@kickoff.test` | player | **Joined only** — 5 memberships: approved on River Hawks, Ghost FC, Coastal FC, Northside FC; pending on Storm United |
| `player2@kickoff.test` | player | **Joined only** — 3 memberships: pending (River Hawks), rejected (Storm United), approved (Iron City United) |
| `player3@kickoff.test` | player | **Joined only** — 5 memberships across all statuses: approved, approved, pending, rejected, pending |
| `player4@kickoff.test` | player | **Joined only (all rejected)** — 3 memberships all with rejected status |
| `player5@kickoff.test` | player | **Joined only (all approved)** — 5 active memberships across River Hawks, Coastal FC, Iron City United, Northside FC, Silver Arrows |
| `referee@kickoff.test` | referee | **Global empty state** — no teams, referee role |
| `newbie@kickoff.test` | player | **Global empty state** — no teams created or joined |

## Teams

| ID | Name | Short | Division | City | Status | Coach |
|---|---|---|---|---|---|---|
| `team_a` | River Hawks | RH | Open Men's | Austin, TX | approved | coach-a |
| `team_b` | Storm United | SU | U18 Boys | Dallas, TX | pending | coach-a |
| `team_c` | Ghost FC | GFC | Open Men's | Houston, TX | rejected | admin |
| `team_d` | Coastal FC | CFC | Open Women's | San Diego, CA | approved | coach-b |
| `team_e` | Iron City United | ICU | Masters Men's | Pittsburgh, PA | approved | coach-b |
| `team_f` | Desert Wolves | DW | U16 Boys | Phoenix, AZ | pending | coach-c |
| `team_g` | Northside FC | NFC | Open Men's | Chicago, IL | approved | coach-d |
| `team_h` | Silver Arrows | SA | Open Women's | Seattle, WA | approved | coach-d |
| `team_i` | Red Canyon AC | RCAC | U18 Girls | Denver, CO | rejected | coach-c |

## Team Memberships

| Member | Team | Jersey | Status |
|---|---|---|---|
| admin | River Hawks | — | approved |
| admin | Northside FC | — | approved |
| coach-a | Ghost FC | — | pending |
| coach-a | Northside FC | 10 | approved |
| coach-b | River Hawks | 22 | approved |
| coach-b | Northside FC | — | pending |
| coach-d | Iron City United | 5 | approved |
| player1 | River Hawks | 7 | approved |
| player1 | Storm United | — | pending |
| player1 | Ghost FC | 99 | approved |
| player1 | Coastal FC | 11 | approved |
| player1 | Northside FC | — | approved |
| player2 | River Hawks | — | pending |
| player2 | Storm United | — | rejected |
| player2 | Iron City United | 3 | approved |
| player3 | Coastal FC | 8 | approved |
| player3 | Iron City United | — | approved |
| player3 | Desert Wolves | — | pending |
| player3 | Northside FC | — | rejected |
| player3 | Silver Arrows | 14 | pending |
| player4 | River Hawks | — | rejected |
| player4 | Coastal FC | — | rejected |
| player4 | Northside FC | — | rejected |
| player5 | River Hawks | 9 | approved |
| player5 | Coastal FC | 9 | approved |
| player5 | Iron City United | 9 | approved |
| player5 | Northside FC | 9 | approved |
| player5 | Silver Arrows | 9 | approved |

## Tournaments

| Name | Status | Dates |
|---|---|---|
| Winter Cup 2024 | past | 2024-01-15 → 2024-01-28 |
| Spring Invitational 2025 | past | 2025-03-01 → 2025-03-15 |
| Pacific Coast Cup 2025 | past | 2025-08-10 → 2025-08-24 |
| Regional Qualifiers 2026 | past | 2026-04-05 → 2026-04-12 |
| Summer Classic 2026 | active | 2026-06-01 → 2026-08-31 |
| Open State Championship 2026 | active | 2026-07-01 → 2026-07-20 |
| Fall Championship 2026 | upcoming | 2026-12-01 → 2026-12-20 |
| Youth Invitational 2027 | upcoming | 2027-02-14 → 2027-02-21 |
| Masters League Spring 2027 | upcoming | 2027-04-01 → 2027-04-30 |

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
