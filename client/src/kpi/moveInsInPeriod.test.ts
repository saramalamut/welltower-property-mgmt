import { describe, expect, it } from 'vitest';
import { moveInsInPeriod } from './moveInsInPeriod';
import type { RentRollRow } from '../types';

const mk = (
  date: string,
  resident_id: number | null,
  unit_number = 'U01',
): RentRollRow => ({
  date,
  property_id: 1,
  property_name: 'Test',
  unit_number,
  resident_id,
  resident_name: resident_id === null ? null : `R${resident_id}`,
  monthly_rent_cents: resident_id === null ? 0 : 100000,
});

describe('moveInsInPeriod', () => {
  it('counts a vacant→occupied transition as a move-in', () => {
    const rows = [mk('2025-01-01', null), mk('2025-01-02', 1)];
    expect(moveInsInPeriod(rows, { start: '2025-01-01', end: '2025-01-31' })).toEqual({ 1: 1 });
  });

  it('counts a resident swap (A→B) as a move-in', () => {
    const rows = [mk('2025-01-01', 1), mk('2025-01-02', 2)];
    expect(moveInsInPeriod(rows, { start: '2025-01-01', end: '2025-01-31' })).toEqual({ 1: 1 });
  });

  it('does not count the first snapshot of an already-occupied unit', () => {
    const rows = [mk('2025-01-01', 1), mk('2025-01-02', 1)];
    expect(moveInsInPeriod(rows, { start: '2025-01-01', end: '2025-01-31' })).toEqual({});
  });

  it('excludes transitions whose date falls outside the range', () => {
    const rows = [
      mk('2024-12-31', null),
      mk('2025-01-01', 1),
      mk('2025-02-01', null),
      mk('2025-02-02', 2),
    ];
    expect(moveInsInPeriod(rows, { start: '2025-01-01', end: '2025-01-31' })).toEqual({ 1: 1 });
  });

  it('counts independently per unit', () => {
    const rows = [
      mk('2025-01-01', null, 'U01'),
      mk('2025-01-02', 1, 'U01'),
      mk('2025-01-01', null, 'U02'),
      mk('2025-01-03', 2, 'U02'),
    ];
    expect(moveInsInPeriod(rows, { start: '2025-01-01', end: '2025-01-31' })).toEqual({ 1: 2 });
  });
});
