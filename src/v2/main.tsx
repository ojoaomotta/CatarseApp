import React from 'react';
import ReactDOM from 'react-dom/client';
import { FinanceRoot } from './FinanceRoot';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><FinanceRoot /></React.StrictMode>);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  void navigator.serviceWorker.register('/sw.js').catch(() => { /* Online access remains available. */ });
}
