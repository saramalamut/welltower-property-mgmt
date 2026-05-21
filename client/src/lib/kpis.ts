import type { RentRollRow } from '../types';

export interface KpiResult {
  byProperty: Record<number, number>;
  portfolio: number;
}

const inRange = (date: string, from: string, to: string): boolean =>
  date >= from && date <= to;

export function averageRentByProperty(
  rentRoll: RentRollRow[],
  fromDate: string,
  toDate: string,
): KpiResult {
  const perProperty = new Map<number, { sum: number; count: number }>();
  let portfolioSum = 0;
  let portfolioCount = 0;
  for (const r of rentRoll) {
    if (!inRange(r.date, fromDate, toDate)) continue;
    if (r.resident_id === null) continue;
    const acc = perProperty.get(r.property_id) ?? { sum: 0, count: 0 };
    acc.sum += r.monthly_rent_cents;
    acc.count += 1;
    perProperty.set(r.property_id, acc);
    portfolioSum += r.monthly_rent_cents;
    portfolioCount += 1;
  }
  const byProperty: Record<number, number> = {};
  for (const [id, { sum, count }] of perProperty) {
    byProperty[id] = Math.round(sum / count);
  }
  return {
    byProperty,
    portfolio: portfolioCount === 0 ? 0 : Math.round(portfolioSum / portfolioCount),
  };
}

// Day-weighted occupancy, per the spec verbatim:
//   occupancy rate = (sum of days occupied per unit) / (total units * days in period)
//
// The CSV provides one row per unit per day (daily snapshots, no gaps), so each
// in-range row represents one unit-day. Substituting:
//   occupied_rows = Σ_units (days that unit was occupied in range) = spec numerator
//   total_rows    = total_units * days_in_period                   = spec denominator
// → occupied_rows / total_rows IS the spec formula. This is NOT a point-in-time
// "occupied units on a date / total units" headcount — that would be wrong.
export function occupancyRateByProperty(
  rentRoll: RentRollRow[],
  fromDate: string,
  toDate: string,
): KpiResult {
  const perProperty = new Map<number, { occupied: number; total: number }>();
  let portfolioOccupied = 0;
  let portfolioTotal = 0;
  for (const r of rentRoll) {
    if (!inRange(r.date, fromDate, toDate)) continue;
    const acc = perProperty.get(r.property_id) ?? { occupied: 0, total: 0 };
    acc.total += 1;
    if (r.resident_id !== null) acc.occupied += 1;
    perProperty.set(r.property_id, acc);
    portfolioTotal += 1;
    if (r.resident_id !== null) portfolioOccupied += 1;
  }
  const byProperty: Record<number, number> = {};
  for (const [id, { occupied, total }] of perProperty) {
    byProperty[id] = total === 0 ? 0 : occupied / total;
  }
  return {
    byProperty,
    portfolio: portfolioTotal === 0 ? 0 : portfolioOccupied / portfolioTotal,
  };
}

// A move-in at cur.date is a transition (prev, cur) on the same unit where
// cur has a resident AND that resident differs from prev's. Covers both
// vacant→occupied and resident-swap (A→B). First snapshot of a unit is never
// counted (no prior state).
//
// IMPORTANT: pass the full rentRoll, not a pre-filtered slice — the date-range
// check applies to cur.date only, so a transition whose prev snapshot is
// outside the range (e.g. prev=2025-01-31, cur=2025-02-01, range=Feb) is still
// detected via the out-of-range prev.
export function moveInsInPeriod(
  rentRoll: RentRollRow[],
  fromDate: string,
  toDate: string,
): KpiResult {
  return countTransitions(rentRoll, fromDate, toDate, (prev, cur) =>
    cur.resident_id !== null && cur.resident_id !== prev.resident_id,
  );
}

// Symmetric to move-ins: a move-out at cur.date is a transition where prev
// had a resident AND that resident differs from cur's. Covers occupied→vacant
// and A→B (a swap counts as one move-out for A and one move-in for B).
export function moveOutsInPeriod(
  rentRoll: RentRollRow[],
  fromDate: string,
  toDate: string,
): KpiResult {
  return countTransitions(rentRoll, fromDate, toDate, (prev, cur) =>
    prev.resident_id !== null && prev.resident_id !== cur.resident_id,
  );
}

function countTransitions(
  rentRoll: RentRollRow[],
  fromDate: string,
  toDate: string,
  predicate: (prev: RentRollRow, cur: RentRollRow) => boolean,
): KpiResult {
  const byProperty: Record<number, number> = {};
  let portfolio = 0;
  for (const unitRows of groupByUnit(rentRoll).values()) {
    unitRows.sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 1; i < unitRows.length; i++) {
      const cur = unitRows[i];
      const prev = unitRows[i - 1];
      if (!cur || !prev) continue;
      if (!inRange(cur.date, fromDate, toDate)) continue;
      if (predicate(prev, cur)) {
        byProperty[cur.property_id] = (byProperty[cur.property_id] ?? 0) + 1;
        portfolio += 1;
      }
    }
  }
  return { byProperty, portfolio };
}

function groupByUnit(rows: RentRollRow[]): Map<string, RentRollRow[]> {
  const map = new Map<string, RentRollRow[]>();
  for (const r of rows) {
    const key = `${r.property_id}|${r.unit_number}`;
    const arr = map.get(key) ?? [];
    arr.push(r);
    map.set(key, arr);
  }
  return map;
}
