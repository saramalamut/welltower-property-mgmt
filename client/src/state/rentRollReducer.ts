import type { RentRollRow } from '../types';

export interface State {
  rows: RentRollRow[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
}

export type Action =
  | { type: 'LOADING' }
  | { type: 'SET_ROWS'; rows: RentRollRow[] }
  | { type: 'ERROR'; error: string }
  | {
      type: 'MOVE_IN';
      date: string;
      property_id: number;
      unit_number: string;
      resident_id: number;
      resident_name: string;
      monthly_rent_cents: number;
    }
  | {
      type: 'MOVE_OUT';
      date: string;
      property_id: number;
      unit_number: string;
    };

export const initialState: State = { rows: [], status: 'idle' };

export function rentRollReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOADING':
      return { ...state, status: 'loading' };
    case 'SET_ROWS':
      return { rows: action.rows, status: 'ready' };
    case 'ERROR':
      return { ...state, status: 'error', error: action.error };
    // Move-in/out is a forward-effective assertion, not an audit-logged event:
    // every snapshot for this unit on/after action.date is overwritten in place.
    // See README "Known follow-ups" for the event-sourced alternative.
    case 'MOVE_IN':
      return {
        ...state,
        rows: state.rows.map(r =>
          r.property_id === action.property_id &&
          r.unit_number === action.unit_number &&
          r.date >= action.date
            ? {
                ...r,
                resident_id: action.resident_id,
                resident_name: action.resident_name,
                monthly_rent_cents: action.monthly_rent_cents,
              }
            : r,
        ),
      };
    case 'MOVE_OUT':
      return {
        ...state,
        rows: state.rows.map(r =>
          r.property_id === action.property_id &&
          r.unit_number === action.unit_number &&
          r.date >= action.date
            ? { ...r, resident_id: null, resident_name: null, monthly_rent_cents: 0 }
            : r,
        ),
      };
  }
}
