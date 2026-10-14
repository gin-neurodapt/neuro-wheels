import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8'));

const publicFile = (urlPath) => path.join(root, 'public', urlPath);
const meta = (key) => html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1];

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

  it('has the link-preview picture, at a full address and the size the page declares', () => {
    const image = meta('og:image');
    // Apps that build link previews need the full address, not /og-image.png.
    expect(image).toMatch(/^https:\/\//);
    expect(new URL(image).origin).toBe(new URL(meta('og:url')).origin);
    const declared = [Number(meta('og:image:width')), Number(meta('og:image:height'))];
    expect(pngSize(publicFile(new URL(image).pathname))).toEqual(declared);
  });
});
