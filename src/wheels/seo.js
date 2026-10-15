// What search engines and AI assistants read, built when the site is built
// (scripts/prerender.mjs): each page's <head> tags and structured data, the
// sitemap, and llms.txt. Everything comes from pages.js and config.js.
// This file is never sent to visitors' browsers.

import { ALL_PAGES, SITE_URL, SITE_NAME, BRAND } from './pages.js';

export const OG_IMAGE = { url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, type: 'image/png' };

export function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const ORG_ID = `${BRAND.url}#organization`;
const PERSON_ID = `${BRAND.url}#gin-maher`;
const WEBSITE_ID = `${SITE_URL}/#website`;

// schema.org data for one wheel's page: who made it, the site, the page, the
// free web app on it, and its questions and answers (the same ones the page
// shows, which search engines require).
export function structuredData(page, date) {
  const category = page.id === 'business' ? 'BusinessApplication' : 'LifestyleApplication';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: BRAND.name,
        url: BRAND.url,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512.png`, width: 512, height: 512 },
        founder: { '@id': PERSON_ID },
      },
      {
        '@type': 'Person',
        '@id': PERSON_ID,
        name: BRAND.author,
        jobTitle: BRAND.role,
        worksFor: { '@id': ORG_ID },
        workLocation: { '@type': 'Place', name: BRAND.place },
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        publisher: { '@id': ORG_ID },
        inLanguage: 'en-AU',
      },
      {
        '@type': 'WebPage',
        '@id': `${page.url}#webpage`,
        url: page.url,
        name: page.title,
        description: page.description,
        isPartOf: { '@id': WEBSITE_ID },
        mainEntity: { '@id': `${page.url}#app` },
        primaryImageOfPage: { '@type': 'ImageObject', url: OG_IMAGE.url },
        author: { '@id': PERSON_ID },
        publisher: { '@id': ORG_ID },
        inLanguage: 'en-AU',
        dateModified: date,
      },
      {
        '@type': 'WebApplication',
        '@id': `${page.url}#app`,
        name: page.wheel.title,
        url: page.url,
        description: [...page.intro].join(' '),
        applicationCategory: category,
        operatingSystem: 'Any (runs in a web browser)',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'AUD' },
        featureList: [
          ...page.wheel.slices.map((s) => `Score ${s.name} from 0 to 100%`),
          'Read what each area covers',
          'Save the wheel as an image (on a computer)',
          'Private: scores stay on your device',
        ],
        image: OG_IMAGE.url,
        creator: { '@id': PERSON_ID },
        publisher: { '@id': ORG_ID },
        inLanguage: 'en-AU',
      },
      {
        '@type': 'FAQPage',
        '@id': `${page.url}#faq`,
        url: page.url,
        isPartOf: { '@id': `${page.url}#webpage` },
        mainEntity: page.faq.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  };
}

// JSON inside <script>: "<" is escaped so no text can close the tag early.
function jsonForScript(data) {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}

export function headTags(page, date) {
  const tag = (name, content, attr = 'name') => `<meta ${attr}="${name}" content="${escapeHtml(content)}" />`;
  return [
    `<title>${escapeHtml(page.title)}</title>`,
    tag('description', page.description),
    `<link rel="canonical" href="${escapeHtml(page.url)}" />`,
    tag('robots', 'index, follow, max-snippet:-1, max-image-preview:large'),
    tag('author', `${BRAND.author}, ${BRAND.name}`),
    tag('og:type', 'website', 'property'),
    tag('og:site_name', BRAND.name, 'property'),
    tag('og:locale', 'en_AU', 'property'),
    tag('og:title', page.title, 'property'),
    tag('og:description', page.description, 'property'),
    tag('og:url', page.url, 'property'),
    tag('og:image', OG_IMAGE.url, 'property'),
    tag('og:image:type', OG_IMAGE.type, 'property'),
    tag('og:image:width', String(OG_IMAGE.width), 'property'),
    tag('og:image:height', String(OG_IMAGE.height), 'property'),
    tag('og:image:alt', `${BRAND.name} ${page.wheel.title}`, 'property'),
    tag('twitter:card', 'summary_large_image'),
    tag('twitter:title', page.title),
    tag('twitter:description', page.description),
    `<script type="application/ld+json">${jsonForScript(structuredData(page, date))}</script>`,
  ].join('\n    ');
}

// The page not found: kept out of search results.
export function notFoundHeadTags() {
  return [
    `<title>Page not found · ${SITE_NAME}</title>`,
    '<meta name="robots" content="noindex" />',
  ].join('\n    ');
}

export function sitemapXml(date) {
  const urls = ALL_PAGES.map(
    (p) => `  <url>\n    <loc>${escapeHtml(p.url)}</loc>\n    <lastmod>${date}</lastmod>\n  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

// llms.txt (llmstxt.org): a plain summary of the site for AI assistants.
export function llmsTxt() {
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> Free, private, interactive Wheel of Life, Wheel of Relationships and Wheel of Business tools from ${BRAND.name} (${BRAND.author}, ${BRAND.role}, ${BRAND.place}). Score eight areas from 0 to 100% and see where things are out of balance. No sign-up; scores stay on the visitor's own device and nothing is sent anywhere.`,
    '',
    'The aim is an even wheel, not a full one: the tools deliberately show no overall score or average.',
    '',
    '## Wheels',
    '',
  ];
  for (const p of ALL_PAGES) {
    lines.push(`- [${p.wheel.title}](${p.url}): ${p.description}`);
  }
  for (const p of ALL_PAGES) {
    lines.push('', `## ${p.wheel.title}`, '', ...p.intro.flatMap((t) => [t, '']), 'Areas:', '');
    for (const s of p.wheel.slices) lines.push(`- ${s.name}: ${s.about}`);
    lines.push('', 'Questions:', '');
    for (const { q, a } of p.faq) lines.push(`- ${q} ${a}`);
  }
  lines.push('', '## About', '', `- [${BRAND.name}](${BRAND.url}): ${BRAND.author}, ${BRAND.role}, ${BRAND.place}.`, '');
  return lines.join('\n');
}

// The page is drawn again in the browser, which sets these itself. Left in
// the built HTML, an inline style="" would break the security policy.
export function stripStyleAttributes(html) {
  return html.replace(/ style="[^"]*"/g, '');
}
