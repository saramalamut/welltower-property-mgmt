import { describe, expect, it } from 'vitest';
import type { RentRollRow } from '../types';
import {
  averageRentByProperty,
  moveInsInPeriod,
  moveOutsInPeriod,
  occupancyRateByProperty,
} from './kpis';

const mk = (overrides: Partial<RentRollRow> = {}): RentRollRow => ({
  date: '2025-01-01',
  property_id: 1,
  property_name: 'Test',
  unit_number: 'U01',
  resident_id: 1,
  resident_name: 'R1',
  monthly_rent_cents: 100000,
  ...overrides,
});

const mkUnit = (
  date: string,
  resident_id: number | null,
  unit_number = 'U01',
  property_id = 1,
): RentRollRow => ({
  date,
  property_id,
  property_name: 'Test',
  unit_number,
  resident_id,
  resident_name: resident_id === null ? null : `R${resident_id}`,
  monthly_rent_cents: resident_id === null ? 0 : 100000,
});

function addDays(start: string, n: number): string {
  const parts = start.split('-').map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function snapshots(opts: {
  property_id: number;
  units: number;
  start: string;
  days: number;
  occupied: (unitIdx: number, dayIdx: number) => boolean;
  rentCents?: number;
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
        monthly_rent_cents: isOccupied ? (opts.rentCents ?? 100000) : 0,
      });
    }
  }
  return rows;
}

describe('averageRentByProperty', () => {
  it('averages occupied rents per property within range', () => {
    const rows = [
      mk({ property_id: 1, monthly_rent_cents: 100000 }),
      mk({ property_id: 1, monthly_rent_cents: 200000, unit_number: 'U02' }),
      mk({ property_id: 2, monthly_rent_cents: 500000 }),
    ];
    expect(averageRentByProperty(rows, '2025-01-01', '2025-01-31')).toEqual({
      byProperty: { 1: 150000, 2: 500000 },
      // weighted, NOT mean-of-means: (100000 + 200000 + 500000) / 3 = 266667
      portfolio: 266667,
    });
  });

  it('excludes vacant units from the average', () => {
    const rows = [
      mk({ property_id: 1, monthly_rent_cents: 100000 }),
      mk({
        property_id: 1,
        unit_number: 'U02',
        resident_id: null,
        resident_name: null,
        monthly_rent_cents: 0,
      }),
    ];
    expect(averageRentByProperty(rows, '2025-01-01', '2025-01-31')).toEqual({
      byProperty: { 1: 100000 },
      portfolio: 100000,
    });
  });

  it('excludes rows outside the range', () => {
    const rows = [
      mk({ date: '2024-12-31', monthly_rent_cents: 999999 }),
      mk({ date: '2025-01-15', monthly_rent_cents: 100000 }),
    ];
    expect(averageRentByProperty(rows, '2025-01-01', '2025-01-31')).toEqual({
      byProperty: { 1: 100000 },
      portfolio: 100000,
    });
  });

  it('returns empty byProperty and portfolio 0 when no rows match', () => {
    expect(averageRentByProperty([], '2025-01-01', '2025-01-31')).toEqual({
      byProperty: {},
      portfolio: 0,
    });
  });
});

describe('occupancyRateByProperty', () => {
  it('matches the spec example verbatim: 50 units, 39 occupied 30 days + 2 occupied 15 days, 30-day period = 0.8', () => {
    // Spec formula: (sum of days occupied per unit) / (total units * days in period)
    //   numerator   = (39 * 30) + (2 * 15) = 1170 + 30 = 1200
    //   denominator = 50 * 30 = 1500
    //   ratio       = 1200 / 1500 = 0.8
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
    expect(occupancyRateByProperty(rows, '2025-01-01', '2025-01-30')).toEqual({
      byProperty: { 1: 0.8 },
      portfolio: 0.8,
    });
  });

  it('returns 0 for a property with no occupied snapshots', () => {
    const rows = snapshots({
      property_id: 2,
      units: 10,
      start: '2025-01-01',
      days: 5,
      occupied: () => false,
    });
    expect(occupancyRateByProperty(rows, '2025-01-01', '2025-01-05')).toEqual({
      byProperty: { 2: 0 },
      portfolio: 0,
    });
  });

  it('ignores rows outside the range', () => {
    const rows = snapshots({
      property_id: 1,
      units: 1,
      start: '2025-01-01',
      days: 3,
      occupied: () => true,
    });
    expect(occupancyRateByProperty(rows, '2025-01-02', '2025-01-02')).toEqual({
      byProperty: { 1: 1 },
      portfolio: 1,
    });
  });

  it('portfolio is weighted across properties, not mean of per-property ratios', () => {
    // Property 1: 10 units * 1 day, 10 occupied → ratio 1.0
    // Property 2: 90 units * 1 day, 0 occupied → ratio 0.0
    // Mean-of-ratios would be 0.5; weighted is 10 / 100 = 0.1.
    const rows = [
      ...snapshots({
        property_id: 1,
        units: 10,
        start: '2025-01-01',
        days: 1,
        occupied: () => true,
      }),
      ...snapshots({
        property_id: 2,
        units: 90,
        start: '2025-01-01',
        days: 1,
        occupied: () => false,
      }),
    ];
    expect(occupancyRateByProperty(rows, '2025-01-01', '2025-01-01')).toEqual({
      byProperty: { 1: 1, 2: 0 },
      portfolio: 0.1,
    });
  });
});

describe('moveInsInPeriod', () => {
  it('counts a vacant→occupied transition as a move-in', () => {
    const rows = [mkUnit('2025-01-01', null), mkUnit('2025-01-02', 1)];
    expect(moveInsInPeriod(rows, '2025-01-01', '2025-01-31')).toEqual({
      byProperty: { 1: 1 },
      portfolio: 1,
    });
  });

  it('counts a resident swap (A→B) as a move-in', () => {
    const rows = [mkUnit('2025-01-01', 1), mkUnit('2025-01-02', 2)];
    expect(moveInsInPeriod(rows, '2025-01-01', '2025-01-31')).toEqual({
      byProperty: { 1: 1 },
      portfolio: 1,
    });
  });

  it('does not count the first snapshot of a unit', () => {
    const rows = [mkUnit('2025-01-01', 1)];
    expect(moveInsInPeriod(rows, '2025-01-01', '2025-01-31')).toEqual({
      byProperty: {},
      portfolio: 0,
    });
  });

  it('excludes transitions whose cur.date falls outside the range', () => {
    const rows = [
      mkUnit('2024-12-31', null),
      mkUnit('2025-01-01', 1),
      mkUnit('2025-02-01', null),
      mkUnit('2025-02-02', 2),
    ];
    expect(moveInsInPeriod(rows, '2025-01-01', '2025-01-31')).toEqual({
      byProperty: { 1: 1 },
      portfolio: 1,
    });
  });

  it('detects a transition where prev snapshot is outside the range', () => {
    // Critical: function must receive the full rent roll, not just in-range rows,
    // so a transition from Jan-31 (out of Feb range) to Feb-01 is still counted.
    const rows = [mkUnit('2025-01-31', null), mkUnit('2025-02-01', 1)];
    expect(moveInsInPeriod(rows, '2025-02-01', '2025-02-28')).toEqual({
      byProperty: { 1: 1 },
      portfolio: 1,
    });
  });

  it('attributes counts to the correct property', () => {
    const rows = [
      mkUnit('2025-01-01', null, 'U01', 1),
      mkUnit('2025-01-02', 1, 'U01', 1),
      mkUnit('2025-01-01', null, 'U01', 2),
      mkUnit('2025-01-02', 2, 'U01', 2),
    ];
    expect(moveInsInPeriod(rows, '2025-01-01', '2025-01-31')).toEqual({
      byProperty: { 1: 1, 2: 1 },
      portfolio: 2,
    });
  });
});

describe('moveOutsInPeriod', () => {
  it('counts an occupied→vacant transition as a move-out', () => {
    const rows = [mkUnit('2025-01-01', 1), mkUnit('2025-01-02', null)];
    expect(moveOutsInPeriod(rows, '2025-01-01', '2025-01-31')).toEqual({
      byProperty: { 1: 1 },
      portfolio: 1,
    });
  });

  it('counts a resident swap (A→B) as a move-out', () => {
    const rows = [mkUnit('2025-01-01', 1), mkUnit('2025-01-02', 2)];
    expect(moveOutsInPeriod(rows, '2025-01-01', '2025-01-31')).toEqual({
      byProperty: { 1: 1 },
      portfolio: 1,
    });
  });

  it('does not count vacant→vacant or same-resident continuations', () => {
    const rows = [
      mkUnit('2025-01-01', null),
      mkUnit('2025-01-02', null),
      mkUnit('2025-01-03', 1),
      mkUnit('2025-01-04', 1),
    ];
    expect(moveOutsInPeriod(rows, '2025-01-01', '2025-01-31')).toEqual({
      byProperty: {},
      portfolio: 0,
    });
  });

  it('excludes transitions whose cur.date falls outside the range', () => {
    const rows = [mkUnit('2025-01-31', 1), mkUnit('2025-02-01', null)];
    expect(moveOutsInPeriod(rows, '2025-01-01', '2025-01-31')).toEqual({
      byProperty: {},
      portfolio: 0,
    });
  });
});
