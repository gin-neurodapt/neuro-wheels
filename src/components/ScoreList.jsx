import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { LEVELS } from '../wheels/config.js';
import { toPercent } from '../wheels/scores.js';

// One message for screen readers per change ("Family 60%"), rather than every
// percentage announcing itself.
export function describeChange(wheel, before, after) {
  const changed = after.map((l, i) => (l !== before[i] ? i : -1)).filter((i) => i >= 0);
  if (changed.length === 0) return '';
  if (changed.length === 1) {
    const i = changed[0];
    return `${wheel.slices[i].name} ${toPercent(after[i])}%`;
  }
  return after.every((l) => l === 0) ? 'All scores cleared' : 'Scores updated';
}

function useAnnouncement(wheel, levels) {
  const [message, setMessage] = useState('');
  const previous = useRef({ id: wheel.id, levels });
  useEffect(() => {
    const prev = previous.current;
    if (prev.id === wheel.id) setMessage(describeChange(wheel, prev.levels, levels));
    else setMessage('');
    previous.current = { id: wheel.id, levels };
  }, [wheel, levels]);
  return message;
}

// Opening a description from the wheel can put it below the screen's edge:
// bring it into view (no movement if it is already showing).
function useRevealOpenArea(listRef, openArea) {
  useEffect(() => {
    if (openArea == null) return;
    listRef.current?.querySelector(`[data-about="${openArea}"]`)?.scrollIntoView?.({ block: 'nearest' });
  }, [listRef, openArea]);
}

export function ScoreList({ wheel, levels, onStep, openArea = null, onAbout, onPeek }) {
  const headingId = useId();
  const listRef = useRef(null);
  const announcement = useAnnouncement(wheel, levels);
  useRevealOpenArea(listRef, openArea);
  // "Summary" shows on wide screens, where the scores have their own column
  // beside the wheel (styles.css). On phones the list sits right under the
  // wheel, so there the heading is for screen readers only.
  return (
    <section className="scores" aria-labelledby={headingId}>
      <h2 className="scores-title visually-hidden" id={headingId}>
        Summary
      </h2>
      <ol className="score-list" ref={listRef}>
        {wheel.slices.map((slice, i) => {
          const level = levels[i];
          const nameId = `${headingId}-${i}`;
          const aboutId = `${headingId}-about-${i}`;
          const open = openArea === i;
          const peekHandlers = {
            onPointerEnter: (e) => {
              if (e.pointerType === 'mouse') onPeek?.(i, e.currentTarget, 'list');
            },
            onPointerLeave: () => onPeek?.(null),
          };
          return (
            <li className="score-row" key={`${wheel.id}-${i}`}>
              <button
                type="button"
                className="area"
                aria-expanded={open}
                aria-controls={aboutId}
                onClick={() => onAbout?.(i)}
                {...peekHandlers}
              >
                <Icon name={slice.icon} className="score-icon" size={24} />
                <span className="score-name" id={nameId}>
                  {slice.name}
                </span>
                <Icon name="caret-down" className="area-caret" size={14} />
              </button>
              <div className="stepper" role="group" aria-labelledby={nameId}>
                <button
                  type="button"
                  className="step"
                  onClick={() => onStep(i, -1)}
                  disabled={level <= 0}
                  aria-label={`Lower ${slice.name}`}
                >
                  <Icon name="minus" size={18} />
                </button>
                <output className="score-value" {...peekHandlers}>
                  {toPercent(level)}%
                </output>
                <button
                  type="button"
                  className="step"
                  onClick={() => onStep(i, 1)}
                  disabled={level >= LEVELS}
                  aria-label={`Raise ${slice.name}`}
                >
                  <Icon name="plus" size={18} />
                </button>
              </div>
              <p className="about" id={aboutId} data-about={i} hidden={!open}>
                {slice.about}
              </p>
            </li>
          );
        })}
      </ol>
      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
