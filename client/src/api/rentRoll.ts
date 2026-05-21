import type { RentRollRow } from '../types';

export async function fetchRentRoll(): Promise<RentRollRow[]> {
  const res = await fetch('/api/rent-roll');
  if (!res.ok) throw new Error(`Failed to fetch rent roll: ${res.status}`);
  return (await res.json()) as RentRollRow[];
}
