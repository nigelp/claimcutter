import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Initialize dark mode from persisted store (defaults to dark)
const storedDarkMode = localStorage.getItem('claimcutter-storage');
let darkMode = true;
if (storedDarkMode) {
  try {
    const parsed = JSON.parse(storedDarkMode);
    if (parsed.state?.darkMode !== undefined) {
      darkMode = parsed.state.darkMode;
    }
  } catch (e) {
    // ignore parse errors, keep default dark
  }
}
if (darkMode) {
  document.documentElement.classList.add('dark');
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);