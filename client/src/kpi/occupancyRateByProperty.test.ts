import { describe, expect, it } from 'vitest';
import { occupancyRateByProperty } from './occupancyRateByProperty';
import type { RentRollRow } from '../types';

function addDays(start: string, n: number): string {
  const parts = start.split('-').map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
}

function snapshots(opts: {
  property_id: number;
  units: number;
  start: string;
  days: number;
  occupied: (unitIdx: number, dayIdx: number) => boolean;
}): RentRollRow[] {
  const rows: RentRollRow[] = [];
  for (let d = 0; d < opts.days; d++) {
    const date = addDays(opts.start, d);
    for (let u = 0; u < opts.units; u++) {
      const isOccupied = opts.occupied(u, d);
      rows.push({
        date,
        property_id: opts.property_id,
        property_name: 'Test',
        unit_number: `U${String(u + 1).padStart(2, '0')}`,
        resident_id: isOccupied ? u + 1 : null,
        resident_name: isOccupied ? `R${u + 1}` : null,
        monthly_rent_cents: isOccupied ? 100000 : 0,
      });
    }
  }
  return rows;
}

describe('occupancyRateByProperty', () => {
  it('matches the spec example: 39 units occupied 30 days + 2 occupied 15 days of 50 over 30 days = 0.8', () => {
    const rows = snapshots({
      property_id: 1,
      units: 50,
      start: '2025-01-01',
      days: 30,
      occupied: (u, d) => {
        if (u < 39) return true;
        if (u < 41) return d < 15;
        return false;
      },
    });
    expect(
      occupancyRateByProperty(rows, { start: '2025-01-01', end: '2025-01-30' }),
    ).toEqual({ 1: 0.8 });
  });

  it('returns 0 for a property with no occupied snapshots', () => {
    const rows = snapshots({
      property_id: 2,
      units: 10,
      start: '2025-01-01',
      days: 5,
      occupied: () => false,
    });
    expect(
      occupancyRateByProperty(rows, { start: '2025-01-01', end: '2025-01-05' }),
    ).toEqual({ 2: 0 });
  });

  it('ignores rows outside the range', () => {
    const rows = snapshots({
      property_id: 1,
      units: 1,
      start: '2025-01-01',
      days: 3,
      occupied: () => true,
    });
    expect(
      occupancyRateByProperty(rows, { start: '2025-01-02', end: '2025-01-02' }),
    ).toEqual({ 1: 1 });
  });
});
