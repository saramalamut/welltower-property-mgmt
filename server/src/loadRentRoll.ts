import { promises as fs } from 'fs';
import { parse } from 'csv-parse/sync';
import type { RentRollRow } from './types';

interface CsvRow {
  date: string;
  property_id: string;
  property_name: string;
  unit_number: string;
  resident_id: string;
  resident_name: string;
  monthly_rent: string;
}

export async function loadRentRoll(csvPath: string): Promise<RentRollRow[]> {
  const content = await fs.readFile(csvPath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];
  return records.map(toRow);
}

function toRow(r: CsvRow): RentRollRow {
  return {
    date: r.date,
    property_id: Number(r.property_id),
    property_name: r.property_name,
    unit_number: r.unit_number,
    resident_id: r.resident_id === '' ? null : Number(r.resident_id),
    resident_name: r.resident_name === '' ? null : r.resident_name,
    monthly_rent_cents: Math.round(Number(r.monthly_rent) * 100),
  };
}
