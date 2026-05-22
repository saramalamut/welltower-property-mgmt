import { useEffect, useMemo, useState } from 'react';
import { addYears, format, parseISO } from 'date-fns';
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

interface Errors {
  name?: string;
  date?: string;
  rent?: string;
}

// Rent range sized for senior living: high-end memory care can exceed
// $50k/month, so a tighter ceiling would reject valid market rents.
const MIN_RENT_USD = 500;
const MAX_RENT_USD = 100_000;

function validate(
  name: string,
  date: string,
  rent: string,
  asOfDate: string,
  maxDate: string,
): Errors {
  const errors: Errors = {};
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    errors.name = 'Resident name must be between 2 and 80 characters.';
  }
  if (!date) {
    errors.date = 'Move-in date is required.';
  } else if (date < asOfDate) {
    errors.date = `Move-in date must be on or after the as-of date (${asOfDate}).`;
  } else if (maxDate && date > maxDate) {
    errors.date = `Move-in date must be within one year of the as-of date (on or before ${maxDate}).`;
  }
  const rentNum = Number(rent);
  if (!rent || Number.isNaN(rentNum)) {
    errors.rent = 'Monthly rent is required.';
  } else if (rentNum < MIN_RENT_USD || rentNum > MAX_RENT_USD) {
    errors.rent = `Monthly rent must be between $${MIN_RENT_USD.toLocaleString()} and $${MAX_RENT_USD.toLocaleString()}.`;
  }
  return errors;
}

export function MoveInDialog({ open, onOpenChange, row, asOfDate }: Props) {
  const { state, dispatch } = useRentRoll();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [rent, setRent] = useState('');
  const [attempted, setAttempted] = useState(false);

  const maxMoveInDate = useMemo(
    () => (asOfDate ? format(addYears(parseISO(asOfDate), 1), 'yyyy-MM-dd') : ''),
    [asOfDate],
  );

  useEffect(() => {
    if (open) {
      setName('');
      setDate(asOfDate);
      setRent('');
      setAttempted(false);
    }
  }, [open, asOfDate, row?.property_id, row?.unit_number]);

  const errors = useMemo(
    () => validate(name, date, rent, asOfDate, maxMoveInDate),
    [name, date, rent, asOfDate, maxMoveInDate],
  );
  const showErrors = attempted;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (Object.keys(errors).length > 0 || !row) return;
    const nextResidentId =
      state.rows.reduce((max, r) => Math.max(max, r.resident_id ?? 0), 0) + 1;
    dispatch({
      type: 'MOVE_IN',
      date,
      property_id: row.property_id,
      unit_number: row.unit_number,
      resident_id: nextResidentId,
      resident_name: name.trim(),
      monthly_rent_cents: Math.round(Number(rent) * 100),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Move in</DialogTitle>
            <DialogDescription>
              {row
                ? `${row.property_name} · Unit ${row.unit_number}`
                : 'Record a new resident.'}
            </DialogDescription>
          </DialogHeader>

          <Field
            label="Resident name"
            error={showErrors ? errors.name : undefined}
            htmlFor="move-in-name"
          >
            <Input
              id="move-in-name"
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              aria-invalid={showErrors && !!errors.name}
              maxLength={80}
            />
          </Field>

          <Field
            label="Move-in date"
            error={showErrors ? errors.date : undefined}
            htmlFor="move-in-date"
          >
            <Input
              id="move-in-date"
              type="date"
              value={date}
              min={asOfDate || undefined}
              max={maxMoveInDate || undefined}
              onChange={e => setDate(e.target.value)}
              aria-invalid={showErrors && !!errors.date}
            />
          </Field>

          <Field
            label="Monthly rent (USD)"
            error={showErrors ? errors.rent : undefined}
            htmlFor="move-in-rent"
          >
            <Input
              id="move-in-rent"
              type="number"
              inputMode="decimal"
              min={MIN_RENT_USD}
              max={MAX_RENT_USD}
              step={1}
              placeholder="2000"
              value={rent}
              onChange={e => setRent(e.target.value)}
              aria-invalid={showErrors && !!errors.rent}
            />
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Move in</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
