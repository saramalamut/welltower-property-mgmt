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
    case 'MOVE_IN':
      return state;
    case 'MOVE_OUT':
      return state;
  }
}
