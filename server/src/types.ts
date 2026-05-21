export interface RentRollRow {
  date: string;
  property_id: number;
  property_name: string;
  unit_number: string;
  resident_id: number | null;
  resident_name: string | null;
  monthly_rent_cents: number;
}
