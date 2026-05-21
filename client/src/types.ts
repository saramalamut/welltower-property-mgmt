export interface RentRollRow {
  date: string;
  property_id: number;
  property_name: string;
  unit_number: string;
  resident_id: number | null;
  resident_name: string | null;
  monthly_rent_cents: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface FilterState {
  propertyId?: number;
  occupancy?: 'occupied' | 'vacant';
  search?: string;
}
