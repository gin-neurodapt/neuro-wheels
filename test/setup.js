import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom has no canvas: return "no context" quietly so the page falls back to
// estimated text widths, exactly as a browser without canvas would.
HTMLCanvasElement.prototype.getContext = () => null;

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});
