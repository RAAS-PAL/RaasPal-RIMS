# RaasPal RIMS

Robot Inventory Management System — the internal record of every robot RaasPal
supplies: what it is, what it costs, how many are on the shelf, and who changed
any of that.

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · TypeScript.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

The first request seeds `data/rims.json` with 33 robots and `data/users.json`
with four accounts. Both files are gitignored — they are the live record, not
source.

### Seeded accounts

Four accounts are created on first run, one per role combination:

| Username | Person | Roles |
| --- | --- | --- |
| `swanhtetag01` | Swan Htet Aung | Admin, Editor |
| `nattapong` | Nattapong Sriwichai | Admin |
| `pimchanok` | Pimchanok Ratanapon | Editor |
| `somchai` | Somchai Thanakit | Viewer |

Their starting passwords and PINs are in `SEED_ACCOUNTS` at the top of
`lib/auth.ts` — deliberately not repeated here, since this file is committed.
Change them before the app leaves your network. Only the hashes (scrypt, per-
secret salt) are ever written to `data/users.json`; delete that file to re-seed.

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | in production | Signs the session cookie. 16+ characters. The app refuses to start in production without it. |

## Access model

An account holds **one or more roles** and is granted the union of their
permissions, so an "Admin + Editor" account is simply an admin.

| Role | Can change |
| --- | --- |
| **Admin** | Stock counts, prices, specifications, media, accounts |
| **Editor** | Specifications, descriptions, media — never numbers |
| **Viewer** | Nothing. Reads the catalogue and inventory |

Roles gate the UI *and* every server action. A viewer sees the Edit buttons but
disabled, with the missing role named on hover — people learn what their account
can do instead of wondering where the button went.

### PIN confirmation

Pressing Save does not save. It opens a dialog asking the signed-in person for
their six-digit PIN, verified on the server inside the action. Only then is the
change written, and it is written together with an activity-log entry naming
that person. Every line in the log is one somebody put their own credential
behind.

Changing your own PIN is the single exception: the current PIN typed into the
form *is* the confirmation.

## How the data is organised

```
lib/types.ts      Robot, stock, activity, user shapes + summarizeStock()
lib/seed.ts       The 33-robot starting catalogue
lib/catalog.ts    Categories, warehouses, and the lease/maintenance pricing model
lib/store.ts      Persistence — the ONLY module that touches storage
lib/auth.ts       Accounts, password/PIN hashing (scrypt), session cookie
lib/rbac.ts       Capabilities, and which roles grant them
lib/actions.ts    Every server action; each one authorises before it writes
lib/analytics.ts  Fleet totals, category rollups, the restock queue
```

Persistence is a JSON file today. `lib/store.ts` is deliberately the only place
that knows that — moving to Postgres means rewriting that file and `lib/auth.ts`,
and nothing else.

### The pricing model

RaasPal quotes three ways off a single buy-off price:

- **Buy-off** — the outright price, the one editable number.
- **Lease** — 6.24% of buy-off per month on a one-year term, down to 4.18% on
  five years. Three years is flagged as best value.
- **Maintenance** — 12% of buy-off per year on a two-year agreement, up to 15%
  on five years.

Change the buy-off price and all nine figures are recalculated in the same
write. The rates live in `lib/catalog.ts` and were taken from the published
Beetle sheet.

## Robot photographs

Drop a file named after the robot's slug into `public/robots/` — `beetle.webp`,
`bellabot.png` — and it is picked up on the next request. Until then the card
shows a line drawing of that category, so a missing photo reads as a technical
placeholder rather than a broken image. An explicit path set through the Media
panel always wins.

Supported: `.webp` `.png` `.jpg` `.jpeg` `.avif`

## Design

- **Brand cyan `#00BCE2`** is sampled from the official wordmark. It is an
  identity colour, not an action colour — at full strength it cannot carry white
  text, so buttons use the darkened `--brand-solid` step and the pure cyan is
  kept for the mark, meters, focus rings and data accents.
- **Type**: Chakra Petch for display (a Thai foundry cut with the same chamfered
  geometry as the RaasPal mark), IBM Plex Sans for interface copy, IBM Plex Mono
  for every quantity, price, SKU and timestamp.
- **The stock meter** is the one device the interface is built around: a
  battery-style segmented gauge showing available (solid), reserved (pale) and
  demo (hatched) units against a notch at the reorder point. It appears on
  cards, table rows, category tiles and the detail page, so stock reads the same
  way everywhere.
- Light and dark themes are both designed, not flipped. The choice is stored per
  browser and defaults to the OS setting.

## Checks

```bash
npx tsc --noEmit     # types
npx eslint .         # lint
npm run build        # production build
```
