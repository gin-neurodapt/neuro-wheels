import { describe, expect, it } from 'vitest';
import { WHEELS, UI_ICONS, LEVELS } from '../src/wheels/config.js';
import { ICON_PATHS } from '../src/wheels/icons.generated.js';
import * as scores from '../src/wheels/scores.js';
import { fadeToWhite, innerLineColour, INNER_LINE_FADE } from '../src/wheels/colour.js';
import { placeCard } from '../src/components/AreaCard.jsx';

const { tapLevel, stepLevel, toPercent } = scores;
import {
  segmentPath,
  scoreArcPath,
  splitName,
  layoutLabels,
  namesFit,
  labelMode,
  MIN_VALUE_PX,
  polar,
  estimateWidth,
  valueFont,
  nameFont,
  WIDEST_VALUE,
  WHEEL_RADIUS,
  LABEL_STYLES,
  MIN_NAME_PX,
} from '../src/wheels/geometry.js';
import {
  parseState,
  loadState,
  saveState,
  STORAGE_KEY,
  ACTIVE_KEY,
  wheelFromHash,
} from '../src/wheels/storage.js';
import { cleanLabel, imageFileName, displayLabel, LABEL_MAX } from '../src/wheels/filename.js';

function memoryStorage() {
  const map = new Map();
  let writes = 0;
  return {
    map,
    get writes() {
      return writes;
    },
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      writes++;
      map.set(k, String(v));
    },
  };
}

// Relative luminance (WCAG).
function lum(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

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

  it('gives every area a description to read', () => {
    for (const w of WHEELS) {
      for (const s of w.slices) {
        expect(typeof s.about, `${w.id} ${s.name}`).toBe('string');
        // A sentence or two: long enough to help, short enough for the card.
        expect(s.about.length, `${w.id} ${s.name}`).toBeGreaterThan(30);
        expect(s.about.length, `${w.id} ${s.name}`).toBeLessThanOrEqual(140);
        expect(s.about, `${w.id} ${s.name}`).toMatch(/^[A-Z].*.$/);
      }
    }
  });

  it('keeps each wheel’s text colour (ink) readable on white (WCAG AA, 4.5:1)', () => {
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

  it('shows 20% per ring', () => {
    expect([0, 1, 2, 3, 4, 5].map(toPercent)).toEqual([0, 20, 40, 60, 80, 100]);
  });

  // The goal is an even wheel, not a full one, so no overall score is offered.
  it('has no average', () => {
    expect(Object.keys(scores).filter((k) => /aver|mean|total/i.test(k))).toEqual([]);
  });
});

describe('wheel lines', () => {
  it('fades a colour towards white', () => {
    expect(fadeToWhite('#177082', 0)).toBe('#177082');
    expect(fadeToWhite('#177082', 1)).toBe('#ffffff');
    expect(fadeToWhite('#000000', 0.5)).toBe('#808080');
  });

  it('draws the inner lines much lighter than the rim, but still visible on white', () => {
    expect(INNER_LINE_FADE).toBeGreaterThan(0.3);
    for (const w of WHEELS) {
      const inner = innerLineColour(w);
      expect(lum(inner), w.id).toBeGreaterThan(lum(w.stroke) * 2);
      expect(lum(inner), w.id).toBeLessThan(0.75);
    }
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
    expect(segmentPath(0, 5, 8).startsWith(`M0 -${WHEEL_RADIUS}`)).toBe(true);
  });

  it('marks a score with an arc at that ring, and nothing at 0', () => {
    expect(scoreArcPath(0, 0, 8)).toBe(null);
    expect(scoreArcPath(0, 3, 8)).toBe(`M0 -300A300 300 0 0 1 ${polar(300, 45).join(' ')}`);
  });

  it('wraps names without leaving "&" at the end of a line', () => {
    expect(splitName('Health & Fitness')).toEqual(['Health', '& Fitness']);
    expect(splitName('Social Life & Fun')).toEqual(['Social Life', '& Fun']);
    expect(splitName('Shared Responsibilities')).toEqual(['Shared', 'Responsibilities']);
    expect(splitName('Profit Margin')).toEqual(['Profit Margin']);
    expect(splitName('Love')).toEqual(['Love']);
  });

  // Where each part of a label is actually drawn, given its text anchor.
  function extentX(x, width, anchor) {
    if (anchor === 'start') return [x, x + width];
    if (anchor === 'end') return [x - width, x];
    return [x - width / 2, x + width / 2];
  }

  for (const mode of ['full', 'compact']) {
    it(`${mode} labels: icon, percentage and name are drawn inside the label, on the outward side, clear of the wheel`, () => {
      for (const wheel of WHEELS) {
        const { labels } = layoutLabels(wheel.slices, mode);
        labels.forEach((label, i) => {
          const where = `${wheel.id} ${mode} slice ${i}`;
          const { box } = label;
          const inBox = ([l, r], top, bottom, what) => {
            expect(l, `${where} ${what} left`).toBeGreaterThanOrEqual(box.left - 0.01);
            expect(r, `${where} ${what} right`).toBeLessThanOrEqual(box.right + 0.01);
            expect(top, `${where} ${what} top`).toBeGreaterThanOrEqual(box.top - 0.01);
            expect(bottom, `${where} ${what} bottom`).toBeLessThanOrEqual(box.bottom + 0.01);
          };
          const { icon, value } = label;
          inBox([icon.x, icon.x + icon.size], icon.y, icon.y + icon.size, 'icon');
          const valueW = estimateWidth(WIDEST_VALUE, valueFont(value.size));
          const valueX = extentX(value.x, valueW, label.anchor);
          inBox(valueX, value.y - value.size * 0.74, value.y, 'percentage');
          for (const line of label.name) {
            const w = estimateWidth(line.text, nameFont(line.size));
            inBox(extentX(line.x, w, label.anchor), line.y - line.size * 0.78, line.y, `name "${line.text}"`);
          }
          // The icon and the percentage must not sit on top of each other.
          const iconX = [icon.x, icon.x + icon.size];
          const iconY = [icon.y, icon.y + icon.size];
          const valueY = [value.y - value.size * 0.74, value.y];
          const overlapX = iconX[0] < valueX[1] && valueX[0] < iconX[1];
          const overlapY = iconY[0] < valueY[1] && valueY[0] < iconY[1];
          expect(overlapX && overlapY, `${where} icon over percentage`).toBe(false);
          // Labels sit on their slice's side of the wheel...
          const mid = ((i + 0.5) * 360) / wheel.slices.length;
          if (mid < 180) expect(box.left + box.right, `${where} side`).toBeGreaterThan(0);
          else expect(box.left + box.right, `${where} side`).toBeLessThan(0);
          // ...and their nearest point is beyond the rim.
          const nx = Math.max(box.left, Math.min(0, box.right));
          const ny = Math.max(box.top, Math.min(0, box.bottom));
          expect(Math.hypot(nx, ny), `${where} rim`).toBeGreaterThan(WHEEL_RADIUS);
        });
      }
    });

    it(`${mode} labels do not overlap each other`, () => {
      for (const wheel of WHEELS) {
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
    });
  }

  it('icon-only labels: the icon sits beyond the rim, on its slice’s side, clear of the others', () => {
    for (const wheel of WHEELS) {
      const { labels } = layoutLabels(wheel.slices, 'icons');
      labels.forEach((label, i) => {
        const { box, icon } = label;
        expect(label.value, `${wheel.id} ${i}`).toBe(null);
        expect(label.name).toEqual([]);
        expect([icon.x, icon.y, icon.x + icon.size, icon.y + icon.size]).toEqual([box.left, box.top, box.right, box.bottom]);
        const nx = Math.max(box.left, Math.min(0, box.right));
        const ny = Math.max(box.top, Math.min(0, box.bottom));
        expect(Math.hypot(nx, ny), `${wheel.id} ${i} rim`).toBeGreaterThan(WHEEL_RADIUS);
        const mid = ((i + 0.5) * 360) / wheel.slices.length;
        expect(Math.sign(box.left + box.right), `${wheel.id} ${i} side`).toBe(mid < 180 ? 1 : -1);
        for (const other of labels.slice(i + 1)) {
          const B = other.box;
          expect(box.left < B.right && B.left < box.right && box.top < B.bottom && B.top < box.bottom).toBe(false);
        }
      });
    }
  });

  it('picks the richest labels that stay readable: names, then percentages, then icons', () => {
    const full = layoutLabels(WHEELS[1].slices, 'full');
    const compact = layoutLabels(WHEELS[1].slices, 'compact');
    const mode = (areaWidth, heightBudget = Infinity) => labelMode({ areaWidth, heightBudget, full, compact });
    expect(mode(1200)).toBe('full');
    expect(mode(390)).toBe('compact');
    // The width at which the percentages come out at exactly MIN_VALUE_PX.
    const threshold = (MIN_VALUE_PX / LABEL_STYLES.compact.value) * 2 * compact.halfW;
    expect(mode(threshold + 1)).toBe('compact');
    expect(mode(threshold - 1)).toBe('icons');
    // A phone whose wheel is kept short so the list fits: icons only.
    expect(mode(390, 210)).toBe('icons');
  });

  it('shows names only when they would be at least 12px on screen', () => {
    const full = layoutLabels(WHEELS[0].slices, 'full');
    // The width at which names come out at exactly MIN_NAME_PX.
    const threshold = (MIN_NAME_PX / LABEL_STYLES.full.name) * 2 * full.halfW;
    expect(namesFit({ areaWidth: threshold + 1, heightBudget: Infinity, full })).toBe(true);
    expect(namesFit({ areaWidth: threshold - 1, heightBudget: Infinity, full })).toBe(false);
    expect(namesFit({ areaWidth: 1200, heightBudget: Infinity, full })).toBe(true);
    expect(namesFit({ areaWidth: 390, heightBudget: Infinity, full })).toBe(false);
  });

  it('counts the screen height too: a wide but short space gets no names', () => {
    const full = layoutLabels(WHEELS[0].slices, 'full');
    const heightAtThreshold = ((MIN_NAME_PX / LABEL_STYLES.full.name) * 2 * full.halfW * full.halfH) / full.halfW;
    expect(namesFit({ areaWidth: 1400, heightBudget: heightAtThreshold - 1, full })).toBe(false);
    expect(namesFit({ areaWidth: 1400, heightBudget: heightAtThreshold + 1, full })).toBe(true);
  });
});

describe('the description card (mouse)', () => {
  const viewport = { width: 1000, height: 800 };
  const card = { width: 300, height: 120 };

  it('goes under the thing pointed at, centred on it', () => {
    const anchor = { left: 400, right: 500, top: 100, bottom: 140 };
    expect(placeCard({ anchor, card, viewport })).toEqual({ left: 300, top: 148 });
  });

  it('goes above it when there is no room below', () => {
    const anchor = { left: 400, right: 500, top: 700, bottom: 740 };
    expect(placeCard({ anchor, card, viewport })).toEqual({ left: 300, top: 572 });
  });

  it('stays below when there is no room above either (it never goes off the top)', () => {
    const anchor = { left: 400, right: 500, top: 60, bottom: 740 };
    expect(placeCard({ anchor, card, viewport }).top).toBe(748);
  });

  it('is kept inside the window at either side', () => {
    expect(placeCard({ anchor: { left: 0, right: 40, top: 100, bottom: 140 }, card, viewport }).left).toBe(8);
    expect(placeCard({ anchor: { left: 960, right: 1000, top: 100, bottom: 140 }, card, viewport }).left).toBe(692);
  });
});

describe('saved scores', () => {
  const life = WHEELS[0];

  it('restores valid saved scores and the label', () => {
    const raw = JSON.stringify({ scores: { life: [1, 2, 3, 4, 5, 0, 1, 2] }, label: 'Week 5' });
    const s = parseState(raw);
    expect(s.scores.life).toEqual([1, 2, 3, 4, 5, 0, 1, 2]);
    expect(s.scores.relationships).toEqual(new Array(8).fill(0));
    expect(s.label).toBe('Week 5');
  });

  it('ignores anything malformed instead of breaking the page', () => {
    for (const raw of [
      'not json',
      'null',
      '[]',
      JSON.stringify({ scores: { life: [9, 9, 9, 9, 9, 9, 9, 9] } }),
      JSON.stringify({ scores: { life: [1, 2, 3] } }),
      JSON.stringify({ scores: { life: ['1', 2, 3, 4, 5, 0, 1, 2] } }),
      JSON.stringify({ scores: { life: [1.5, 2, 3, 4, 5, 0, 1, 2] } }),
      JSON.stringify({ scores: { __proto__: { life: [5, 5, 5, 5, 5, 5, 5, 5] } } }),
      JSON.stringify({ label: 42 }),
    ]) {
      const s = parseState(raw);
      expect(s.scores.life, raw).toEqual(new Array(life.slices.length).fill(0));
      expect(s.label).toBe('');
    }
  });

  it('remembers the open wheel separately, and ignores one that does not exist', () => {
    const storage = memoryStorage();
    storage.setItem(ACTIVE_KEY, 'business');
    expect(loadState(storage).active).toBe('business');
    storage.setItem(ACTIVE_KEY, '__proto__');
    expect(loadState(storage).active).toBe('life');
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
    const storage = memoryStorage();
    const state = loadState(storage);
    state.scores.business[3] = 4;
    state.active = 'business';
    state.label = 'Week 2';
    saveState(storage, state);
    expect(storage.map.has(STORAGE_KEY)).toBe(true);
    expect(loadState(storage)).toEqual(state);
  });

  it('does not rewrite storage when nothing changed (that would wake other tabs)', () => {
    const storage = memoryStorage();
    const state = loadState(storage);
    saveState(storage, state);
    const after = storage.writes;
    saveState(storage, { ...state, scores: { ...state.scores } });
    expect(storage.writes).toBe(after);
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
    expect(displayLabel('  week 5.  ')).toBe('Week 5');
  });

  it('removes characters that are not allowed in file names', () => {
    expect(imageFileName('Wheel of Life', '../../etc/passwd')).toBe('NeuroDapt - Wheel of Life - Etc Passwd.png');
    expect(cleanLabel('a<b>c:d"e|f?g*h\\i\u0000j')).toBe('a b c d e f g h i j');
    expect(cleanLabel('x'.repeat(100))).toHaveLength(LABEL_MAX);
  });
});
