// Scoring rules. A score is a whole number from 0 (nothing filled) to LEVELS
// (the outer ring filled), shown as a percentage in 20% steps.

import { LEVELS, WHEELS } from './config.js';

// Tapping a ring sets the score to that ring. Tapping the ring that is
// already the score clears the area back to 0 (the original wheel's rule).
export function tapLevel(current, tapped) {
  return current === tapped ? 0 : tapped;
}

export function stepLevel(current, delta) {
  return Math.min(LEVELS, Math.max(0, current + delta));
}

export function toPercent(level) {
  return Math.round((level / LEVELS) * 100);
}

export function averagePercent(levels) {
  if (!levels.length) return 0;
  return Math.round(levels.reduce((sum, l) => sum + toPercent(l), 0) / levels.length);
}

export function emptyLevels(wheel) {
  return wheel.slices.map(() => 0);
}

export function emptyScores(wheels = WHEELS) {
  return Object.fromEntries(wheels.map((w) => [w.id, emptyLevels(w)]));
}

export function isValidLevel(n) {
  return Number.isInteger(n) && n >= 0 && n <= LEVELS;
}
