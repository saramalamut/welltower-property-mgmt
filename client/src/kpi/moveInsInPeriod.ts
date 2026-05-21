import type { DateRange, RentRollRow } from '../types';

// A move-in is a snapshot whose date is in range, has a non-null resident_id,
// and differs from the unit's prior-date snapshot's resident_id.
// The first snapshot of any unit is not counted (no observable transition).
export function moveInsInPeriod(
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
      if (cur.resident_id !== null && cur.resident_id !== prev.resident_id) {
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
