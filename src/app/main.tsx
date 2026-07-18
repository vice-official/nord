import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import { AppRouter } from './providers/AppRouter';

const prepareApp = async () => {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') {
    return;
  }

  const { worker } = await import('@/shared/api/mocks/browser.ts');

  return worker.start({
    onUnhandledRequest: 'bypass'
  });
};

prepareApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>
  );
});