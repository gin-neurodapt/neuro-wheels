// Wheel geometry and label layout, in "wheel units": the wheel is a circle of
// radius 500 centred on (0, 0). Nothing here knows about screens or pixels —
// the on-screen SVG and the downloadable image both draw from these numbers
// and simply scale them, which is what keeps the page correct on every phone.
//
// Angles are degrees measured CLOCKWISE from 12 o'clock; slice 0 starts at
// 12 o'clock, matching the original design.

import { LEVELS } from './config.js';

export const WHEEL_RADIUS = 500;

const DEG = Math.PI / 180;
// (+ 0 turns -0 into 0)
const r2 = (n) => Math.round(n * 100) / 100 + 0;

export function polar(radius, angleDeg) {
  const a = angleDeg * DEG;
  return [r2(radius * Math.sin(a)), r2(-radius * Math.cos(a))];
}

export function sliceAngles(index, count) {
  const step = 360 / count;
  return { start: index * step, end: (index + 1) * step, mid: (index + 0.5) * step };
}

// One ring segment of one slice, as an SVG path. Level 1 is the innermost
// ring (a pie wedge), level LEVELS the outermost.
export function segmentPath(sliceIndex, level, sliceCount, levels = LEVELS, radius = WHEEL_RADIUS) {
  const { start, end } = sliceAngles(sliceIndex, sliceCount);
  const ring = radius / levels;
  const outer = r2(ring * level);
  const inner = r2(ring * (level - 1));
  const large = end - start > 180 ? 1 : 0;
  const [ox0, oy0] = polar(outer, start);
  const [ox1, oy1] = polar(outer, end);
  if (inner === 0) {
    return `M0 0L${ox0} ${oy0}A${outer} ${outer} 0 ${large} 1 ${ox1} ${oy1}Z`;
  }
  const [ix1, iy1] = polar(inner, end);
  const [ix0, iy0] = polar(inner, start);
  return `M${ox0} ${oy0}A${outer} ${outer} 0 ${large} 1 ${ox1} ${oy1}L${ix1} ${iy1}A${inner} ${inner} 0 ${large} 0 ${ix0} ${iy0}Z`;
}

// The outer edge of a slice's score: a darker arc at the scored ring, so the
// shape of the wheel reads clearly even where the fill colour is pale.
export function scoreArcPath(sliceIndex, level, sliceCount, levels = LEVELS, radius = WHEEL_RADIUS) {
  if (level <= 0) return null;
  const { start, end } = sliceAngles(sliceIndex, sliceCount);
  const r = r2((radius / levels) * level);
  const [x0, y0] = polar(r, start);
  const [x1, y1] = polar(r, end);
  return `M${x0} ${y0}A${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

// ── Labels ──────────────────────────────────────────────────────────────────
// Three label styles, the largest that reads well in the space:
//   full    — icon + percentage, with the area's name underneath (wide screens
//             and the downloaded image)
//   compact — icon above the percentage only (phones; the names are listed
//             under the wheel instead)
//   icons   — the icon alone (a phone whose wheel is kept small so the whole
//             list fits under it; the percentages are right there in the list)

export const LABEL_STYLES = {
  full: { gap: 46, icon: 60, iconGap: 14, value: 50, name: 31, leading: 37, rowToName: 10 },
  compact: { gap: 22, icon: 62, iconGap: 6, value: 54 },
  icons: { gap: 20, icon: 84 },
};

// The widest a percentage can be. Space is always reserved for it, so the
// wheel never shifts when a score changes.
export const WIDEST_VALUE = '100%';

export const FONT_FAMILY = 'Tajawal, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
export const valueFont = (size) => `700 ${size}px ${FONT_FAMILY}`;
export const nameFont = (size) => `500 ${size}px ${FONT_FAMILY}`;

// A rough width when real text measurement is unavailable (tests, very old
// browsers). Deliberately generous so labels never get clipped.
export function estimateWidth(text, font) {
  const size = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] || 16);
  return text.length * size * 0.56;
}

// Splits an area name into lines of about `maxChars`, never leaving "&" or
// "and" dangling at the end of a line ("Health & Fitness" → "Health",
// "& Fitness").
export function splitName(name, maxChars = 13) {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = [];
  for (const word of words) {
    const next = [...line, word].join(' ');
    if (line.length && next.length > maxChars) {
      lines.push(line);
      line = [word];
    } else {
      line.push(word);
    }
  }
  if (line.length) lines.push(line);
  for (let i = 0; i < lines.length - 1; i++) {
    const last = lines[i][lines[i].length - 1];
    if ((last === '&' || last.toLowerCase() === 'and') && lines[i].length > 1) {
      lines[i].pop();
      lines[i + 1].unshift(last);
    }
  }
  return lines.map((l) => l.join(' '));
}

// Lays out every slice's label around the wheel and returns the half-width
// and half-height the drawing needs (the wheel is centred, so the area is
// symmetric). `measure(text, font)` returns a text width in wheel units.
export function layoutLabels(slices, mode, measure = estimateWidth) {
  const s = LABEL_STYLES[mode] || LABEL_STYLES.full;
  const count = slices.length;
  const valueWidth = measure(WIDEST_VALUE, valueFont(s.value));
  let halfW = WHEEL_RADIUS;
  let halfH = WHEEL_RADIUS;

  const labels = slices.map((slice, i) => {
    const { mid } = sliceAngles(i, count);
    const sin = Math.sin(mid * DEG);
    const cos = Math.cos(mid * DEG);
    let box;
    let label;

    if (mode === 'icons') {
      const w = s.icon;
      const reach = (w / 2) * (Math.abs(sin) + Math.abs(cos));
      const [px, py] = polar(WHEEL_RADIUS + s.gap + reach, mid);
      box = { left: px - w / 2, right: px + w / 2, top: py - w / 2, bottom: py + w / 2 };
      label = { anchor: 'middle', icon: { x: box.left, y: box.top, size: s.icon }, value: null, name: [] };
    } else if (mode === 'compact') {
      const w = Math.max(s.icon, valueWidth);
      // Room below the figures for the font's descent, so nothing is cut off.
      const h = s.icon + s.iconGap + s.value * 0.74 + s.value * 0.22;
      // Push the label out far enough that its nearest corner clears the rim.
      const reach = (w / 2) * Math.abs(sin) + (h / 2) * Math.abs(cos);
      const [px, py] = polar(WHEEL_RADIUS + s.gap + reach, mid);
      const top = py - h / 2;
      box = { left: px - w / 2, right: px + w / 2, top, bottom: top + h };
      label = {
        anchor: 'middle',
        icon: { x: px - s.icon / 2, y: top, size: s.icon },
        value: { x: px, y: top + s.icon + s.iconGap + s.value * 0.74, size: s.value },
        name: [],
      };
    } else {
      const right = sin >= 0;
      const upper = cos > 0;
      const lines = splitName(slice.name);
      const nameW = Math.max(0, ...lines.map((t) => measure(t, nameFont(s.name))));
      const rowW = s.icon + s.iconGap + valueWidth;
      const w = Math.max(rowW, nameW);
      const firstBaseline = s.icon + s.rowToName + s.name * 0.78;
      const h = firstBaseline + (lines.length - 1) * s.leading + s.name * 0.26;
      const [px, py] = polar(WHEEL_RADIUS + s.gap, mid);
      const top = upper ? py - h : py;
      const sign = right ? 1 : -1;
      box = right ? { left: px, right: px + w, top, bottom: top + h } : { left: px - w, right: px, top, bottom: top + h };
      label = {
        anchor: right ? 'start' : 'end',
        icon: { x: right ? px : px - s.icon, y: top, size: s.icon },
        value: { x: px + sign * (s.icon + s.iconGap), y: top + s.icon * 0.5 + s.value * 0.36, size: s.value },
        name: lines.map((text, k) => ({ text, x: px, y: top + firstBaseline + k * s.leading, size: s.name })),
      };
    }

    halfW = Math.max(halfW, Math.abs(box.left), Math.abs(box.right));
    halfH = Math.max(halfH, Math.abs(box.top), Math.abs(box.bottom));
    return { ...label, box };
  });

  const pad = 10;
  return { labels, halfW: Math.ceil(halfW + pad), halfH: Math.ceil(halfH + pad) };
}

// Names are drawn around the wheel only if they would be at least this big
// on screen; otherwise the wheel shows icons and percentages, and the names
// are read from the list underneath.
export const MIN_NAME_PX = 12;

// Would the wheel WITH names fit at a readable size?
//   areaWidth    — the width of the wheel's column
//   heightBudget — the most height the wheel may take (Infinity if unlimited)
//   full         — layoutLabels(..., 'full')
export function namesFit({ areaWidth, heightBudget, full }) {
  return shownScale({ areaWidth, heightBudget, layout: full }) * LABEL_STYLES.full.name >= MIN_NAME_PX;
}

// Percentages are drawn on the wheel only if they would be at least this big.
export const MIN_VALUE_PX = 12;

// Screen pixels per wheel unit, for a layout drawn as big as the space allows.
function shownScale({ areaWidth, heightBudget, layout }) {
  const width = Math.min(areaWidth, heightBudget * (layout.halfW / layout.halfH));
  return width / (2 * layout.halfW);
}

// The richest label style that is still readable in the space.
export function labelMode({ areaWidth, heightBudget, full, compact }) {
  if (namesFit({ areaWidth, heightBudget, full })) return 'full';
  const valuePx = shownScale({ areaWidth, heightBudget, layout: compact }) * LABEL_STYLES.compact.value;
  return valuePx >= MIN_VALUE_PX ? 'compact' : 'icons';
}
