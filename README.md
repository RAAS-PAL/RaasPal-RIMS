# RaasPal RIMS — Robot Inventory Management System

The internal record of every robot RaasPal supplies: what it is, what it costs, how many
are on the shelf, what condition each one is in, and who changed any of that.

A separate Next.js application for warehouse and inventory staff, sharing the same
Spring Boot backend and the same accounts as the operations console — but with a
narrower surface and a stricter network posture.

---

## Snapshot

| | |
|---|---|
| **Type** | Internal inventory application for warehouse staff |
| **Stack** | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 |
| **Data** | The RaasPal Internal Ops backend — every screen, no local database |
| **Auth** | Backend-issued JWT in an httpOnly cookie; RIMS stores no passwords |
| **Rendering** | Server Components and Server Actions; the API is never addressable from the browser |
| **UI** | Hand-built component set — no component library dependency |
| **Hosting** | Vercel |

---

## The network posture is the point

Every backend call runs on the server. The JWT lives in an httpOnly cookie the browser
cannot read, and the backend address stays in a **non-public** environment variable
(`RAASPAL_API_URL`, not `NEXT_PUBLIC_*`).

The consequence: the API is never addressable from the client at all, and RIMS needs
**no CORS entry** on the backend. That is deliberately stricter than the operations
console, which calls the backend directly from the browser.

---

## Access model

Identity comes from the Java backend. Backend roles map onto local capabilities:

| Backend role | RIMS capability level | Can change |
|---|---|---|
| `ADMIN` | Admin | Stock counts, prices, specifications, media, accounts |
| `INVENTORY_STAFF` | Editor | Specifications, descriptions, media — never numbers |
| `RAASPAL_TEAM` | Viewer | Nothing. Reads the catalogue and inventory |

An account holds one or more roles and is granted the union of their permissions.

Roles gate the UI *and* every server action. A viewer sees Edit buttons but disabled,
with the missing capability named on hover — people learn what their account can do
instead of wondering where the button went.

**Client-side RBAC is navigation, not enforcement.** The backend rejects inventory writes
from non-inventory users on its own authority. The checks here shape the interface; they
are not the security boundary.

### On the PIN that used to be here

An earlier standalone version hashed passwords with scrypt into a local JSON file and
guarded every write with a six-digit PIN. That meant two user databases for one set of
people: an account here could change stock while the backend had never heard of them, so
the movement ledger recorded nothing usable.

The PIN is gone. It was a second factor over a JSON file with no other access control.
Writes are now guarded by a signed JWT plus a server-side role check on every endpoint —
a stronger boundary, and one shared with the rest of the platform.

---

## What it holds

**Robot stock.** Physical units on the shelf, tracked separately from the deployed fleet
so a plain count stays honest. Each unit carries a lifecycle status:

| Status | Shown as | Meaning |
|---|---|---|
| `IN_STOCK` | New Stock | Unused, available |
| `DEMO` | Demo Unit | Used for demonstrations |
| `UNDER_REPAIR` | Under Repair | In service, not available |
| `RETURNED_FROM_CUSTOMER` | Returned | Back from a customer, pending assessment |

Units also record **packaging** — boxed or unboxed — because a boxed unit and an opened
one are not the same thing to someone picking stock.

**Parts inventory.** Spare parts with quantities that change *only* by recording a
movement. The ledger is append-only, so every number on screen has a history and a name
attached to it.

**Activity.** A chronological record of what changed, who changed it, and when.

**Accounts.** Backend-backed account management for admins.

---

## Screens

```
app/
├── login/           Sign in against the backend
└── (app)/
    ├── page.tsx     Dashboard — fleet totals, stock summary, restock queue
    ├── robots/      Robot stock catalogue and per-model detail
    ├── inventory/   Parts, quantities, and per-item movement history
    ├── activity/    Who changed what
    ├── accounts/    Account management (admin)
    └── account/     Your own account
```

---

## The pricing model

RaasPal quotes three ways off a single buy-off price:

- **Buy-off** — the outright price, and the only editable number.
- **Lease** — a monthly share of buy-off that falls as the term lengthens: 6.24% at one
  year, 5.56% at two, 5.00% at three (flagged as best value), 4.56% at four, 4.18% at
  five.
- **Maintenance** — an annual share of buy-off that rises with agreement length: 12% at
  two years up to 15% at five.

Change the buy-off price and every derived figure recalculates in the same write. The
rates live in `lib/catalog.ts` and were taken from the published Beetle sheet.

---

## Code layout

```
lib/
├── backend.ts        The only module that talks to the API. Server-only.
├── backend-types.ts  The backend contract, as RIMS sees it
├── auth.ts           Session, login, backend role → local role mapping
├── rbac.ts           Capabilities, and which roles grant them
├── stock-data.ts     Read paths for every screen
├── stock-actions.ts  Write paths — authorised before they write
├── actions.ts        Server actions (auth, accounts)
├── analytics.ts      Fleet totals, category rollups, the restock queue
├── catalog.ts        Categories, warehouses, lease/maintenance pricing
├── types.ts          Domain shapes
├── filter.ts         Catalogue filtering
├── format.ts         Number, price and date presentation
└── image-url.ts / robot-image.ts   Image resolution
```

`lib/backend.ts` is deliberately the only module that knows how to reach the API, the
same way `lib/store.ts` was once the only module that knew about the filesystem.

> **Residual code.** `lib/store.ts` and `lib/seed.ts` are the remains of the standalone
> JSON-backed era. Every screen now reads `lib/stock-data.ts`; the JSON write path
> survives only behind robot-edit actions in `lib/actions.ts` that no live component
> imports. They are safe to delete once those actions are ported.

---

## Design

- **Brand cyan `#00BCE2`** is sampled from the official wordmark. It is an identity
  colour, not an action colour — at full strength it cannot carry white text, so buttons
  use the darkened `--brand-solid` step and the pure cyan is kept for the mark, meters,
  focus rings and data accents.
- **Type**: Inter for display and body, matching the operations console so the two apps
  read as one platform. Noto Sans Thai sits behind it in the stack, because customer and
  site names arrive from the backend and are frequently Thai, and the browser resolves
  per glyph. IBM Plex Mono sets every quantity, price, SKU and timestamp, so figures line
  up down a column and a mistyped digit is visible.
- **The stock meter** is the device the interface is built around: a battery-style
  segmented gauge showing available, reserved and demo units against a notch at the
  reorder point. It appears on cards, table rows, category tiles and detail pages, so
  stock reads the same way everywhere.
- Light and dark themes are both designed, not flipped. The choice is stored per browser
  and defaults to the OS setting.

---

## Robot photographs

Drop a file named after the robot's slug into `public/robots/` — `beetle.webp`,
`bellabot.png` — and it is picked up on the next request. Until then the card shows a
line drawing of that category, so a missing photo reads as a technical placeholder rather
than a broken image. An explicit path set through the Media panel always wins.

Supported: `.webp` `.png` `.jpg` `.jpeg` `.avif`

---

## Running locally

### Prerequisites

- Node.js 20+
- The backend API running, or a reachable deployed instance

### Configure

Create `.env.local`:

```bash
RAASPAL_API_URL=http://localhost:8080
```

Note the absence of a `NEXT_PUBLIC_` prefix — that is intentional. Defaults to
`http://localhost:8080` if unset.

### Run

```bash
npm install
npm run dev          # http://localhost:3000
```

Sign in with a platform account holding `ADMIN` or `INVENTORY_STAFF`. There is no seed
data and no local account store — an empty backend means empty screens, which is the
honest result.

### Checks

```bash
npx tsc --noEmit     # types
npx eslint .         # lint
npm run build        # production build
```
