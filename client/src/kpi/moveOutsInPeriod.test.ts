import { describe, expect, it } from 'vitest';
import { moveOutsInPeriod } from './moveOutsInPeriod';
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

describe('moveOutsInPeriod', () => {
  it('counts an occupied→vacant transition as a move-out', () => {
    const rows = [mk('2025-01-01', 1), mk('2025-01-02', null)];
    expect(moveOutsInPeriod(rows, { start: '2025-01-01', end: '2025-01-31' })).toEqual({ 1: 1 });
  });

  it('counts a resident swap (A→B) as a move-out', () => {
    const rows = [mk('2025-01-01', 1), mk('2025-01-02', 2)];
    expect(moveOutsInPeriod(rows, { start: '2025-01-01', end: '2025-01-31' })).toEqual({ 1: 1 });
  });

  it('does not count vacant→vacant or occupied→same-resident', () => {
    const rows = [
      mk('2025-01-01', null),
      mk('2025-01-02', null),
      mk('2025-01-03', 1),
      mk('2025-01-04', 1),
    ];
    expect(moveOutsInPeriod(rows, { start: '2025-01-01', end: '2025-01-31' })).toEqual({});
  });

  it('excludes transitions outside the range', () => {
    const rows = [mk('2025-01-31', 1), mk('2025-02-01', null)];
    expect(moveOutsInPeriod(rows, { start: '2025-01-01', end: '2025-01-31' })).toEqual({});
  });
});
