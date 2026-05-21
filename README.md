# Welltower Rent Roll

Full-stack rent roll viewer with a KPI dashboard and move-in / move-out actions. Take-home assessment.

<details>
<summary><strong>Architecture diagram</strong> — three tiers (browser, server, data)</summary>

![System architecture](docs/architecture.svg)

See [`docs/data-flow.svg`](docs/data-flow.svg) for the state and data flow diagram (boot, render, action loop).

</details>

## Prerequisites

- Node 20 (see `.nvmrc` — `nvm use` if you have nvm)
- npm

## Setup

Install dependencies at the repo root and in each workspace:

```
npm install
cd server && npm install
cd ../client && npm install
```

## Run

From the repo root:

```
npm run dev    # Express on http://localhost:3001, Vite on http://localhost:5173
```

This uses `concurrently` to run both processes in one terminal. The Vite dev server proxies `/api/*` to the server (see `client/vite.config.ts`). Open the Vite URL in a browser.

If you'd rather not multiplex output, run `cd server && npm run dev` and `cd client && npm run dev` in separate terminals instead.

## Tests

```
cd client && npm test
```

Vitest, KPI math only. Covers `averageRentByProperty`, `occupancyRateByProperty`, `moveInsInPeriod`, and `moveOutsInPeriod` in `client/src/lib/kpis.ts` — including the spec's worked occupancy example.

## Assumptions

- The CSV (`data/rent_roll.csv`) is the source of truth at boot. The server parses it once into memory on startup (`server/src/loadRentRoll.ts`).
- Money is stored and computed as integer cents server-side; formatted as USD only at the render boundary.
- Dates are ISO `YYYY-MM-DD` strings in transit; `Date` objects only inside computation functions.
- Move-in / move-out are client-side mutations to in-memory state. They do **not** write back to the CSV or persist across server restarts.
- Malformed CSV rows are warned and skipped, not fatal.

## Architectural decisions

- **CSV in, JSON out, in-memory.** No database. Server exposes `/api/rent-roll` and `/api/rent-roll/range`.
- **Client-side state for mutations.** React Context + `useReducer` (`client/src/state/RentRollContext.tsx`, `rentRollReducer.ts`). Move-in / move-out dispatch actions update the local store; nothing round-trips to the server.
- **KPI math as pure functions.** All four KPIs are pure `(rentRoll, fromDate, toDate)` functions in `client/src/lib/kpis.ts`. No mocks required to test them.
- **shadcn/ui over hand-rolled components.** Table, Dialog, Button, Input, Select. Tailwind v4 via `@tailwindcss/vite`.
- **TypeScript strict on both sides.** No `any`; `unknown` + narrowing where escape from the type system is unavoidable.

## What I skipped, and why

- **Database / persistence.** Spec is CSV in, JSON out. Adding Postgres would be scope creep.
- **Auth.** Out of scope.
- **Router.** Single page; adding one is ceremony for no benefit.
- **State libraries (Redux, Zustand, React Query).** Context + reducer fits the data shape.
- **Tests for components and endpoints.** Reviewer can read them directly. Tests are reserved for the high-risk KPI math — especially day-weighted occupancy.

## Known follow-ups

- Real backend persistence — DB plus write endpoints for move-in / move-out so mutations survive a restart.
- Audit log of mutations (who, when, what changed). Currently mutations are ephemeral.
- More actions: rent change, lease renewal, unit transfer.
- Virtualized table (e.g. TanStack Virtual) for full-period views over larger rent rolls.
- Auth and per-property access control.
- Server-side filtering and pagination if the dataset outgrows what's reasonable to ship to the client.
