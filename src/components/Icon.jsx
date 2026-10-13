import { ICON_PATHS, ICON_GRID } from '../wheels/icons.generated.js';

export function Icon({ name, className, size = 24 }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${ICON_GRID} ${ICON_GRID}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}
