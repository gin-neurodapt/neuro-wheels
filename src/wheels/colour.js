// The wheel's lines: the outer rim in the wheel's own `stroke` colour, and
// every line inside it (the rings and the spokes) a much lighter version of
// it, so the score outlines stand out. Used by the page and the image alike.

// How far the inner lines are faded towards white (0 = not at all, 1 = white).
export const INNER_LINE_FADE = 0.6;

// Mixes a #rrggbb colour with white.
export function fadeToWhite(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const channels = [n >> 16, (n >> 8) & 255, n & 255].map((c) => Math.round(c + (255 - c) * amount));
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function innerLineColour(wheel) {
  return fadeToWhite(wheel.stroke, INNER_LINE_FADE);
}
