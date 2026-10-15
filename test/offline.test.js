// @vitest-environment node
// The offline helper (sw.js) as the build writes it, run against a pretend
// browser: its own caches, a network that can be cut off, and the events a
// browser sends it.
import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { filesIn, pagesIn, swSource } from '../scripts/build-sw.mjs';
import { ALL_PAGES } from '../src/wheels/pages.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://wheels.neurodapt.au';
const worker = fs.readFileSync(path.join(root, 'src/sw/worker.js'), 'utf8');
const PAGES = ['/', '/wheel-of-business', '/wheel-of-relationships'];
const FILES = ['/assets/index-abc.js', '/assets/index-abc.css', '/favicon.svg'];

const html = (text) => new Response(text, { headers: { 'content-type': 'text/html' } });
// What fetch() gives for this site's own files: a "basic" response.
const basic = (res) => Object.defineProperty(res, 'type', { value: 'basic' });

function browser({ version = 'v2', online = true, existing = [] } = {}) {
  const stores = new Map(existing.map((name) => [name, new Map()]));
  const keyOf = (r) => new URL(typeof r === 'string' ? r : r.url, ORIGIN).href;
  const openCache = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      async addAll(requests) {
        for (const r of requests) {
          const res = await network(r);
          if (!res.ok) throw new TypeError(`${r.url} ${res.status}`);
          store.set(keyOf(r), res);
        }
      },
      async put(r, res) {
        await res.clone().text();
        store.set(keyOf(r), res);
      },
      async match(r) {
        return store.get(keyOf(r))?.clone();
      },
    };
  };
  const site = {
    '/': '<h1>Wheel of Life</h1>',
    '/wheel-of-business': '<h1>Wheel of Business</h1>',
    '/wheel-of-relationships': '<h1>Wheel of Relationships</h1>',
  };
  const state = { online, fetched: [] };
  const network = vi.fn(async (r) => {
    const url = new URL(typeof r === 'string' ? r : r.url, ORIGIN);
    state.fetched.push({ path: url.pathname, cache: r.cache });
    if (!state.online) throw new TypeError('Failed to fetch');
    if (site[url.pathname]) return basic(html(site[url.pathname]));
    if (FILES.includes(url.pathname)) return basic(new Response(`file ${url.pathname}`));
    return basic(new Response('not found', { status: 404 }));
  });
  const handlers = {};
  const self = {
    location: new URL('/sw.js', ORIGIN),
    addEventListener: (type, fn) => (handlers[type] = fn),
    skipWaiting: vi.fn(async () => {}),
    clients: { claim: vi.fn(async () => {}) },
  };
  const caches = {
    open: async (name) => openCache(name),
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
  };
  // A worker resolves "/assets/x.js" against its own address.
  class WorkerRequest extends Request {
    constructor(input, init) {
      super(typeof input === 'string' ? new URL(input, ORIGIN).href : input, init);
    }
  }
  const source = swSource({ version, pages: PAGES, files: FILES, worker });
  vm.runInNewContext(source, { self, caches, fetch: network, Request: WorkerRequest, Response, URL, console });

  async function run(type, extra = {}) {
    const waits = [];
    let responded;
    const event = { ...extra, waitUntil: (p) => waits.push(p), respondWith: (p) => (responded = p) };
    handlers[type](event);
    const response = await responded;
    await Promise.all(waits);
    return response;
  }
  const visit = (pathname, { mode = 'navigate', method = 'GET', origin = ORIGIN } = {}) =>
    run('fetch', { request: { url: new URL(pathname, origin).href, mode, method } });

  return { state, stores, self, network, run, visit, cacheName: `wheels-${version}` };
}

describe('the offline helper (sw.js)', () => {
  it('keeps every page and file when it is installed, straight from the site', async () => {
    const b = browser();
    await b.run('install');
    const kept = [...b.stores.get(b.cacheName).keys()].map((u) => new URL(u).pathname);
    expect(kept).toEqual([...PAGES, ...FILES]);
    expect(b.state.fetched.every((f) => f.cache === 'reload')).toBe(true);
    expect(b.self.skipWaiting).toHaveBeenCalled();
  });

  it('clears out older versions when it takes over, and nothing else', async () => {
    const b = browser({ existing: ['wheels-v1', 'wheels-v2', 'someone-else'] });
    await b.run('activate');
    expect([...b.stores.keys()]).toEqual(['wheels-v2', 'someone-else']);
    expect(b.self.clients.claim).toHaveBeenCalled();
  });

  it('opens a page from the internet when it can', async () => {
    const b = browser();
    await b.run('install');
    b.network.mockImplementationOnce(async () => basic(html('<h1>Business, updated</h1>')));
    const res = await b.visit('/wheel-of-business?from=home');
    expect(await res.text()).toBe('<h1>Business, updated</h1>');
    expect(b.network.mock.calls.at(-1)[0].url).toBe('https://wheels.neurodapt.au/wheel-of-business?from=home');
    // A site error is passed on as it is, not swapped for a kept page.
    b.network.mockImplementationOnce(async () => basic(new Response('down', { status: 503 })));
    expect((await b.visit('/wheel-of-business')).status).toBe(503);
  });

  it('opens the kept page without the internet, and the home page for any other address', async () => {
    const b = browser();
    await b.run('install');
    b.state.online = false;
    expect(await (await b.visit('/wheel-of-business')).text()).toBe('<h1>Wheel of Business</h1>');
    expect(await (await b.visit('/wheel-of-business.html')).text()).toBe('<h1>Wheel of Business</h1>');
    expect(await (await b.visit('/wheel-of-relationships/')).text()).toBe('<h1>Wheel of Relationships</h1>');
    expect(await (await b.visit('/index.html')).text()).toBe('<h1>Wheel of Life</h1>');
    expect(await (await b.visit('/no-such-page')).text()).toBe('<h1>Wheel of Life</h1>');
  });

  it('keeps pages only with their own files: a newer page seen online is not kept', async () => {
    // A newer page names newer files this version does not have; kept here,
    // it would open a blank app offline.
    const b = browser();
    await b.run('install');
    b.network.mockImplementationOnce(async () => basic(html('<h1>Business, next version</h1>')));
    await b.visit('/wheel-of-business');
    await b.visit('/no-such-page');
    b.state.online = false;
    expect(await (await b.visit('/wheel-of-business')).text()).toBe('<h1>Wheel of Business</h1>');
    const kept = [...b.stores.get(b.cacheName).keys()].map((u) => new URL(u).pathname);
    expect(kept).toEqual([...PAGES, ...FILES]);
  });

  it('serves scripts, styles and fonts from the kept copy, and anything else from the site', async () => {
    const b = browser();
    await b.run('install');
    b.state.fetched = [];
    expect(await (await b.visit('/assets/index-abc.js', { mode: 'no-cors' })).text()).toBe('file /assets/index-abc.js');
    expect(b.state.fetched).toEqual([]);
    expect((await b.visit('/og-image.png', { mode: 'no-cors' })).status).toBe(404);
    expect(b.state.fetched.map((f) => f.path)).toEqual(['/og-image.png']);
  });

  it('leaves other websites and anything but reading alone', async () => {
    const b = browser();
    expect(await b.visit('/', { origin: 'https://www.neurodapt.au' })).toBe(undefined);
    expect(await b.visit('/', { method: 'POST' })).toBe(undefined);
    expect(b.network).not.toHaveBeenCalled();
  });
});

describe('what the build keeps for offline use (scripts/build-sw.mjs)', () => {
  it('keeps every wheel’s page, by its address, and not the page-not-found', () => {
    const names = ['404.html', 'index.html', 'wheel-of-business.html', 'wheel-of-relationships.html', 'sw.js', 'robots.txt'];
    expect(pagesIn(names)).toEqual(['/', '/wheel-of-business', '/wheel-of-relationships']);
    expect(new Set(pagesIn(names))).toEqual(new Set(ALL_PAGES.map((p) => p.path)));
  });

  it('keeps what the pages use, without the older font format', () => {
    const files = filesIn(['index-abc.js', 'index-abc.css', 'logo-x.svg', 'font-a.woff2', 'font-a.woff']);
    expect(files).toEqual([
      '/assets/font-a.woff2',
      '/assets/index-abc.css',
      '/assets/index-abc.js',
      '/assets/logo-x.svg',
      '/favicon.svg',
      '/manifest.webmanifest',
      '/icon-192.png',
    ]);
    for (const f of files.filter((f) => !f.startsWith('/assets/'))) {
      expect(fs.existsSync(path.join(root, 'public', f)), f).toBe(true);
    }
  });
});
