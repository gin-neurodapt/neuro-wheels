// @vitest-environment node
// No browser here on purpose: the pages are built ahead of time in Node, so
// drawing them must not need window, document or storage.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WHEELS } from '../src/wheels/config.js';
import { ALL_PAGES, SITE_URL, pageFor, wheelFromPath } from '../src/wheels/pages.js';
import {
  headTags,
  structuredData,
  sitemapXml,
  llmsTxt,
  stripStyleAttributes,
  escapeHtml,
  OG_IMAGE,
} from '../src/wheels/seo.js';
import { wheelColoursCss } from '../src/wheels/colour.js';
import { renderWheelPage, renderNotFound } from '../src/entry-server.jsx';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATE = '2026-10-15';
const meta = (html, key) => html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1];
const ldOf = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const node = (ld, type) => ld['@graph'].find((n) => n['@type'] === type);
const unescape = (t) => t.replaceAll('&#x27;', "'").replaceAll('&#39;', "'").replaceAll('&amp;', '&').replaceAll('&quot;', '"');
const textOf = (html) => unescape(html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));

function pngSize(file) {
  const b = fs.readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

describe('each wheel’s own page', () => {
  it('has one page per wheel, each at its own address', () => {
    expect(ALL_PAGES.map((p) => p.id)).toEqual(WHEELS.map((w) => w.id));
    expect(new Set(ALL_PAGES.map((p) => p.path)).size).toBe(WHEELS.length);
    expect(pageFor('life').path).toBe('/');
    for (const p of ALL_PAGES) expect(p.url).toBe(SITE_URL + p.path);
  });

  it('has a title and description search engines will show whole', () => {
    for (const p of ALL_PAGES) {
      expect(p.title.startsWith(p.wheel.title), p.title).toBe(true);
      expect(p.title.length, p.title).toBeLessThanOrEqual(65);
      expect(p.description.length, p.description).toBeGreaterThanOrEqual(110);
      expect(p.description.length, p.description).toBeLessThanOrEqual(160);
    }
    expect(new Set(ALL_PAGES.map((p) => p.title)).size).toBe(ALL_PAGES.length);
    expect(new Set(ALL_PAGES.map((p) => p.description)).size).toBe(ALL_PAGES.length);
  });

  it('answers "what areas" from the wheel itself, so a renamed area is never stale', () => {
    for (const p of ALL_PAGES) {
      const answer = p.faq.find((f) => f.q === `What areas does the ${p.wheel.title} cover?`).a;
      for (const s of p.wheel.slices) expect(answer, s.name).toContain(s.name);
    }
  });

  it('never suggests aiming for 100% or an average', () => {
    for (const p of ALL_PAGES) {
      const words = [p.description, ...p.intro, ...p.steps, ...p.faq.flatMap((f) => [f.q, f.a])].join(' ');
      expect(words).not.toMatch(/average|overall score|total score/i);
      expect(words).toMatch(/even wheel, not a full one/);
    }
  });

  it('opens a wheel from its page address', () => {
    expect(wheelFromPath('/wheel-of-business')).toBe('business');
    expect(wheelFromPath('/wheel-of-relationships/')).toBe('relationships');
    expect(wheelFromPath('/Wheel-of-Life')).toBe('life');
    expect(wheelFromPath('/')).toBe(null);
    expect(wheelFromPath('/nope')).toBe(null);
  });
});

describe('what search engines and AI assistants read', () => {
  it('gives each page its own title, description, address and link preview', () => {
    for (const p of ALL_PAGES) {
      const head = headTags(p, DATE);
      expect(head).toContain(`<title>${escapeHtml(p.title)}</title>`);
      expect(head).toContain(`<link rel="canonical" href="${p.url}" />`);
      expect(unescape(meta(head, 'description'))).toBe(p.description);
      expect(meta(head, 'og:url')).toBe(p.url);
      expect(unescape(meta(head, 'og:title'))).toBe(p.title);
      expect(meta(head, 'robots')).toMatch(/^index, follow/);
    }
  });

  it('has the link-preview picture, at a full address and the size the page declares', () => {
    const head = headTags(pageFor('life'), DATE);
    const image = meta(head, 'og:image');
    // Apps that build link previews need the full address, not /og-image.png.
    expect(image).toMatch(/^https:\/\//);
    expect(new URL(image).origin).toBe(new URL(meta(head, 'og:url')).origin);
    const declared = [Number(meta(head, 'og:image:width')), Number(meta(head, 'og:image:height'))];
    expect(pngSize(path.join(root, 'public', new URL(image).pathname))).toEqual(declared);
    expect(declared).toEqual([OG_IMAGE.width, OG_IMAGE.height]);
  });

  it('describes each page as a free web app with the same questions the page shows', () => {
    for (const p of ALL_PAGES) {
      const ld = ldOf(headTags(p, DATE));
      expect(ld['@context']).toBe('https://schema.org');
      const app = node(ld, 'WebApplication');
      expect(app.name).toBe(p.wheel.title);
      expect(app.url).toBe(p.url);
      expect(app.isAccessibleForFree).toBe(true);
      expect(app.offers.price).toBe('0');
      const faq = node(ld, 'FAQPage').mainEntity.map((q) => [q.name, q.acceptedAnswer.text]);
      expect(faq).toEqual(p.faq.map((f) => [f.q, f.a]));
      const shown = textOf(renderWheelPage(p.id));
      for (const [q, a] of faq) {
        expect(shown, q).toContain(q);
        expect(shown, a).toContain(a);
      }
      expect(node(ld, 'Person').name).toBe('Gin Maher');
      expect(node(ld, 'WebPage').dateModified).toBe(DATE);
    }
  });

  it('cannot be broken out of by its own text', () => {
    const page = { ...pageFor('life'), title: 'A "quoted" <b>title</b>', faq: [{ q: '</script><script>alert(1)</script>', a: 'x' }] };
    const head = headTags(page, DATE);
    expect(head).toContain('<title>A &quot;quoted&quot; &lt;b&gt;title&lt;/b&gt;</title>');
    expect(head.match(/<\/script>/g)).toHaveLength(1);
    expect(node(ldOf(head), 'FAQPage').mainEntity[0].name).toBe('</script><script>alert(1)</script>');
  });

  it('lists every page in the sitemap, which robots.txt points to', () => {
    const xml = sitemapXml(DATE);
    for (const p of ALL_PAGES) expect(xml.split(`<loc>${p.url}</loc>`)).toHaveLength(2);
    expect(xml.match(/<url>/g)).toHaveLength(ALL_PAGES.length);
    const robots = fs.readFileSync(path.join(root, 'public/robots.txt'), 'utf8');
    expect(robots).toMatch(/^Allow: \/$/m);
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });

  it('sums the site up for AI assistants in llms.txt', () => {
    const text = llmsTxt();
    for (const p of ALL_PAGES) {
      expect(text).toContain(`](${p.url})`);
      for (const s of p.wheel.slices) expect(text).toContain(`- ${s.name}: ${s.about}`);
    }
  });

  it('sends the short and old addresses to real pages', () => {
    const rules = fs
      .readFileSync(path.join(root, 'public/_redirects'), 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.startsWith('#'))
      .map((l) => l.trim().split(/\s+/));
    expect(rules.length).toBeGreaterThan(0);
    const paths = ALL_PAGES.map((p) => p.path);
    for (const [from, to, status] of rules) {
      expect(paths, from).toContain(to);
      expect(paths, from).not.toContain(from);
      expect(status).toBe('301');
    }
  });
});

describe('the pages built ahead of time', () => {
  it('draws each page in full without a browser: title, every area and its description', () => {
    for (const p of ALL_PAGES) {
      const html = renderWheelPage(p.id);
      expect(html).toMatch(new RegExp(`<h1 class="site-title">${p.wheel.title}</h1>`));
      const text = textOf(html);
      for (const s of p.wheel.slices) {
        expect(text, s.name).toContain(s.name);
        expect(text, s.about).toContain(s.about);
      }
      expect(html).toContain(`data-wheel="${p.id}"`);
    }
  });

  it('leaves no inline style in the built pages (the security policy forbids it)', () => {
    const html = stripStyleAttributes(renderWheelPage('business'));
    expect(html).not.toMatch(/ style="/);
    expect(stripStyleAttributes('<div style="--a:1" class="x">')).toBe('<div class="x">');
  });

  it('draws the page not found with links to every wheel', () => {
    const html = renderNotFound();
    expect(html).toContain('Page not found');
    for (const p of ALL_PAGES) expect(html).toContain(`href="${p.path}"`);
  });

  it('colours every wheel from its config, through a stylesheet', () => {
    const css = wheelColoursCss(WHEELS);
    for (const w of WHEELS) {
      expect(css).toContain(`.page[data-wheel="${w.id}"] { --accent: ${w.ink}; --accent-fill: ${w.fill};`);
      expect(css).toContain(`.picker [data-tab="${w.id}"] { --tab-ink: ${w.ink}; }`);
    }
  });
});
