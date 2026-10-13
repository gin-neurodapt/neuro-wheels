import { useEffect, useId, useState } from 'react';
import { Icon } from './Icon.jsx';
import { LABEL_MAX, cleanLabel, imageFileName } from '../wheels/filename.js';
import { renderWheelImage, deliverImage, ensureFonts, loadImage } from '../wheels/exportImage.js';

export function Actions({ wheel, levels, label, onLabel, onResetWheel, onResetAll, anyScores, logoUrl }) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  // Get the fonts and logo ready early: on phones the share sheet must open
  // soon after the tap, so the image has to be quick to draw.
  useEffect(() => {
    ensureFonts();
    if (logoUrl) loadImage(logoUrl).catch(() => {});
  }, [logoUrl]);

  useEffect(() => setStatus(''), [wheel.id]);

  async function download() {
    setBusy(true);
    setStatus('');
    try {
      const blob = await renderWheelImage({ wheel, levels, label, logoUrl });
      const fileName = imageFileName(wheel.title, label);
      const outcome = await deliverImage(blob, fileName);
      if (outcome === 'downloaded') setStatus(`Saved “${fileName}”.`);
      else if (outcome === 'shared') setStatus('Image ready.');
    } catch {
      setStatus('Sorry, the image could not be made on this device.');
    } finally {
      setBusy(false);
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
