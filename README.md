# Welltower Rent Roll

Full-stack rent roll viewer with a KPI dashboard and move-in / move-out actions. Take-home assessment.

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

## Architecture

### Components and technologies

```mermaid
flowchart LR
  subgraph S["Server &nbsp;·&nbsp; Node 20 + Express + TypeScript"]
    direction TB
    CSV[("data/<br/>rent_roll.csv")]
    Loader["loadRentRoll()<br/>csv-parse"]
    Mem[("in-memory<br/>rent roll<br/>(integer cents)")]
    API["/api/rent-roll<br/>/api/rent-roll/range"]
    CSV --> Loader --> Mem --> API
  end

  subgraph C["Client &nbsp;·&nbsp; Vite + React + TypeScript + Tailwind v4"]
    direction TB
    ViteDev["Vite dev server :5173<br/>(proxies /api → :3001)"]
    Ctx["RentRollProvider<br/>React Context + useReducer"]
    UI["App · Table · KPI dashboard<br/>shadcn/ui (Button, Dialog,<br/>Input, Select, Table)"]
    KPIs["lib/kpis.ts<br/>pure fns · Vitest"]
    ViteDev --> Ctx --> UI
    UI --> KPIs
  end

  Browser((Browser)) <--> ViteDev
  Ctx -- "fetch /api/rent-roll" --> API
```

### Initial load — client to server

```mermaid
sequenceDiagram
  autonumber
  participant U as Browser
  participant V as Vite dev server (:5173)
  participant R as React app
  participant P as RentRollProvider<br/>(Context + reducer)
  participant E as Express (:3001)

  Note over E: At boot, loadRentRoll()<br/>parses CSV into memory (cents)

  U->>V: GET /
  V-->>U: index.html + JS modules<br/>(TS/JSX compiled on the fly)
  U->>R: createRoot().render(<App/>)
  R->>P: mount RentRollProvider
  P->>P: dispatch LOADING
  P->>V: fetch('/api/rent-roll')
  V->>E: proxy → :3001/api/rent-roll
  E-->>V: 200 JSON (rent roll rows)
  V-->>P: JSON
  P->>P: dispatch SET_ROWS
  P->>R: re-render with rows
  R-->>U: Table + KPI dashboard
```

Step by step:

1. **Server boot.** `tsx watch` runs `server/src/index.ts`. `loadRentRoll()` reads `data/rent_roll.csv`, parses with `csv-parse/sync`, validates each row, and converts dollars to integer cents. Express listens on `:3001`.
2. **Client boot.** `vite` serves `index.html` on `:5173` and compiles TS/JSX on demand. The browser loads `src/main.tsx`, which mounts `<App />` inside `<RentRollProvider>`.
3. **Mount effect.** The provider's `useEffect` dispatches `LOADING`, then calls `fetchRentRoll()` → `fetch('/api/rent-roll')`.
4. **Proxy hop.** Vite's dev proxy forwards `/api/*` to `http://localhost:3001`, so the browser never sees a cross-origin request.
5. **Server response.** Express returns the cached in-memory rent roll as JSON — no disk read, no DB.
6. **Reducer + render.** The provider dispatches `SET_ROWS`. Components subscribed via `useRentRoll()` re-render. KPI components recompute from `lib/kpis.ts` (pure functions over the rows + current date range).

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
