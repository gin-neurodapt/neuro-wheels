// How to use the wheel ("Tap…" on touch screens, "Click…" with a mouse;
// styles.css shows the right one). It is placed twice, above the wheel and
// under "Summary", and styles.css shows one place per layout.
export function Hint({ place }) {
  return (
    <p className={`hint hint-${place}`}>
      <span className="on-touch">Tap a ring to score an area, and tap it again to clear it.</span>
      <span className="on-mouse">
        Click a ring to score an area, and click it again to clear it. Point at an area to read about it.
      </span>
    </p>
  );
}
