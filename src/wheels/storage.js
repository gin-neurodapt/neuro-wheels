// Remembers the scores on THIS device only (browser localStorage), so a
// reload or an accidental pull-to-refresh does not lose them. Nothing is ever
// sent anywhere. Every read is validated: stored data is treated as untrusted
// and anything malformed falls back to an empty wheel.

import { WHEELS, DEFAULT_WHEEL_ID, findWheel } from './config.js';
import { emptyLevels, isValidLevel } from './scores.js';
import { cleanLabel } from './filename.js';

export const STORAGE_KEY = 'neurodapt-wheels:v2';

export function initialState(wheels = WHEELS) {
  return {
    active: DEFAULT_WHEEL_ID,
    scores: Object.fromEntries(wheels.map((w) => [w.id, emptyLevels(w)])),
    label: '',
  };
}

export function parseState(raw, wheels = WHEELS) {
  const state = initialState(wheels);
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return state;
  }
  if (!data || typeof data !== 'object') return state;

  if (typeof data.active === 'string' && wheels.some((w) => w.id === data.active)) {
    state.active = data.active;
  }
  if (data.scores && typeof data.scores === 'object') {
    for (const wheel of wheels) {
      const levels = data.scores[wheel.id];
      if (Array.isArray(levels) && levels.length === wheel.slices.length && levels.every(isValidLevel)) {
        state.scores[wheel.id] = [...levels];
      }
    }
  }
  if (typeof data.label === 'string') state.label = cleanLabel(data.label);
  return state;
}

export function loadState(storage, wheels = WHEELS) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? parseState(raw, wheels) : initialState(wheels);
  } catch {
    return initialState(wheels);
  }
}

export function saveState(storage, state) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ v: 2, active: state.active, scores: state.scores, label: state.label }));
  } catch {
    // Private browsing or storage full: the page still works, it just will
    // not remember the scores.
  }
}

// "#business" in the address opens that wheel, so a link can go straight to it.
export function wheelFromHash(hash) {
  const id = String(hash || '').replace(/^#\/?/, '').toLowerCase();
  return findWheel(id) ? id : null;
}
