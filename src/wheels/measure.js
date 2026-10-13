// Real text widths, from the browser's own font engine, so labels around the
// wheel get exactly the room they need. Falls back to an estimate where the
// browser cannot measure (tests).

import { estimateWidth } from './geometry.js';

let context;

function getContext() {
  if (context === undefined) {
    try {
      context = document.createElement('canvas').getContext('2d') || null;
    } catch {
      context = null;
    }
  }
  return context;
}

export function createMeasure() {
  const ctx = getContext();
  if (!ctx || typeof ctx.measureText !== 'function') return estimateWidth;
  return (text, font) => {
    ctx.font = font;
    return ctx.measureText(text).width;
  };
}
