// Draws each page to HTML when the site is built (scripts/prerender.mjs), so
// search engines and AI assistants get the full page without running code.
// Nothing here runs in visitors' browsers.
import { renderToString } from 'react-dom/server';
import logoUrl from './assets/logo.svg';
import App from './App.jsx';
import { NotFound } from './components/NotFound.jsx';
import { initialState } from './wheels/storage.js';

export { ALL_PAGES } from './wheels/pages.js';
export * as seo from './wheels/seo.js';

// The page as a first-time visitor sees it: the named wheel, nothing scored.
export function renderWheelPage(wheelId) {
  return renderToString(<App start={{ ...initialState(), active: wheelId }} />);
}

export function renderNotFound() {
  return renderToString(<NotFound logoUrl={logoUrl} />);
}
