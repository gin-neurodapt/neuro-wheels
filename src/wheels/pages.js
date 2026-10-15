// Each wheel's own page: its address, the title and description search
// engines show, and the "about" text under the wheel (what it is, how to use
// it, common questions). The same text feeds the page, its search-engine
// data (scripts/prerender.mjs, seo.js) and llms.txt, so they always agree.
//
// Edit the words freely. Keep each `description` to about 150 characters
// (search engines cut longer ones) and each `title` under about 65.

import { WHEELS, findWheel } from './config.js';

export const SITE_URL = 'https://wheels.neurodapt.au';
export const SITE_NAME = 'NeuroDapt Wheels';

export const BRAND = {
  name: 'NeuroDapt',
  url: 'https://www.neurodapt.au/',
  author: 'Gin Maher',
  role: 'Clinical Hypnotherapist and Strategic Psychotherapist',
  place: 'Sydney, Australia',
};

const PAGES = {
  life: {
    path: '/',
    title: 'Wheel of Life: Free Interactive Assessment | NeuroDapt',
    description:
      'Free interactive Wheel of Life. Score 8 areas, from health and career to family and fun, and see where your life is out of balance. No sign-up, fully private.',
    intro: [
      'The Wheel of Life is a simple coaching tool for seeing how balanced your life feels right now. It splits life into eight areas, and you score each one from 0 to 100%.',
      'The shape it makes shows at a glance which areas are going well and which need more attention, so you can decide where to put your energy first.',
    ],
    faq: [],
  },
  relationships: {
    path: '/wheel-of-relationships',
    title: 'Wheel of Relationships: Free Relationship Wheel | NeuroDapt',
    description:
      'Free interactive relationship wheel. Score trust, love, fun, intimacy and more, and see where your relationship is uneven. No sign-up; your scores stay private.',
    intro: [
      'The Wheel of Relationships (a relationship wheel) applies the Wheel of Life idea to a couple. You score eight areas of your relationship from 0 to 100%, from trust and vulnerability to fun and intimacy.',
      'The shape shows where the relationship feels strong and where it needs care, which makes it a gentle way to start a conversation with your partner.',
    ],
    faq: [
      {
        q: 'Can my partner and I both fill it in?',
        a: 'Yes. Fill it in separately, then compare your two wheels and talk about where they differ. A difference is a place to start talking, not a verdict on the relationship.',
      },
    ],
  },
  business: {
    path: '/wheel-of-business',
    title: 'Wheel of Business: Free Interactive Assessment | NeuroDapt',
    description:
      'Free interactive Wheel of Business. Score profit, sales, marketing, clients, team and more, and see where your business is out of balance. No sign-up needed.',
    intro: [
      'The Wheel of Business is a quick health check for a business. You score eight areas from 0 to 100%, from profit margin and sales to integrity and innovation.',
      'The shape shows where the business is strong and where it is out of balance, so you can see what to work on next.',
    ],
    faq: [
      {
        q: 'Who is the Wheel of Business for?',
        a: 'Business owners, sole traders, practitioners and teams who want a quick, honest picture of how the business is going. If you work alone, score Employee Satisfaction for yourself.',
      },
    ],
  },
};

// The same for every wheel ({wheel} becomes its name, {areas} its areas).
const SHARED_FAQ = [
  {
    q: 'What areas does the {wheel} cover?',
    a: '{count} areas: {areas}. Tap or click any area on this page to read what it includes.',
  },
  {
    q: 'Should I aim for 100% in every area?',
    a: 'No. The aim is an even wheel, not a full one. A wheel that is fairly even all round turns more smoothly than one with a few areas at 100% and others near zero, so notice where yours dips and start there.',
  },
  {
    q: 'Is the {wheel} free? Do I need to sign up?',
    a: 'It is free, with no sign-up or account. Your scores are saved only in your own browser on this device, and nothing is sent anywhere.',
  },
  {
    q: 'How often should I fill it in?',
    a: 'Whenever you want a check-in: every few weeks or months, or at a turning point. Comparing your wheels over time shows what has shifted.',
  },
];

const STEPS = [
  'Score each area from 0 to 100%: tap or click a ring on the wheel, or use the + and − buttons. Tap or click an area’s name to read what it covers.',
  'Look at the shape. The aim is an even wheel, not a full one: deep dips are where things feel most out of balance.',
  'Choose one or two areas to work on first. Come back in a few weeks to see how the shape has changed (on a computer you can save your wheel as an image).',
];

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

function listWords(items) {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function fill(text, wheel) {
  const names = wheel.slices.map((s) => s.name);
  return text
    .replaceAll('{wheel}', wheel.title)
    .replaceAll('{count}', COUNT_WORDS[names.length] ?? String(names.length))
    .replaceAll('{areas}', listWords(names));
}

// Everything a wheel's page says, ready to show.
export function pageFor(id) {
  const wheel = findWheel(id);
  if (!wheel) return null;
  const page = PAGES[wheel.id];
  return {
    id: wheel.id,
    wheel,
    path: page.path,
    url: SITE_URL + page.path,
    title: page.title,
    description: page.description,
    intro: page.intro,
    steps: STEPS,
    faq: [SHARED_FAQ[0], ...page.faq, ...SHARED_FAQ.slice(1)].map(({ q, a }) => ({ q: fill(q, wheel), a: fill(a, wheel) })),
  };
}

export const ALL_PAGES = WHEELS.map((w) => pageFor(w.id));

// "/wheel-of-business" opens that wheel. The home page ("/") names no wheel:
// it opens the one last used on this device, or the Wheel of Life.
export function wheelFromPath(pathname) {
  const path = String(pathname || '').replace(/\/+$/, '').toLowerCase();
  if (path === '/wheel-of-life') return 'life';
  const page = ALL_PAGES.find((p) => p.path !== '/' && p.path === path);
  return page ? page.id : null;
}
