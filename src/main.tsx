import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Initialize dark mode from the persisted preference (warm light by default)
const storedDarkMode = localStorage.getItem('claimcutter-storage');
let darkMode = false;
if (storedDarkMode) {
  try {
    const parsed = JSON.parse(storedDarkMode);
    if (parsed.state?.darkMode !== undefined) {
      darkMode = parsed.state.darkMode;
    }
  } catch {
    // Ignore parse errors and keep the warm light default.
  }
}
if (darkMode) {
  document.documentElement.classList.add('dark');
}
document.documentElement.dataset.accent = localStorage.getItem('claimcutter-accent') === 'green' ? 'green' : 'slate';
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkMode ? '#181613' : '#F7F4ED');
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);