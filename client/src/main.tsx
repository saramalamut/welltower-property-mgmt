import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { RentRollProvider } from './state/RentRollContext';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RentRollProvider>
      <App />
    </RentRollProvider>
  </React.StrictMode>,
);
