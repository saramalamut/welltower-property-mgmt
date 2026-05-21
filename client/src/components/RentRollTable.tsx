import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCents } from '@/format/money';
import { MoveInDialog } from './MoveInDialog';
import { MoveOutDialog } from './MoveOutDialog';
import type { RentRollRow } from '@/types';

interface Props {
  rows: RentRollRow[];
  asOfDate: string;
}

type ActiveAction =
  | null
  | { kind: 'move-in'; row: RentRollRow }
  | { kind: 'move-out'; row: RentRollRow };

export function RentRollTable({ rows, asOfDate }: Props) {
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);

  return (
    <>
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
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
                    <TableCell className="text-right">
                      {occupied ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setActiveAction({ kind: 'move-out', row })}
                        >
                          Move out
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveAction({ kind: 'move-in', row })}
                        >
                          Move in
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </section>

      <MoveInDialog
        open={activeAction?.kind === 'move-in'}
        onOpenChange={open => !open && setActiveAction(null)}
        row={activeAction?.kind === 'move-in' ? activeAction.row : null}
        asOfDate={asOfDate}
      />
      <MoveOutDialog
        open={activeAction?.kind === 'move-out'}
        onOpenChange={open => !open && setActiveAction(null)}
        row={activeAction?.kind === 'move-out' ? activeAction.row : null}
        asOfDate={asOfDate}
      />
    </>
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
