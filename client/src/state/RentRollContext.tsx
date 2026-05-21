import { createContext, useContext, useEffect, useReducer } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { fetchRentRoll } from '../api/rentRoll';
import { initialState, rentRollReducer } from './rentRollReducer';
import type { Action, State } from './rentRollReducer';

interface ContextValue {
  state: State;
  dispatch: Dispatch<Action>;
}

const RentRollContext = createContext<ContextValue | null>(null);

export function RentRollProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(rentRollReducer, initialState);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'LOADING' });
    fetchRentRoll()
      .then(rows => {
        if (!cancelled) dispatch({ type: 'SET_ROWS', rows });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: 'ERROR',
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RentRollContext.Provider value={{ state, dispatch }}>
      {children}
    </RentRollContext.Provider>
  );
}

export function useRentRoll(): ContextValue {
  const ctx = useContext(RentRollContext);
  if (!ctx) throw new Error('useRentRoll must be used inside RentRollProvider');
  return ctx;
}
