import { describe, expect, it } from 'vitest';
import { WHEELS, UI_ICONS, LEVELS } from '../src/wheels/config.js';
import { ICON_PATHS } from '../src/wheels/icons.generated.js';
import { tapLevel, stepLevel, toPercent, averagePercent } from '../src/wheels/scores.js';
import { segmentPath, splitName, layoutLabels, polar, WHEEL_RADIUS } from '../src/wheels/geometry.js';
import { parseState, loadState, saveState, STORAGE_KEY, wheelFromHash } from '../src/wheels/storage.js';
import { cleanLabel, imageFileName, LABEL_MAX } from '../src/wheels/filename.js';

describe('config', () => {
  it('has an icon drawing for every icon it names (run `npm run icons` if this fails)', () => {
    const names = [...WHEELS.flatMap((w) => w.slices.map((s) => s.icon)), ...UI_ICONS];
    const missing = names.filter((n) => !ICON_PATHS[n]);
    expect(missing).toEqual([]);
  });

  it('gives every wheel a unique id and unique area names', () => {
    expect(new Set(WHEELS.map((w) => w.id)).size).toBe(WHEELS.length);
    for (const w of WHEELS) {
      expect(new Set(w.slices.map((s) => s.name)).size).toBe(w.slices.length);
    }
  });

  it('keeps every text colour readable on white (WCAG AA, 4.5:1)', () => {
    const lum = (hex) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };
    for (const w of WHEELS) {
      const ratio = 1.05 / (lum(w.ink) + 0.05);
      expect(ratio, `${w.id} ink ${w.ink}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('scoring', () => {
  it('sets the score to the ring that was tapped', () => {
    expect(tapLevel(0, 3)).toBe(3);
    expect(tapLevel(4, 2)).toBe(2);
    expect(tapLevel(1, 5)).toBe(5);
  });

  it('clears the area when the current ring is tapped again', () => {
    expect(tapLevel(3, 3)).toBe(0);
  });

  it('steps within 0 to 5', () => {
    expect(stepLevel(0, -1)).toBe(0);
    expect(stepLevel(LEVELS, 1)).toBe(LEVELS);
    expect(stepLevel(2, 1)).toBe(3);
  });

  it('shows 20% per ring and averages over every area', () => {
    expect([0, 1, 2, 3, 4, 5].map(toPercent)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(averagePercent([5, 5, 0, 0, 0, 0, 0, 0])).toBe(25);
    expect(averagePercent([3, 3, 3, 3, 3, 3, 3, 4])).toBe(63);
  });
});

describe('geometry', () => {
  it('draws the innermost ring as a wedge from the centre and the others as bands', () => {
    expect(segmentPath(0, 1, 8)).toMatch(/^M0 0L/);
    const band = segmentPath(0, 3, 8);
    expect(band.match(/A/g)).toHaveLength(2);
    expect(band.endsWith('Z')).toBe(true);
  });

  it('starts slice 0 at 12 o’clock and goes clockwise', () => {
    expect(polar(100, 0)).toEqual([0, -100]);
    expect(polar(100, 90)).toEqual([100, 0]);
    // Slice 0's outer edge starts straight up at the rim.
    expect(segmentPath(0, 5, 8).startsWith(`M0 -${WHEEL_RADIUS}`)).toBe(true);
  });

  it('wraps names without leaving "&" at the end of a line', () => {
    expect(splitName('Health & Fitness')).toEqual(['Health', '& Fitness']);
    expect(splitName('Social Life & Fun')).toEqual(['Social Life', '& Fun']);
    expect(splitName('Shared Responsibilities')).toEqual(['Shared', 'Responsibilities']);
    expect(splitName('Profit Margin')).toEqual(['Profit Margin']);
    expect(splitName('Love')).toEqual(['Love']);
  });

  it('keeps every label outside the wheel and inside the drawing, for every wheel and style', () => {
    for (const wheel of WHEELS) {
      for (const mode of ['full', 'compact']) {
        const { labels, halfW, halfH } = layoutLabels(wheel.slices, mode);
        for (const { box } of labels) {
          expect(box.left).toBeGreaterThanOrEqual(-halfW);
          expect(box.right).toBeLessThanOrEqual(halfW);
          expect(box.top).toBeGreaterThanOrEqual(-halfH);
          expect(box.bottom).toBeLessThanOrEqual(halfH);
          // The point of the box nearest the centre must be beyond the rim.
          const nx = Math.max(box.left, Math.min(0, box.right));
          const ny = Math.max(box.top, Math.min(0, box.bottom));
          expect(Math.hypot(nx, ny), `${wheel.id} ${mode}`).toBeGreaterThan(WHEEL_RADIUS);
        }
      }
    }
  });

  it('keeps labels from overlapping each other', () => {
    for (const wheel of WHEELS) {
      for (const mode of ['full', 'compact']) {
        const { labels } = layoutLabels(wheel.slices, mode);
        for (let a = 0; a < labels.length; a++) {
          for (let b = a + 1; b < labels.length; b++) {
            const A = labels[a].box;
            const B = labels[b].box;
            const overlap = A.left < B.right && B.left < A.right && A.top < B.bottom && B.top < A.bottom;
            expect(overlap, `${wheel.id} ${mode} labels ${a} and ${b}`).toBe(false);
          }
        }
      }
    }
  });

  it('does not move the wheel when a score changes (layout ignores scores)', () => {
    const a = layoutLabels(WHEELS[0].slices, 'full');
    const b = layoutLabels(WHEELS[0].slices, 'full');
    expect(a).toEqual(b);
  });
});

describe('saved scores', () => {
  const life = WHEELS[0];

  it('restores valid saved scores', () => {
    const raw = JSON.stringify({ active: 'business', scores: { life: [1, 2, 3, 4, 5, 0, 1, 2] }, label: 'Week 5' });
    const s = parseState(raw);
    expect(s.active).toBe('business');
    expect(s.scores.life).toEqual([1, 2, 3, 4, 5, 0, 1, 2]);
    expect(s.scores.relationships).toEqual(new Array(8).fill(0));
    expect(s.label).toBe('Week 5');
  });

  it('ignores anything malformed instead of breaking the page', () => {
    for (const raw of [
      'not json',
      'null',
      '[]',
      JSON.stringify({ active: '__proto__', scores: { life: [9, 9, 9, 9, 9, 9, 9, 9] } }),
      JSON.stringify({ scores: { life: [1, 2, 3] } }),
      JSON.stringify({ scores: { life: ['1', 2, 3, 4, 5, 0, 1, 2] } }),
      JSON.stringify({ scores: { life: [1.5, 2, 3, 4, 5, 0, 1, 2] } }),
      JSON.stringify({ label: 42 }),
    ]) {
      const s = parseState(raw);
      expect(s.active).toBe('life');
      expect(s.scores.life).toEqual(new Array(life.slices.length).fill(0));
      expect(s.label).toBe('');
    }
  });

  it('survives storage that throws (private browsing, blocked storage)', () => {
    const broken = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    };
    expect(loadState(broken).active).toBe('life');
    expect(() => saveState(broken, loadState(broken))).not.toThrow();
  });

  it('round-trips through storage', () => {
    const mem = new Map();
    const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
    const state = loadState(storage);
    state.scores.business[3] = 4;
    state.active = 'business';
    saveState(storage, state);
    expect(mem.has(STORAGE_KEY)).toBe(true);
    expect(loadState(storage)).toEqual(state);
  });

  it('opens a wheel from the address only when it is a real wheel', () => {
    expect(wheelFromHash('#business')).toBe('business');
    expect(wheelFromHash('#/Relationships')).toBe('relationships');
    expect(wheelFromHash('#nope')).toBe(null);
    expect(wheelFromHash('')).toBe(null);
  });
});

describe('image file name', () => {
  it('names the image after the wheel and the optional label', () => {
    expect(imageFileName('Wheel of Life', '')).toBe('NeuroDapt - Wheel of Life.png');
    expect(imageFileName('Wheel of Life', 'week 5')).toBe('NeuroDapt - Wheel of Life - Week 5.png');
  });

  it('removes characters that are not allowed in file names', () => {
    expect(imageFileName('Wheel of Life', '../../etc/passwd')).toBe('NeuroDapt - Wheel of Life - Etc Passwd.png');
    expect(cleanLabel('a<b>c:d"e|f?g*h\\i\u0000j')).toBe('a b c d e f g h i j');
    expect(cleanLabel('x'.repeat(100))).toHaveLength(LABEL_MAX);
  });
});
