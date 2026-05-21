import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRentRoll } from '@/state/RentRollContext';
import type { RentRollRow } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: RentRollRow | null;
  asOfDate: string;
}

function currentResidentMoveInDate(
  rows: RentRollRow[],
  propertyId: number,
  unitNumber: string,
  asOfDate: string,
): string {
  const unitRows = rows
    .filter(r => r.property_id === propertyId && r.unit_number === unitNumber)
    .sort((a, b) => a.date.localeCompare(b.date));
  const asOfRow = unitRows.find(r => r.date === asOfDate);
  if (!asOfRow || asOfRow.resident_id === null) return asOfDate;
  const currentResidentId = asOfRow.resident_id;
  let firstDate = asOfDate;
  for (let i = unitRows.length - 1; i >= 0; i--) {
    const r = unitRows[i];
    if (!r || r.date > asOfDate) continue;
    if (r.resident_id === currentResidentId) firstDate = r.date;
    else break;
  }
  return firstDate;
}

export function MoveOutDialog({ open, onOpenChange, row, asOfDate }: Props) {
  const { state, dispatch } = useRentRoll();
  const [date, setDate] = useState('');
  const [attempted, setAttempted] = useState(false);

  const residentMoveInDate = useMemo(() => {
    if (!row) return asOfDate;
    return currentResidentMoveInDate(
      state.rows,
      row.property_id,
      row.unit_number,
      asOfDate,
    );
  }, [state.rows, row, asOfDate]);

  useEffect(() => {
    if (open) {
      setDate(asOfDate);
      setAttempted(false);
    }
  }, [open, asOfDate, row?.property_id, row?.unit_number]);

  const error = useMemo(() => {
    if (!date) return 'Move-out date is required.';
    if (date < residentMoveInDate) {
      return `Move-out date must be on or after the resident's move-in date (${residentMoveInDate}).`;
    }
    return undefined;
  }, [date, residentMoveInDate]);

  const showError = attempted && error;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (error || !row) return;
    dispatch({
      type: 'MOVE_OUT',
      date,
      property_id: row.property_id,
      unit_number: row.unit_number,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Move out</DialogTitle>
            <DialogDescription>
              {row
                ? `${row.property_name} · Unit ${row.unit_number}`
                : 'Record a move-out.'}
            </DialogDescription>
          </DialogHeader>

          {row && row.resident_name && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg border bg-muted/40 px-3 py-2 text-xs">
              <dt className="text-muted-foreground">Resident</dt>
              <dd className="font-medium">{row.resident_name}</dd>
              <dt className="text-muted-foreground">Move-in date</dt>
              <dd className="font-medium tabular-nums">{residentMoveInDate}</dd>
            </dl>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="move-out-date"
              className="text-xs font-medium text-muted-foreground"
            >
              Move-out date
            </label>
            <Input
              id="move-out-date"
              type="date"
              autoFocus
              value={date}
              min={residentMoveInDate || undefined}
              onChange={e => setDate(e.target.value)}
              aria-invalid={!!showError}
            />
            {showError && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive">
              Move out
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
