import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';

// With a mouse, pointing at an area (its icon, name or percentage, on the
// wheel or in the list) shows its description in a small card beside it.
// Touch screens have no pointing, so there the description opens under the
// area's name when it is tapped instead.

// Where the card goes: under the thing pointed at, or over it when there is
// no room below; centred on it, but kept inside the window.
export function placeCard({ anchor, card, viewport, gap = 8, margin = 8 }) {
  const below = anchor.bottom + gap;
  const above = anchor.top - gap - card.height;
  const top = below + card.height <= viewport.height - margin || above < margin ? below : above;
  const centred = (anchor.left + anchor.right) / 2 - card.width / 2;
  const left = Math.min(Math.max(margin, centred), Math.max(margin, viewport.width - margin - card.width));
  return { left: Math.round(left), top: Math.round(top) };
}

// A short pause before the first card, so sweeping the mouse across the
// wheel doesn't flash cards; moving between areas while one shows is instant.
export function usePeek(delay = 200) {
  const [peek, setPeek] = useState(null);
  const timer = useRef(0);
  const showing = useRef(false);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    showing.current = false;
    setPeek(null);
  }, []);

  const show = useCallback(
    (index, el, source) => {
      clearTimeout(timer.current);
      if (index == null) {
        timer.current = setTimeout(hide, 0);
        return;
      }
      const open = () => {
        showing.current = true;
        setPeek({ index, el, source });
      };
      if (showing.current) open();
      else timer.current = setTimeout(open, delay);
    },
    [delay, hide],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  // The card is placed once, so it goes when the page moves under it.
  useEffect(() => {
    if (!peek) return undefined;
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, { capture: true });
      window.removeEventListener('resize', hide);
    };
  }, [peek, hide]);

  return { peek, show, hide };
}

export function AreaCard({ wheel, peek }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const slice = peek ? wheel.slices[peek.index] : null;

  useLayoutEffect(() => {
    if (!peek || !ref.current || !peek.el.isConnected) {
      setPos(null);
      return;
    }
    const card = ref.current.getBoundingClientRect();
    setPos(
      placeCard({
        anchor: peek.el.getBoundingClientRect(),
        card: { width: card.width, height: card.height },
        viewport: { width: document.documentElement.clientWidth, height: window.innerHeight },
      }),
    );
  }, [peek]);

  if (!slice) return null;
  // Hidden from screen readers: they reach the same text through the list.
  return (
    <div
      ref={ref}
      className="area-card"
      aria-hidden="true"
      style={pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, visibility: 'hidden' }}
    >
      <p className="area-card-name">
        <Icon name={slice.icon} size={20} />
        {slice.name}
      </p>
      <p>{slice.about}</p>
    </div>
  );
}
