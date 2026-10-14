import { useEffect, useId, useState } from 'react';
import { Icon } from './Icon.jsx';
import { LABEL_MAX, cleanLabel, imageFileName } from '../wheels/filename.js';
import { renderWheelImage, downloadImage, ensureFonts, loadImage } from '../wheels/exportImage.js';

export function Actions({ wheel, levels, label, onLabel, onResetWheel, onResetAll, anyScores, logoUrl }) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    ensureFonts();
    if (logoUrl) loadImage(logoUrl).catch(() => {});
  }, [logoUrl]);

  useEffect(() => setStatus(''), [wheel.id]);

  async function download() {
    const fileName = imageFileName(wheel.title, label);
    setStatus('');
    setBusy(true);
    try {
      const blob = await renderWheelImage({ wheel, levels, label, logoUrl });
      downloadImage(blob, fileName);
      setStatus(`Downloading “${fileName}”.`);
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

  // The image controls are hidden on phones and tablets (see styles.css).
  return (
    <div className="actions">
      <section className="save-image" aria-label="Save as an image">
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
        <p className="status" role="status" aria-live="polite">
          {status}
        </p>
      </section>
      <div className="actions-row">
        <button type="button" className="btn btn-reset-wheel" onClick={resetWheel}>
          <Icon name="arrow-counter-clockwise" size={18} />
          Reset this wheel
        </button>
        <button type="button" className="btn btn-reset-all" onClick={resetAll}>
          <Icon name="arrows-counter-clockwise" size={18} />
          Reset all wheels
        </button>
      </div>
    </div>
  );
}
