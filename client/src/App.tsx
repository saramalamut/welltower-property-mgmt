import { useEffect, useMemo, useState } from 'react';
import { useRentRoll } from './state/RentRollContext';
import { RentRollFilters } from './components/RentRollFilters';
import { RentRollTable } from './components/RentRollTable';
import type { RentRollRow } from './types';

type PropertyOption = { id: number; name: string };
type PropertyFilter = number | 'all';
type StatusFilter = 'all' | 'occupied' | 'vacant';

function statusOf(row: RentRollRow): 'occupied' | 'vacant' {
  return row.resident_id === null ? 'vacant' : 'occupied';
}

export default function App() {
  const { state } = useRentRoll();

  const properties = useMemo<PropertyOption[]>(() => {
    const byId = new Map<number, string>();
    for (const row of state.rows) byId.set(row.property_id, row.property_name);
    return Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [state.rows]);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    for (const row of state.rows) set.add(row.date);
    return Array.from(set).sort();
  }, [state.rows]);

  const mostRecentDate = availableDates.at(-1) ?? '';
  const earliestDate = availableDates[0] ?? '';

  const [propertyId, setPropertyId] = useState<PropertyFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [asOfDate, setAsOfDate] = useState<string>('');

  useEffect(() => {
    if (!asOfDate && mostRecentDate) setAsOfDate(mostRecentDate);
  }, [asOfDate, mostRecentDate]);

  const filteredRows = useMemo(() => {
    if (!asOfDate) return [];
    return state.rows.filter(row => {
      if (row.date !== asOfDate) return false;
      if (propertyId !== 'all' && row.property_id !== propertyId) return false;
      if (status !== 'all' && statusOf(row) !== status) return false;
      return true;
    });
  }, [state.rows, asOfDate, propertyId, status]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-10">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Welltower Rent Roll</h1>
          <p className="text-sm text-muted-foreground">
            {state.status === 'loading' && 'Loading rent roll…'}
            {state.status === 'error' && `Error: ${state.error}`}
            {state.status === 'ready' &&
              `${state.rows.length.toLocaleString()} records across ${properties.length} ${
                properties.length === 1 ? 'property' : 'properties'
              }`}
          </p>
        </header>

        {state.status === 'ready' && (
          <>
            <RentRollFilters
              properties={properties}
              propertyId={propertyId}
              status={status}
              asOfDate={asOfDate}
              minDate={earliestDate}
              maxDate={mostRecentDate}
              onPropertyChange={setPropertyId}
              onStatusChange={setStatus}
              onAsOfDateChange={setAsOfDate}
            />
            <RentRollTable rows={filteredRows} />
          </>
        )}
      </div>
    </div>
  );
}
