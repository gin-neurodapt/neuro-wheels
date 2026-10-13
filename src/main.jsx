import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are bundled with the page (no Google Fonts request), which keeps
// visitors' details away from third parties and lets the strict security
// policy allow fonts from this site only.
import '@fontsource/eb-garamond/latin-400.css';
import '@fontsource/eb-garamond/latin-500.css';
import '@fontsource/tajawal/latin-400.css';
import '@fontsource/tajawal/latin-500.css';
import '@fontsource/tajawal/latin-700.css';
import './styles.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
