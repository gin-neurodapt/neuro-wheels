import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LEVELS } from '../wheels/config.js';
import { segmentPath, scoreArcPath, layoutLabels, namesFit } from '../wheels/geometry.js';
import { ICON_PATHS, ICON_GRID } from '../wheels/icons.generated.js';
import { toPercent } from '../wheels/scores.js';
import { createMeasure } from '../wheels/measure.js';
import { useFontsVersion } from '../hooks.js';

const RINGS = Array.from({ length: LEVELS }, (_, i) => i + 1);

// Reads the space the wheel really gets: its column's width, and the screen
// height it may fill. CSS caps the chart's width at that height × the
// drawing's width:height ratio, so the height is that cap ÷ the ratio.
function useNamesFit(areaRef, chartRef, full) {
  const [fits, setFits] = useState(false);
  useLayoutEffect(() => {
    const area = areaRef.current;
    const chart = chartRef.current;
    if (!area || !chart) return undefined;
    const check = () => {
      const style = getComputedStyle(chart);
      const maxWidth = parseFloat(style.maxWidth);
      const ratio = parseFloat(style.getPropertyValue('--chart-ratio')) || 1;
      const heightBudget = Number.isFinite(maxWidth) ? maxWidth / ratio : Infinity;
      setFits(namesFit({ areaWidth: area.clientWidth, heightBudget, full }));
    };
    check();
    window.addEventListener('resize', check);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(check) : null;
    observer?.observe(area);
    return () => {
      window.removeEventListener('resize', check);
      observer?.disconnect();
    };
  }, [areaRef, chartRef, full]);
  return fits;
}

export function WheelChart({ wheel, levels, onTap }) {
  const areaRef = useRef(null);
  const chartRef = useRef(null);
  const fontsVersion = useFontsVersion();
  const [hover, setHover] = useState(null);
  const titleId = useId();
  const count = wheel.slices.length;

  const paths = useMemo(
    () => Array.from({ length: count }, (_, i) => RINGS.map((level) => segmentPath(i, level, count))),
    [count],
  );

  // fontsVersion is a dependency on purpose: re-measure once the real fonts arrive.
  const measure = useMemo(() => createMeasure(), [fontsVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  const full = useMemo(() => layoutLabels(wheel.slices, 'full', measure), [wheel.slices, measure]);
  const compact = useMemo(() => layoutLabels(wheel.slices, 'compact', measure), [wheel.slices, measure]);
  const mode = useNamesFit(areaRef, chartRef, full) ? 'full' : 'compact';
  const { labels, halfW, halfH } = mode === 'full' ? full : compact;

  const summary = `${wheel.title}: ${wheel.slices
    .map((s, i) => `${s.name} ${toPercent(levels[i])}%`)
    .join(', ')}`;

  return (
    <div className="chart-area" ref={areaRef}>
      <div ref={chartRef} className="chart" style={{ '--chart-ratio': (halfW / halfH).toFixed(4) }}>
        <svg
          viewBox={`${-halfW} ${-halfH} ${2 * halfW} ${2 * halfH}`}
          role="img"
          aria-labelledby={titleId}
          data-mode={mode}
        >
          <title id={titleId}>{summary}</title>
          <g className="segments" onPointerLeave={() => setHover(null)}>
            {wheel.slices.map((slice, i) =>
              RINGS.map((level) => {
                const filled = level <= levels[i];
                const preview = !filled && hover?.slice === i && level <= hover.level;
                return (
                  <path
                    key={`${wheel.id}-${i}-${level}`}
                    className="segment"
                    d={paths[i][level - 1]}
                    fill={filled || preview ? wheel.fill : '#ffffff'}
                    fillOpacity={preview ? 0.45 : 1}
                    stroke={wheel.stroke}
                    strokeWidth={1.25}
                    vectorEffect="non-scaling-stroke"
                    data-slice={i}
                    data-level={level}
                    onClick={() => onTap(i, level)}
                    onPointerEnter={(e) => {
                      if (e.pointerType === 'mouse') setHover({ slice: i, level });
                    }}
                  />
                );
              }),
            )}
          </g>
          <g className="score-arcs" aria-hidden="true">
            {wheel.slices.map((slice, i) => {
              const d = scoreArcPath(i, levels[i], count);
              return d ? (
                <path
                  key={`${wheel.id}-arc-${i}`}
                  d={d}
                  fill="none"
                  stroke={wheel.ink}
                  strokeWidth={3}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  data-slice={i}
                />
              ) : null;
            })}
          </g>
          <g className="labels" aria-hidden="true">
            {labels.map((label, i) => {
              const slice = wheel.slices[i];
              const d = ICON_PATHS[slice.icon];
              return (
                <g key={`${wheel.id}-${i}`} data-slice={i} data-anchor={label.anchor}>
                  {d && (
                    <path
                      d={d}
                      fill={wheel.ink}
                      transform={`translate(${label.icon.x} ${label.icon.y}) scale(${label.icon.size / ICON_GRID})`}
                    />
                  )}
                  <text
                    className="label-value"
                    x={label.value.x}
                    y={label.value.y}
                    textAnchor={label.anchor}
                    fontSize={label.value.size}
                    fill={wheel.ink}
                  >
                    {toPercent(levels[i])}%
                  </text>
                  {label.name.map((line) => (
                    <text
                      key={line.text}
                      className="label-name"
                      x={line.x}
                      y={line.y}
                      textAnchor={label.anchor}
                      fontSize={line.size}
                    >
                      {line.text}
                    </text>
                  ))}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
