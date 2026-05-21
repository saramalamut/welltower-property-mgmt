import type { DateRange, RentRollRow } from '../types';

// Per spec: (sum of days occupied per unit) / (total units * days in period).
// With daily snapshots, this reduces to:
//   (in-range snapshots with non-null resident_id) / (all in-range snapshots).
export function occupancyRateByProperty(
  rows: RentRollRow[],
  range: DateRange,
): Record<number, number> {
  const totals = new Map<number, { occupied: number; total: number }>();
  for (const r of rows) {
    if (r.date < range.start || r.date > range.end) continue;
    const acc = totals.get(r.property_id) ?? { occupied: 0, total: 0 };
    acc.total += 1;
    if (r.resident_id !== null) acc.occupied += 1;
    totals.set(r.property_id, acc);
  }
  const out: Record<number, number> = {};
  for (const [id, { occupied, total }] of totals) {
    out[id] = total === 0 ? 0 : occupied / total;
  }
  return out;
}
