import { useId } from 'react';
import { Icon } from './Icon.jsx';
import { LEVELS } from '../wheels/config.js';
import { toPercent, averagePercent } from '../wheels/scores.js';

export function ScoreList({ wheel, levels, onStep }) {
  const headingId = useId();
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
                <output className="score-value" aria-live="polite">
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
            </li>
          );
        })}
      </ol>
    </section>
  );
}
