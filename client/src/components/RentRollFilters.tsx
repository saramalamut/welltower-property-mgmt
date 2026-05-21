import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

type PropertyOption = { id: number; name: string };
type PropertyFilter = number | 'all';
type StatusFilter = 'all' | 'occupied' | 'vacant';

interface Props {
  properties: PropertyOption[];
  propertyId: PropertyFilter;
  status: StatusFilter;
  asOfDate: string;
  minDate: string;
  maxDate: string;
  onPropertyChange: (value: PropertyFilter) => void;
  onStatusChange: (value: StatusFilter) => void;
  onAsOfDateChange: (value: string) => void;
}

export function RentRollFilters({
  properties,
  propertyId,
  status,
  asOfDate,
  minDate,
  maxDate,
  onPropertyChange,
  onStatusChange,
  onAsOfDateChange,
}: Props) {
  return (
    <section
      aria-label="Filters"
      className="grid grid-cols-1 gap-4 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-3"
    >
      <Field label="Property">
        <Select
          value={propertyId === 'all' ? 'all' : String(propertyId)}
          onValueChange={value =>
            onPropertyChange(value === 'all' ? 'all' : Number(value))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All properties</SelectItem>
            {properties.map(p => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Status">
        <Select value={status} onValueChange={v => onStatusChange(v as StatusFilter)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="vacant">Vacant</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="As of">
        <Input
          type="date"
          value={asOfDate}
          min={minDate || undefined}
          max={maxDate || undefined}
          onChange={e => onAsOfDateChange(e.target.value)}
        />
      </Field>
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
