import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { GetApp } from './GetApp.jsx';
import { ALL_PAGES, pageFor } from '../wheels/pages.js';
import { isStandalone } from '../pwa.js';

// The small icons along the bottom. "Get the app" is for phones and tablets
// only (styles.css), and goes once the site is open as the app.
const SECTIONS = [
  { key: 'about', label: 'About', icon: 'info' },
  { key: 'use', label: 'How to use', icon: 'list-numbers' },
  { key: 'areas', label: 'Areas', icon: 'chart-pie-slice' },
  { key: 'faq', label: 'FAQ', icon: 'question' },
  { key: 'app', label: 'Get the app', icon: 'device-mobile' },
];

// Under the wheel: a row of small icons, each opening one panel: what this
// wheel is, how to use it, its areas, common questions, and getting the app
// (the words live in pages.js). Closed panels are hidden from view but stay
// in the page, built ahead of time (scripts/prerender.mjs), so search engines
// and AI assistants still read all of it.
export function AboutWheel({ wheel, onChoose }) {
  const id = useId();
  const page = pageFor(wheel.id);
  const others = ALL_PAGES.filter((p) => p.id !== wheel.id);
  const [open, setOpen] = useState(null);
  const [standalone] = useState(() => isStandalone());
  const rowRef = useRef(null);
  const sections = standalone ? SECTIONS.filter((s) => s.key !== 'app') : SECTIONS;

  // A panel opened from near the bottom of the screen would open out of
  // sight, so the row moves up to the top first.
  useEffect(() => {
    const row = rowRef.current;
    if (!open || !row?.scrollIntoView) return;
    if (row.getBoundingClientRect().bottom < window.innerHeight * 0.6) return;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    row.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' });
  }, [open]);

  // A plain click on another wheel switches to it here; the link itself is a
  // real address for search engines, new tabs and copying.
  const openOther = (e, other) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onChoose?.(other.id);
    window.scrollTo({ top: 0 });
  };

  const panel = (key) => ({
    id: `${id}-${key}`,
    className: `about-panel about-panel-${key}`,
    hidden: open !== key,
  });

  return (
    <section className="about-wheel" aria-label={`More about the ${wheel.title}`}>
      <div className="about-tabs" ref={rowRef}>
        {sections.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`about-tab about-tab-${s.key}`}
            aria-expanded={open === s.key}
            aria-controls={`${id}-${s.key}`}
            onClick={() => setOpen((cur) => (cur === s.key ? null : s.key))}
          >
            <Icon name={s.icon} size={24} />
            <span className="btn-text">{s.label}</span>
          </button>
        ))}
      </div>

      <div {...panel('about')}>
        <h2>{`What is the ${wheel.title}?`}</h2>
        {page.intro.map((text) => (
          <p key={text}>{text}</p>
        ))}
        <nav className="about-more" aria-label="The other wheels">
          <h3>More wheels</h3>
          <ul>
            {others.map((other) => (
              <li key={other.id}>
                <a href={other.path} onClick={(e) => openOther(e, other)}>
                  {other.wheel.title}
                </a>
                <span>{other.intro[0]}</span>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div {...panel('use')}>
        <h2>How to use it</h2>
        <ol className="about-steps">
          {page.steps.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ol>
      </div>

      <div {...panel('areas')}>
        <h2>{`The ${wheel.slices.length} areas of the ${wheel.title}`}</h2>
        <dl className="about-areas">
          {wheel.slices.map((slice) => (
            <div key={slice.name}>
              <dt>
                <Icon name={slice.icon} size={22} />
                {slice.name}
              </dt>
              <dd>{slice.about}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div {...panel('faq')}>
        <h2>Common questions</h2>
        <div className="about-faq">
          {page.faq.map(({ q, a }) => (
            <details key={q}>
              <summary>
                <h3>{q}</h3>
                <Icon name="caret-down" className="faq-caret" size={18} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>

      {!standalone && (
        <div {...panel('app')}>
          <h2>Get the app</h2>
          <GetApp />
        </div>
      )}
    </section>
  );
}
