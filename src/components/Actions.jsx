import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { LABEL_MAX, cleanLabel, displayLabel, imageFileName } from '../wheels/filename.js';
import {
  renderWheelImage,
  deliverImage,
  ensureFonts,
  loadImage,
  prefersShare,
  formatDate,
} from '../wheels/exportImage.js';

// What the image would show; a ready-made image is reused only if it matches.
function imageKey(wheel, levels, label) {
  return JSON.stringify([wheel.id, levels, displayLabel(label), formatDate(new Date())]);
}

const PREPARE_AFTER_MS = 600;

export function Actions({ wheel, levels, label, onLabel, onResetWheel, onResetAll, anyScores, logoUrl }) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const ready = useRef(null);

  useEffect(() => {
    ensureFonts();
    if (logoUrl) loadImage(logoUrl).catch(() => {});
  }, [logoUrl]);

  useEffect(() => setStatus(''), [wheel.id]);

  // Phones: the share sheet only opens if it is asked for straight after the
  // tap, so draw the image shortly after each change, ready for that tap.
  useEffect(() => {
    if (!prefersShare()) return undefined;
    let current = true;
    const key = imageKey(wheel, levels, label);
    const timer = setTimeout(() => {
      renderWheelImage({ wheel, levels, label, logoUrl })
        .then((blob) => {
          if (current) ready.current = { key, blob };
        })
        .catch(() => {});
    }, PREPARE_AFTER_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [wheel, levels, label, logoUrl]);

  async function download() {
    const fileName = imageFileName(wheel.title, label);
    const key = imageKey(wheel, levels, label);
    let blob = ready.current?.key === key ? ready.current.blob : null;
    setStatus('');
    if (!blob) {
      setBusy(true);
      try {
        blob = await renderWheelImage({ wheel, levels, label, logoUrl });
      } catch {
        setStatus('Sorry, the image could not be made on this device.');
        return;
      } finally {
        setBusy(false);
      }
    }
    try {
      const outcome = await deliverImage(blob, fileName);
      if (outcome === 'downloaded') {
        const touch = window.matchMedia?.('(pointer: coarse)').matches;
        setStatus(
          `Downloading “${fileName}”.${touch ? ' If nothing appears, open this page in Safari or Chrome and try again.' : ''}`,
        );
      } else if (outcome === 'shared') {
        setStatus('Image shared.');
      }
    } catch {
      setStatus('Sorry, the image could not be saved on this device.');
    }
  }

  function resetWheel() {
    if (levels.some(Boolean) && !window.confirm(`Clear your scores on the ${wheel.title}?`)) return;
    onResetWheel();
    setStatus('');
  }

  function resetAll() {
    if (anyScores && !window.confirm('Clear your scores on every wheel?')) return;
    onResetAll();
    setStatus('');
  }

  return (
    <section className="actions" aria-label="Save or start again">
      <div className="field">
        <label htmlFor={inputId}>
          Name your image <span className="optional">(optional)</span>
        </label>
        <input
          id={inputId}
          type="text"
          inputMode="text"
          autoComplete="off"
          enterKeyHint="done"
          maxLength={LABEL_MAX}
          placeholder="e.g. Week 5"
          value={label}
          onChange={(e) => onLabel(cleanLabel(e.target.value))}
        />
      </div>
      <button type="button" className="btn btn-primary" onClick={download} disabled={busy}>
        <Icon name="download-simple" size={20} />
        {busy ? 'Preparing image…' : 'Download image'}
      </button>
      <div className="actions-row">
        <button type="button" className="btn btn-quiet" onClick={resetWheel}>
          <Icon name="arrow-counter-clockwise" size={18} />
          Reset wheel
        </button>
        <button type="button" className="btn btn-quiet" onClick={resetAll}>
          Reset all
        </button>
      </div>
      <p className="status" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
