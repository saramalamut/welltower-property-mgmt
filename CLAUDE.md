# Welltower Rent Roll — Project Context

## What this is
A take-home assessment for Welltower. Full-stack rent roll management app.
Reviewed by their frontend engineering team. Optimize for code clarity and
correctness over feature count.

## Stack
- Server: Node + Express + csv-parse, TypeScript
- Client: Vite + React + TypeScript + TailwindCSS
- Some shadcn/ui components: Table, Dialog, Button, Input, Select
- State: React Context + useReducer
- Dates: date-fns

## Structure
- /server — Express API, reads data/rent_roll.csv on boot
- /client — React app, calls API on mount, stores rent roll in context
- /data — provided CSV

## Conventions
- TypeScript strict mode on both sides
- No `any`. If you need to escape the type system, use `unknown` and narrow.
- Server returns plain JSON. No GraphQL, no tRPC.
- Components are functional. No class components.
- Money is stored and computed as integer cents server-side, formatted as
  USD strings only at the render boundary.
- Dates are ISO strings (YYYY-MM-DD) in transit; Date objects only inside
  computation functions.

## What I'm building (scope)
- Required: rent roll table with filters, KPI dashboard, 2 actions
- Actions chosen: move-in, move-out
- KPIs: average rent by property, occupancy rate by property, move-ins
  this month, move-outs this month

## Occupancy rate definition (verbatim from the spec — do not paraphrase)
Occupancy rate = (sum of days occupied per unit) / (total units * days in
period). Example: in a 30 day month, if a property has 50 units and 39 are
occupied for 30 days and 2 are occupied for 15 days, occupancy rate =
((39 * 30) + (2 * 15)) / (50 * 30) = 0.8.

## What NOT to do
- Don't add a database. CSV in, JSON out, in-memory state on client.
- Don't add auth.
- Don't add a router unless we genuinely have multiple pages.
- Don't add Redux, Zustand, React Query, or other state libs.
- Don't add CSS-in-JS. Tailwind only.
- Don't add tests for components or the API. Tests only for KPI math
  functions (see Testing policy below).

## Testing policy
Write Vitest unit tests for the pure functions that compute KPIs:
- averageRentByProperty
- occupancyRateByProperty (this is the high-risk one)
- moveInsInPeriod
- moveOutsInPeriod

Each function takes the rent roll array + a date range, returns a number
or a map. No mocks needed; these are pure.

Skip tests for: React components, the Express endpoints, action handlers.
Reviewer can read those directly.