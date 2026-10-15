import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WHEELS } from '../src/wheels/config.js';
import { wheelFromPath } from '../src/wheels/pages.js';
import { wheelFromHash } from '../src/wheels/storage.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8'));

const publicFile = (urlPath) => path.join(root, 'public', urlPath);
// The link-preview picture is tested with each page's head (seo.test.jsx).

function pngSize(file) {
  const b = fs.readFileSync(file);
  expect(b.subarray(1, 4).toString(), file).toBe('PNG');
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

describe('the files the page points to', () => {
  it('has every icon and file that index.html links to', () => {
    const hrefs = [...html.matchAll(/<link [^>]*href="(\/[^"]+)"/g)].map((m) => m[1]);
    expect(hrefs).toContain('/manifest.webmanifest');
    expect(hrefs).toContain('/apple-touch-icon.png');
    for (const href of hrefs) expect(fs.existsSync(publicFile(href)), href).toBe(true);
    expect(pngSize(publicFile('/apple-touch-icon.png'))).toEqual([180, 180]);
  });

  it('has every app icon the manifest lists, at the size it says', () => {
    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icon of manifest.icons) {
      const [w, h] = icon.sizes.split('x').map(Number);
      expect(pngSize(publicFile(icon.src)), icon.src).toEqual([w, h]);
    }
  });

});

describe('the app on a phone’s home screen', () => {
  const headers = fs.readFileSync(path.join(root, 'public/_headers'), 'utf8').replace(/\r\n/g, '\n');
  const rule = (pattern) => {
    const block = headers.split(/\n(?=\S)/).find((b) => b.split('\n')[0].trim() === pattern);
    expect(block, pattern).toBeTruthy();
    return block.split('\n').slice(1).map((l) => l.trim()).filter(Boolean);
  };
  const csp = (lines) => lines.find((l) => l.startsWith('Content-Security-Policy:'));

  it('opens full screen from the home page, with its own name and colours', () => {
    expect(manifest).toMatchObject({ id: '/', start_url: '/', scope: '/', display: 'standalone', lang: 'en-AU' });
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(html).toContain(`<meta name="apple-mobile-web-app-title" content="${manifest.short_name}" />`);
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
    expect(manifest.icons.some((i) => i.sizes === '512x512' && !i.purpose)).toBe(true);
  });

  it('offers each wheel from a long press on the app icon', () => {
    const opened = manifest.shortcuts.map((s) => {
      const url = new URL(s.url, 'https://wheels.neurodapt.au');
      return wheelFromHash(url.hash) || wheelFromPath(url.pathname);
    });
    expect(opened).toEqual(WHEELS.map((w) => w.id));
    expect(manifest.shortcuts.map((s) => s.name)).toEqual(WHEELS.map((w) => w.title));
    for (const s of manifest.shortcuts) for (const i of s.icons) expect(fs.existsSync(publicFile(i.src)), i.src).toBe(true);
  });

  it('shows a picture of each wheel in Android’s install sheet', () => {
    expect(manifest.screenshots.map((s) => s.src)).toEqual(WHEELS.map((w) => `/screenshots/${w.id}.png`));
    for (const shot of manifest.screenshots) {
      const [w, h] = shot.sizes.split('x').map(Number);
      expect(pngSize(publicFile(shot.src)), shot.src).toEqual([w, h]);
      // Chrome's limits: 320 to 3840 pixels a side, the long side at most 2.3 times the short.
      expect(Math.min(w, h)).toBeGreaterThanOrEqual(320);
      expect(Math.max(w, h)).toBeLessThanOrEqual(3840);
      expect(Math.max(w, h) / Math.min(w, h)).toBeLessThanOrEqual(2.3);
      expect(shot.form_factor).toBe('narrow');
      expect(shot.label.length).toBeGreaterThan(10);
    }
  });

  it('lets the offline helper fetch this site’s own files, and nothing else', () => {
    const sw = rule('/sw.js');
    // The page-wide policy is taken off first, or both would apply.
    expect(sw[0]).toBe('! Content-Security-Policy');
    expect(csp(sw)).toBe("Content-Security-Policy: default-src 'none'; connect-src 'self'");
  });

  it('still lets the pages connect nowhere, and run only this site’s helper', () => {
    const page = csp(rule('/*'));
    expect(page).toContain("connect-src 'none'");
    expect(page).toContain("worker-src 'self'");
    expect(page).not.toMatch(/unsafe-inline/);
  });
});
