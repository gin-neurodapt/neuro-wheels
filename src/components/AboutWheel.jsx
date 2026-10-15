import { useId } from 'react';
import { Icon } from './Icon.jsx';
import { ALL_PAGES, pageFor } from '../wheels/pages.js';

// Under the wheel: what this wheel is, how to use it, its areas, and common
// questions (the words live in pages.js). Search engines and AI assistants
// read this text, and it is built into the page ahead of time
// (scripts/prerender.mjs), so they see it without running any code.
export function AboutWheel({ wheel, onChoose }) {
  const id = useId();
  const page = pageFor(wheel.id);
  const others = ALL_PAGES.filter((p) => p.id !== wheel.id);

  // A plain click on another wheel switches to it here; the link itself is a
  // real address for search engines, new tabs and copying.
  const openOther = (e, other) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onChoose?.(other.id);
    window.scrollTo({ top: 0 });
  };

  return (
    <section className="about-wheel" aria-labelledby={`${id}-what`}>
      <div className="about-inner">
        <h2 id={`${id}-what`}>{`What is the ${wheel.title}?`}</h2>
        {page.intro.map((text) => (
          <p key={text}>{text}</p>
        ))}

        <h2>How to use it</h2>
        <ol className="about-steps">
          {page.steps.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ol>

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

        <h2>Common questions</h2>
        <div className="about-faq">
          {page.faq.map(({ q, a }) => (
            <div key={q}>
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}
        </div>

        <nav className="about-more" aria-label="The other wheels">
          <h2>More wheels</h2>
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
    </section>
  );
}
