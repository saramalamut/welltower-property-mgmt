import { useRentRoll } from './state/RentRollContext';

export default function App() {
  const { state } = useRentRoll();

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Welltower Rent Roll</h1>
        <p className="text-sm text-slate-600">
          Status: {state.status}
          {state.status === 'ready' && ` — ${state.rows.length} rows loaded`}
          {state.status === 'error' && ` — ${state.error}`}
        </p>
      </header>
    </div>
  );
}
