// Draws a clean, fixed-layout image of a wheel (1600 × 2000 PNG, portrait 4:5)
// for downloading or sharing. It is drawn from the same geometry as the page,
// so it looks the same whatever device it was made on.

import { LEVELS } from './config.js';
import { segmentPath, layoutLabels, valueFont, nameFont, FONT_FAMILY } from './geometry.js';
import { ICON_PATHS, ICON_GRID } from './icons.generated.js';
import { toPercent, averagePercent } from './scores.js';
import { displayLabel } from './filename.js';

const WIDTH = 1600;
const HEIGHT = 2000;
const SERIF = '"EB Garamond", Georgia, "Times New Roman", serif';
const TEXT = '#33393c';
const MUTED = '#6b7378';

const FONTS_USED = [
  `400 104px ${SERIF}`,
  valueFont(50),
  nameFont(31),
  `400 40px ${FONT_FAMILY}`,
];

export async function ensureFonts() {
  if (!document.fonts?.load) return;
  try {
    await Promise.all(FONTS_USED.map((f) => document.fonts.load(f)));
  } catch {
    // Drawing still works with the fallback fonts.
  }
}

const logoCache = new Map();

export function loadImage(url) {
  if (!logoCache.has(url)) {
    logoCache.set(
      url,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          logoCache.delete(url);
          reject(new Error('image failed to load'));
        };
        img.src = url;
      }),
    );
  }
  return logoCache.get(url);
}

function drawIcon(ctx, name, x, y, size, colour) {
  const d = ICON_PATHS[name];
  if (!d) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / ICON_GRID, size / ICON_GRID);
  ctx.fillStyle = colour;
  ctx.fill(new Path2D(d));
  ctx.restore();
}

const ALIGN = { start: 'left', end: 'right', middle: 'center' };

function drawWheel(ctx, wheel, levels, area) {
  const measure = (text, font) => {
    ctx.font = font;
    return ctx.measureText(text).width;
  };
  const { labels, halfW, halfH } = layoutLabels(wheel.slices, 'full', measure);
  const scale = Math.min(area.w / (2 * halfW), area.h / (2 * halfH));
  const count = wheel.slices.length;

  ctx.save();
  ctx.translate(area.x + area.w / 2, area.y + area.h / 2);
  ctx.scale(scale, scale);

  ctx.lineWidth = 2 / scale;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = wheel.stroke;
  for (let i = 0; i < count; i++) {
    for (let level = 1; level <= LEVELS; level++) {
      const path = new Path2D(segmentPath(i, level, count));
      ctx.fillStyle = level <= levels[i] ? wheel.fill : '#ffffff';
      ctx.fill(path);
      ctx.stroke(path);
    }
  }

  labels.forEach((label, i) => {
    const slice = wheel.slices[i];
    drawIcon(ctx, slice.icon, label.icon.x, label.icon.y, label.icon.size, wheel.ink);
    ctx.textAlign = ALIGN[label.anchor];
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = wheel.ink;
    ctx.font = valueFont(label.value.size);
    ctx.fillText(`${toPercent(levels[i])}%`, label.value.x, label.value.y);
    ctx.fillStyle = TEXT;
    for (const line of label.name) {
      ctx.font = nameFont(line.size);
      ctx.fillText(line.text, line.x, line.y);
    }
  });
  ctx.restore();
}

function drawSummary(ctx, wheel, levels, top) {
  const left = 120;
  const colW = (WIDTH - 2 * left - 80) / 2;
  const rowH = 68;
  const half = Math.ceil(wheel.slices.length / 2);

  ctx.textBaseline = 'middle';
  wheel.slices.forEach((slice, i) => {
    const col = i < half ? 0 : 1;
    const row = i < half ? i : i - half;
    const x = left + col * (colW + 80);
    const y = top + row * rowH;
    drawIcon(ctx, slice.icon, x, y - 20, 40, wheel.ink);
    ctx.textAlign = 'left';
    ctx.fillStyle = TEXT;
    ctx.font = nameFont(36);
    ctx.fillText(slice.name, x + 58, y + 2, colW - 58 - 110);
    ctx.textAlign = 'right';
    ctx.fillStyle = wheel.ink;
    ctx.font = valueFont(36);
    ctx.fillText(`${toPercent(levels[i])}%`, x + colW, y + 2);
    ctx.strokeStyle = '#e3e9eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + rowH / 2);
    ctx.lineTo(x + colW, y + rowH / 2);
    ctx.stroke();
  });
}

export function formatDate(date) {
  try {
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return date.toDateString();
  }
}

export async function renderWheelImage({ wheel, levels, label, date = new Date(), logoUrl }) {
  await ensureFonts();
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot draw images.');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (logoUrl) {
    try {
      const logo = await loadImage(logoUrl);
      const h = 120;
      const w = (logo.naturalWidth / logo.naturalHeight || 115 / 79) * h;
      ctx.drawImage(logo, (WIDTH - w) / 2, 70, w, h);
    } catch {
      // The image is still useful without the logo.
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = TEXT;
  ctx.font = `400 104px ${SERIF}`;
  ctx.fillText(wheel.title, WIDTH / 2, 320, WIDTH - 160);

  const subtitle = [displayLabel(label), formatDate(date)].filter(Boolean).join('   ·   ');
  ctx.fillStyle = MUTED;
  ctx.font = `400 40px ${FONT_FAMILY}`;
  ctx.fillText(subtitle, WIDTH / 2, 388, WIDTH - 160);

  drawWheel(ctx, wheel, levels, { x: 80, y: 430, w: WIDTH - 160, h: 1030 });

  ctx.textAlign = 'center';
  ctx.fillStyle = TEXT;
  ctx.font = `400 42px ${FONT_FAMILY}`;
  const avgLabel = 'Average  ';
  const avgValue = `${averagePercent(levels)}%`;
  const labelW = ctx.measureText(avgLabel).width;
  ctx.font = valueFont(46);
  const valueW = ctx.measureText(avgValue).width;
  const startX = (WIDTH - labelW - valueW) / 2;
  ctx.textAlign = 'left';
  ctx.font = `400 42px ${FONT_FAMILY}`;
  ctx.fillText(avgLabel, startX, 1545);
  ctx.fillStyle = wheel.ink;
  ctx.font = valueFont(46);
  ctx.fillText(avgValue, startX + labelW, 1545);

  drawSummary(ctx, wheel, levels, 1620);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = MUTED;
  ctx.font = `400 32px ${FONT_FAMILY}`;
  ctx.fillText('neurodapt.au', WIDTH / 2, 1955);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The image could not be created.'))), 'image/png');
  });
}

// Phones get the share sheet (so the image can go straight to Photos or a
// message); everything else, or a phone where sharing fails, downloads it.
export async function deliverImage(blob, fileName) {
  const file = typeof File === 'function' ? new File([blob], fileName, { type: 'image/png' }) : null;
  const touch = window.matchMedia?.('(pointer: coarse)').matches;
  if (touch && file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
      // Otherwise fall through and download it instead.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'downloaded';
}
