import type { DateRange, RentRollRow } from '../types';

export function averageRentByProperty(
  rows: RentRollRow[],
  range: DateRange,
): Record<number, number> {
  const totals = new Map<number, { sum: number; count: number }>();
  for (const r of rows) {
    if (r.date < range.start || r.date > range.end) continue;
    if (r.resident_id === null) continue;
    const acc = totals.get(r.property_id) ?? { sum: 0, count: 0 };
    acc.sum += r.monthly_rent_cents;
    acc.count += 1;
    totals.set(r.property_id, acc);
  }
  const out: Record<number, number> = {};
  for (const [id, { sum, count }] of totals) {
    out[id] = count === 0 ? 0 : Math.round(sum / count);
  }
  return out;
}
