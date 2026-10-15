export function WheelPicker({ wheels, activeId, onChoose }) {
  return (
    <div className="picker" role="group" aria-label="Choose a wheel">
      {wheels.map((w) => (
        <button
          key={w.id}
          type="button"
          aria-pressed={w.id === activeId}
          onClick={() => onChoose(w.id)}
          style={{ '--tab-ink': w.ink }}
        >
          <span className="btn-text">{w.tab}</span>
        </button>
      ))}
    </div>
  );
}
