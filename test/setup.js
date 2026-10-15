import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Test files marked "@vitest-environment node" have no browser at all (they
// check the pages built ahead of time); everything below is for the rest.
const browser = typeof window !== 'undefined';

// jsdom has no canvas: return "no context" quietly so the page falls back to
// estimated text widths, exactly as a browser without canvas would.
if (browser) HTMLCanvasElement.prototype.getContext = () => null;

afterEach(() => {
  if (!browser) return;
  cleanup();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});
