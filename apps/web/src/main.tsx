import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { initKeycloak, isAuthenticated, doLogin } from './auth';
import { connectPowerSync } from './db';

const root = ReactDOM.createRoot(document.getElementById('root')!);

const render = () => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
};

initKeycloak(async () => {
  if (isAuthenticated()) {
    console.log("Logged in, connecting PowerSync...");
    try {
      await connectPowerSync();
    } catch (e) {
      console.error("Failed to connect PowerSync", e);
    }
  }
  render();
});

// Initial render (might be unauthenticated)
render();
