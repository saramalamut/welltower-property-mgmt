import type { DateRange, RentRollRow } from '../types';

// A move-out is a snapshot whose date is in range, where the unit's prior-date
// snapshot was occupied and the resident_id has changed (to null or another id).
// Attributed to the cur.date — the first observed snapshot without the prior resident.
export function moveOutsInPeriod(
  rows: RentRollRow[],
  range: DateRange,
): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const unitRows of groupByUnit(rows).values()) {
    unitRows.sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 1; i < unitRows.length; i++) {
      const cur = unitRows[i];
      const prev = unitRows[i - 1];
      if (!cur || !prev) continue;
      if (cur.date < range.start || cur.date > range.end) continue;
      if (prev.resident_id !== null && prev.resident_id !== cur.resident_id) {
        counts[cur.property_id] = (counts[cur.property_id] ?? 0) + 1;
      }
    }
  }
  return counts;
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
