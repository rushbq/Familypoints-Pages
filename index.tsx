import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { startVersionMonitor } from './services/versionService';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
    <PWAUpdatePrompt />
  </React.StrictMode>
);

startVersionMonitor();
