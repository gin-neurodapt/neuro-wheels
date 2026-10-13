import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { LEVELS } from '../wheels/config.js';
import { toPercent, averagePercent } from '../wheels/scores.js';

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

export function ScoreList({ wheel, levels, onStep }) {
  const headingId = useId();
  const announcement = useAnnouncement(wheel, levels);
  return (
    <section className="scores" aria-labelledby={headingId}>
      <div className="scores-head">
        <h2 id={headingId}>Your scores</h2>
        <p className="average">
          Average <strong>{averagePercent(levels)}%</strong>
        </p>
      </div>
      <ol className="score-list">
        {wheel.slices.map((slice, i) => {
          const level = levels[i];
          const nameId = `${headingId}-${i}`;
          return (
            <li className="score-row" key={`${wheel.id}-${i}`}>
              <Icon name={slice.icon} className="score-icon" size={26} />
              <span className="score-name" id={nameId}>
                {slice.name}
              </span>
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
                <output className="score-value">{toPercent(level)}%</output>
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
