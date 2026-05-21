import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCents } from '@/format/money';
import type { RentRollRow } from '@/types';

interface Props {
  rows: RentRollRow[];
}

export function RentRollTable({ rows }: Props) {
  return (
    <section
      aria-label="Rent roll table"
      className="overflow-hidden rounded-xl border bg-card shadow-sm"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Resident</TableHead>
            <TableHead className="text-right">Monthly rent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>As of</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No units match the current filters.
              </TableCell>
            </TableRow>
          ) : (
            rows.map(row => {
              const occupied = row.resident_id !== null;
              return (
                <TableRow key={`${row.property_id}-${row.unit_number}-${row.date}`}>
                  <TableCell className="font-medium">{row.property_name}</TableCell>
                  <TableCell>{row.unit_number}</TableCell>
                  <TableCell className={occupied ? '' : 'text-muted-foreground'}>
                    {row.resident_name ?? '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCents(row.monthly_rent_cents)}
                  </TableCell>
                  <TableCell>
                    <StatusPill occupied={occupied} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.date}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </section>
  );
}

function StatusPill({ occupied }: { occupied: boolean }) {
  return (
    <span
      className={
        occupied
          ? 'inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700'
          : 'inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600'
      }
    >
      {occupied ? 'Occupied' : 'Vacant'}
    </span>
  );
}
