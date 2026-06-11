import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { useAuthStore } from './store/useAuthStore';
import { startSyncEngine } from './lib/syncEngine';

// Ordre important : on installe d'abord le moteur de sync (abonnements aux
// stores), PUIS on déclenche l'init de l'auth. Ainsi l'abonnement auth est en
// place avant que l'évènement INITIAL_SESSION ne soit émis de façon asynchrone.
startSyncEngine();
useAuthStore.getState().init();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
