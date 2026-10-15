// Builds each wheel's page ahead of time, after `vite build` (client) and
// `vite build --ssr` (dist-ssr/). Every page gets its own title, description,
// link-preview tags and schema.org data, and its full content in the HTML, so
// search engines and AI assistants can read it without running any code.
// Also writes 404.html, sitemap.xml and llms.txt. Run by `npm run build`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');

const { renderWheelPage, renderNotFound, ALL_PAGES, seo } = await import(
  pathToFileURL(path.join(ssrDir, 'entry-server.js')).href
);

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const HEAD = /<!-- page-head -->[\s\S]*?<!-- \/page-head -->/;
const ROOT = '<div id="root"></div>';
if (!HEAD.test(template) || !template.includes(ROOT)) {
  throw new Error('dist/index.html has lost its page-head markers or its empty <div id="root">');
}

// A function as the replacement, so a "$" in the text is never read as a
// pattern.
const fillPage = (head, body) =>
  template.replace(HEAD, () => head).replace(ROOT, () => `<div id="root">${seo.stripStyleAttributes(body)}</div>`);

const date = new Date().toISOString().slice(0, 10);
const written = [];
function write(file, text) {
  fs.writeFileSync(path.join(dist, file), text);
  written.push(file);
}

for (const page of ALL_PAGES) {
  // "/" is index.html; "/wheel-of-business" is wheel-of-business.html, which
  // Cloudflare Pages serves at that address.
  const file = page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`;
  write(file, fillPage(seo.headTags(page, date), renderWheelPage(page.id)));
}

// Not found: no app code, so it stays a plain page of links.
write(
  '404.html',
  fillPage(seo.notFoundHeadTags(), renderNotFound())
    .replace(/\s*<script type="module"[^>]*><\/script>/g, '')
    .replace(/\s*<link rel="modulepreload"[^>]*>/g, ''),
);
write('sitemap.xml', seo.sitemapXml(date));
write('llms.txt', seo.llmsTxt());

fs.rmSync(ssrDir, { recursive: true, force: true });
console.log(`prerendered: ${written.join(', ')}`);
