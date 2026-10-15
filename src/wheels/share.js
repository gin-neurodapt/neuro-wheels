// Sharing results through the device's own share sheet (email, WhatsApp,
// Messenger and whatever else is installed). The site itself sends nothing:
// the person picks the app and who it goes to. The button and the "share your
// other wheels too?" question are in src/components/ShareResults.jsx.

import { WHEELS } from './config.js';
import { toPercent } from './scores.js';
import { SITE_URL, pageFor } from './pages.js';

// What this browser can share: a picture ('files'), only words ('text'), or
// nothing ('none'). Asking with a tiny PNG is the only reliable test: some
// browsers have navigator.share but refuse files.
export function shareSupport(nav, FileCtor = typeof File === 'undefined' ? undefined : File) {
  if (!nav || typeof nav.share !== 'function') return 'none';
  try {
    if (FileCtor && typeof nav.canShare === 'function') {
      const probe = new FileCtor([new Uint8Array(1)], 'wheel.png', { type: 'image/png' });
      if (nav.canShare({ files: [probe] })) return 'files';
    }
  } catch {
    // Treated as "no pictures"; words may still work.
  }
  return 'text';
}

export function hasResults(levels) {
  return Array.isArray(levels) && levels.some(Boolean);
}

// The wheels, other than the open one, that have scores, in the picker's order.
export function otherResults(activeId, scores, wheels = WHEELS) {
  return wheels.filter((w) => w.id !== activeId && hasResults(scores[w.id]));
}

function joinTitles(titles) {
  if (titles.length < 2) return titles.join('');
  return `${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}`;
}

function linkFor(wheels) {
  return wheels.length === 1 ? SITE_URL + pageFor(wheels[0].id).path : `${SITE_URL}/`;
}

// "My Wheel of Life", "My Wheel of Life and Wheel of Business".
export function shareTitle(wheels) {
  return `My ${joinTitles(wheels.map((w) => w.title))}`;
}

// The pictures, with a line and the wheel's address (email uses the title as
// its subject and the text as the message; chat apps use the text as the
// caption, or leave it off).
export function pictureShare(wheels, files) {
  const title = shareTitle(wheels);
  return { title, text: `${title}, made with NeuroDapt Wheels: ${linkFor(wheels)}`, files };
}

// For a browser that cannot share pictures: the same results in words. Each
// area and its score, as on the page. Never an average.
export function wordsShare(wheels, scores) {
  const title = shareTitle(wheels);
  const blocks = wheels.map((w) =>
    [w.title, ...w.slices.map((s, i) => `${s.name}: ${toPercent(scores[w.id][i])}%`)].join('\n'),
  );
  return { title, text: `${blocks.join('\n\n')}\n\nMade with NeuroDapt Wheels: ${linkFor(wheels)}` };
}

// A picture is reused only while it still shows exactly this: the same scores,
// image name and day (the date is printed on it).
export function snapshotKey(wheel, levels, label, date = new Date()) {
  return [wheel.id, levels.join(','), label, date.toDateString()].join('|');
}
