import { describe, expect, it } from 'vitest';
import { averageRentByProperty } from './averageRentByProperty';
import type { RentRollRow } from '../types';

const mk = (overrides: Partial<RentRollRow>): RentRollRow => ({
  date: '2025-01-01',
  property_id: 1,
  property_name: 'Test',
  unit_number: 'U01',
  resident_id: 1,
  resident_name: 'R1',
  monthly_rent_cents: 100000,
  ...overrides,
});

describe('averageRentByProperty', () => {
  it('averages occupied rents per property within range', () => {
    const rows: RentRollRow[] = [
      mk({ property_id: 1, monthly_rent_cents: 100000 }),
      mk({ property_id: 1, monthly_rent_cents: 200000 }),
      mk({ property_id: 2, monthly_rent_cents: 500000 }),
    ];
    expect(
      averageRentByProperty(rows, { start: '2025-01-01', end: '2025-01-31' }),
    ).toEqual({ 1: 150000, 2: 500000 });
  });

  it('excludes vacant units from the average', () => {
    const rows: RentRollRow[] = [
      mk({ property_id: 1, monthly_rent_cents: 100000 }),
      mk({
        property_id: 1,
        resident_id: null,
        resident_name: null,
        monthly_rent_cents: 0,
      }),
    ];
    expect(
      averageRentByProperty(rows, { start: '2025-01-01', end: '2025-01-31' }),
    ).toEqual({ 1: 100000 });
  });

  it('excludes rows outside the range', () => {
    const rows: RentRollRow[] = [
      mk({ date: '2024-12-31', monthly_rent_cents: 999999 }),
      mk({ date: '2025-01-15', monthly_rent_cents: 100000 }),
    ];
    expect(
      averageRentByProperty(rows, { start: '2025-01-01', end: '2025-01-31' }),
    ).toEqual({ 1: 100000 });
  });

  it('returns an empty map when no rows match', () => {
    expect(
      averageRentByProperty([], { start: '2025-01-01', end: '2025-01-31' }),
    ).toEqual({});
  });
});
