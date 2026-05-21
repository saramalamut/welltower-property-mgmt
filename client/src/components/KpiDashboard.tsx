import { useDeferredValue, useMemo, useState } from 'react';
import { endOfMonth, format, parseISO, startOfMonth, subMonths } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { formatCents } from '@/format/money';
import {
  averageRentByProperty,
  moveInsInPeriod,
  moveOutsInPeriod,
  occupancyRateByProperty,
} from '@/lib/kpis';
import type { RentRollRow } from '@/types';

interface Property {
  id: number;
  name: string;
}

interface Props {
  rows: RentRollRow[];
  properties: Property[];
  minDate: string;
  maxDate: string;
}

// Most recent complete calendar month in [minDate, maxDate]. If maxDate is
// 2025-03-01, March has only 1 day of data, so we step back to February.
function defaultRange(minDate: string, maxDate: string): { from: string; to: string } {
  if (!maxDate) return { from: '', to: '' };
  const max = parseISO(maxDate);
  const monthEndIso = format(endOfMonth(max), 'yyyy-MM-dd');
  const useMonth = monthEndIso <= maxDate ? max : subMonths(max, 1);
  let from = format(startOfMonth(useMonth), 'yyyy-MM-dd');
  const to = format(endOfMonth(useMonth), 'yyyy-MM-dd');
  if (minDate && from < minDate) from = minDate;
  return { from, to };
}

const formatPercent = (ratio: number): string => `${(ratio * 100).toFixed(1)}%`;

export function KpiDashboard({ rows, properties, minDate, maxDate }: Props) {
  const [range, setRange] = useState(() => defaultRange(minDate, maxDate));
  // Inputs stay snappy on every keystroke; KPI passes (four full-CSV walks)
  // only re-run when the date inputs quiesce.
  const deferredRange = useDeferredValue(range);

  const kpis = useMemo(
    () => ({
      avgRent: averageRentByProperty(rows, deferredRange.from, deferredRange.to),
      occupancy: occupancyRateByProperty(rows, deferredRange.from, deferredRange.to),
      moveIns: moveInsInPeriod(rows, deferredRange.from, deferredRange.to),
      moveOuts: moveOutsInPeriod(rows, deferredRange.from, deferredRange.to),
    }),
    [rows, deferredRange.from, deferredRange.to],
  );

  const rangeInvalid = range.from && range.to && range.from > range.to;

  return (
    <section aria-label="KPIs" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-2">
        <Field label="From">
          <Input
            type="date"
            value={range.from}
            min={minDate || undefined}
            max={maxDate || undefined}
            onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
          />
        </Field>
        <Field label="To">
          <Input
            type="date"
            value={range.to}
            min={minDate || undefined}
            max={maxDate || undefined}
            onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
          />
        </Field>
        {rangeInvalid && (
          <p className="sm:col-span-2 text-xs text-amber-700">
            From date is after To date — KPIs will show 0.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Avg rent"
          value={kpis.avgRent.portfolio === 0 ? '—' : formatCents(kpis.avgRent.portfolio)}
          sublabel="portfolio (occupied units)"
        />
        <SummaryCard
          label="Occupancy"
          value={formatPercent(kpis.occupancy.portfolio)}
          sublabel="portfolio (day-weighted)"
        />
        <SummaryCard
          label="Move-ins"
          value={String(kpis.moveIns.portfolio)}
          sublabel="in period"
        />
        <SummaryCard
          label="Move-outs"
          value={String(kpis.moveOuts.portfolio)}
          sublabel="in period"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead className="text-right">Avg rent</TableHead>
              <TableHead className="text-right">Occupancy</TableHead>
              <TableHead className="text-right">Move-ins</TableHead>
              <TableHead className="text-right">Move-outs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  No properties in rent roll.
                </TableCell>
              </TableRow>
            ) : (
              properties.map(p => {
                const avg = kpis.avgRent.byProperty[p.id];
                const occ = kpis.occupancy.byProperty[p.id] ?? 0;
                const ins = kpis.moveIns.byProperty[p.id] ?? 0;
                const outs = kpis.moveOuts.byProperty[p.id] ?? 0;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {avg === undefined ? '—' : formatCents(avg)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPercent(occ)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{ins}</TableCell>
                    <TableCell className="text-right tabular-nums">{outs}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          {properties.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell>Portfolio</TableCell>
                <TableCell className="text-right tabular-nums">
                  {kpis.avgRent.portfolio === 0
                    ? '—'
                    : formatCents(kpis.avgRent.portfolio)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(kpis.occupancy.portfolio)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {kpis.moveIns.portfolio}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {kpis.moveOuts.portfolio}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SummaryCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
    </div>
  );
}
