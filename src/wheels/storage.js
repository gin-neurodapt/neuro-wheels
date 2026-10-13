// Remembers the scores on THIS device only (browser localStorage), so a
// reload or an accidental pull-to-refresh does not lose them. Nothing is ever
// sent anywhere. Every read is validated: stored data is treated as untrusted
// and anything malformed falls back to an empty wheel.
//
// The scores and the open wheel are kept under separate keys. Two open tabs
// share the scores (each follows the other's changes through the browser's
// "storage" event) but each keeps its own open wheel — if the open wheel were
// stored with the scores, two tabs on different wheels would keep re-saving
// over each other.

import { WHEELS, DEFAULT_WHEEL_ID, findWheel } from './config.js';
import { emptyLevels, isValidLevel } from './scores.js';
import { cleanLabel } from './filename.js';

export const STORAGE_KEY = 'neurodapt-wheels:v2';
export const ACTIVE_KEY = 'neurodapt-wheels:v2:active';

export function initialState(wheels = WHEELS) {
  return {
    active: DEFAULT_WHEEL_ID,
    scores: Object.fromEntries(wheels.map((w) => [w.id, emptyLevels(w)])),
    label: '',
  };
}

// Scores and label from a stored string. `active` is not part of it.
export function parseState(raw, wheels = WHEELS) {
  const state = initialState(wheels);
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return state;
  }
  if (!data || typeof data !== 'object') return state;

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

export function serializeState(state) {
  return JSON.stringify({ v: 2, scores: state.scores, label: state.label });
}

function read(storage, key) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(storage, key, value) {
  try {
    // Only write what changed: an unchanged write would still wake every
    // other open tab.
    if (storage && storage.getItem(key) !== value) storage.setItem(key, value);
  } catch {
    // Private browsing or storage full: the page still works, it just will
    // not remember the scores.
  }
}

export function loadState(storage, wheels = WHEELS) {
  const raw = read(storage, STORAGE_KEY);
  const state = raw ? parseState(raw, wheels) : initialState(wheels);
  const active = read(storage, ACTIVE_KEY);
  if (active && wheels.some((w) => w.id === active)) state.active = active;
  return state;
}

export function saveState(storage, state) {
  write(storage, STORAGE_KEY, serializeState(state));
  write(storage, ACTIVE_KEY, state.active);
}

// "#business" in the address opens that wheel, so a link can go straight to it.
export function wheelFromHash(hash) {
  const id = String(hash || '').replace(/^#\/?/, '').toLowerCase();
  return findWheel(id) ? id : null;
}
