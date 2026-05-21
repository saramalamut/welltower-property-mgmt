import { promises as fs } from 'fs';
import { parse } from 'csv-parse/sync';
import type { RentRollRow } from './types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function loadRentRoll(csvPath: string): Promise<RentRollRow[]> {
  const content = await fs.readFile(csvPath, 'utf-8');
  const records = parse(content, {
    columns: true,
    cast: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, unknown>[];

  const rows: RentRollRow[] = [];
  let i = 0;
  for (const record of records) {
    try {
      rows.push(toRow(record));
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      // CSV line number: header is line 1, so data row i is line i+2.
      console.warn(`Skipping malformed CSV row at line ${i + 2}: ${reason}`);
    }
    i++;
  }
  return rows;
}

function toRow(r: Record<string, unknown>): RentRollRow {
  const date = r.date;
  if (typeof date !== 'string' || !ISO_DATE.test(date)) {
    throw new Error(`invalid date: ${String(date)}`);
  }

  const property_id = r.property_id;
  if (typeof property_id !== 'number' || !Number.isFinite(property_id)) {
    throw new Error(`invalid property_id: ${String(property_id)}`);
  }

  const property_name = r.property_name;
  if (typeof property_name !== 'string' || property_name === '') {
    throw new Error(`invalid property_name: ${String(property_name)}`);
  }

  const unit_number = r.unit_number;
  if (typeof unit_number !== 'string' || unit_number === '') {
    throw new Error(`invalid unit_number: ${String(unit_number)}`);
  }

  const monthly_rent = r.monthly_rent;
  if (typeof monthly_rent !== 'number' || !Number.isFinite(monthly_rent)) {
    throw new Error(`invalid monthly_rent: ${String(monthly_rent)}`);
  }

  const rawResidentId = r.resident_id;
  let resident_id: number | null;
  if (rawResidentId === '' || rawResidentId === null || rawResidentId === undefined) {
    resident_id = null;
  } else if (typeof rawResidentId === 'number' && Number.isFinite(rawResidentId)) {
    resident_id = rawResidentId;
  } else {
    throw new Error(`invalid resident_id: ${String(rawResidentId)}`);
  }

  const rawResidentName = r.resident_name;
  let resident_name: string | null;
  if (rawResidentName === '' || rawResidentName === null || rawResidentName === undefined) {
    resident_name = null;
  } else if (typeof rawResidentName === 'string') {
    resident_name = rawResidentName;
  } else {
    throw new Error(`invalid resident_name: ${String(rawResidentName)}`);
  }

  return {
    date,
    property_id,
    property_name,
    unit_number,
    resident_id,
    resident_name,
    monthly_rent_cents: Math.round(monthly_rent * 100),
  };
}
