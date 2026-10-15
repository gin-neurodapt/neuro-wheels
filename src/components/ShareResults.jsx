import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { WHEELS } from '../wheels/config.js';
import { renderWheelImage } from '../wheels/exportImage.js';
import { imageFileName } from '../wheels/filename.js';
import { hasResults, otherResults, pictureShare, shareSupport, snapshotKey, wordsShare } from '../wheels/share.js';

// How long the scores must stay still before their pictures are drawn ahead
// of time (see `send`).
const PREPARE_AFTER_MS = 400;

const SAY = {
  empty: 'Score at least one area first, then share your wheel.',
  unsupported: 'This browser can’t share. Open this page in Chrome or Safari to share it, or take a screenshot.',
  noPicture: 'Sorry, the picture could not be made on this device.',
  failed: 'Sorry, this device could not share your wheel.',
  again: 'Your picture is ready: tap Share results again to send it.',
};

// "Share results": a picture of the open wheel, sent with the device's own
// share sheet. When other wheels have scores too, it first asks whether to
// send those as well (none are ticked until the person ticks them).
export function ShareResults({ wheel, scores, label, logoUrl, onStatus }) {
  const [support] = useState(() => shareSupport(typeof navigator === 'undefined' ? undefined : navigator));
  const [asking, setAsking] = useState(null); // { picked: [wheel ids], note } while the question is open
  const [busy, setBusy] = useState(false);
  const pictures = useRef(new Map()); // wheel id → { key, promise, file }
  const dialogRef = useRef(null);
  const titleId = useId();

  const scored = WHEELS.filter((w) => hasResults(scores[w.id]));
  const others = otherResults(wheel.id, scores);

  function picture(w) {
    const key = snapshotKey(w, scores[w.id], label);
    const have = pictures.current.get(w.id);
    if (have?.key === key) return have;
    const entry = { key, file: null };
    entry.promise = renderWheelImage({ wheel: w, levels: scores[w.id], label, logoUrl }).then(
      (blob) => (entry.file = new File([blob], imageFileName(w.title, label), { type: 'image/png' })),
      (err) => {
        if (pictures.current.get(w.id) === entry) pictures.current.delete(w.id);
        throw err;
      },
    );
    entry.promise.catch(() => {}); // a failure is reported when someone shares
    pictures.current.set(w.id, entry);
    return entry;
  }

  // The pictures of exactly these scores, if they are drawn already.
  function readyFiles(list) {
    const files = list.map((w) => {
      const entry = pictures.current.get(w.id);
      return entry?.key === snapshotKey(w, scores[w.id], label) ? entry.file : null;
    });
    return files.every(Boolean) ? files : null;
  }

  // Draw every scored wheel's picture once the scores settle, one at a time,
  // so a tap on Share finds them ready.
  const prepared = support === 'files' ? scored.map((w) => snapshotKey(w, scores[w.id], label)).join('\n') : '';
  useEffect(() => {
    if (!prepared) return undefined;
    let stop = false;
    const timer = setTimeout(async () => {
      for (const w of scored) {
        if (stop) return;
        await picture(w).promise.catch(() => {});
      }
    }, PREPARE_AFTER_MS);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
    // `scored` and `picture` change exactly when `prepared` or `logoUrl` does.
  }, [prepared, logoUrl]);

  // Opens the share sheet. When the pictures are ready it opens within the
  // tap itself: Safari refuses a share that comes after waiting for anything,
  // so drawing them first and then sharing would fail there.
  async function send(list) {
    if (support === 'text') return deliver(wordsShare(list, scores));
    const files = readyFiles(list);
    if (files) return deliver(pictureShare(list, files));
    setBusy(true);
    try {
      await Promise.all(list.map((w) => picture(w).promise));
    } catch {
      return 'noPicture';
    } finally {
      setBusy(false);
    }
    return deliver(pictureShare(list, readyFiles(list)), true);
  }

  async function deliver(data, late = false) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'; // the person closed the share sheet
      if (late && err?.name === 'NotAllowedError') return 'again'; // too long after the tap
      return 'failed';
    }
  }

  function onShare() {
    onStatus('');
    if (!hasResults(scores[wheel.id])) return onStatus(SAY.empty);
    if (support === 'none') return onStatus(SAY.unsupported);
    if (others.length) return setAsking({ picked: [], note: '' });
    send([wheel]).then((outcome) => onStatus(SAY[outcome] ?? ''));
  }

  function close() {
    const dialog = dialogRef.current;
    // Closing it properly puts the focus back on the Share button.
    if (dialog?.open && typeof dialog.close === 'function') dialog.close();
    setAsking(null);
  }

  function onShareChosen() {
    const list = [wheel, ...others.filter((w) => asking.picked.includes(w.id))];
    const ready = support === 'text' || readyFiles(list);
    send(list).then((outcome) => {
      if (outcome === 'again') {
        setAsking((a) => a && { ...a, note: 'Your pictures are ready: tap Share again.' });
        return;
      }
      close();
      onStatus(outcome === 'noPicture' || outcome === 'failed' ? SAY[outcome] : '');
    });
    // The share sheet has opened over the page: the question is answered.
    if (ready) close();
  }

  function toggle(id) {
    setAsking((a) => ({ note: '', picked: a.picked.includes(id) ? a.picked.filter((x) => x !== id) : [...a.picked, id] }));
  }

  const isAsking = asking !== null;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isAsking || !dialog || dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }, [isAsking]);

  const count = 1 + (asking?.picked.length ?? 0);

  return (
    <>
      <button
        type="button"
        className={`btn btn-primary btn-share${support === 'none' ? ' share-none' : ''}`}
        onClick={onShare}
        disabled={busy && !isAsking}
      >
        <Icon name="share-network" size={20} />
        <span className="btn-text">{busy && !isAsking ? 'Preparing…' : 'Share results'}</span>
      </button>
      {isAsking && (
        <dialog
          ref={dialogRef}
          className="share-dialog"
          aria-labelledby={titleId}
          onClose={() => setAsking(null)}
          onKeyDown={(e) => e.key === 'Escape' && close()}
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="share-dialog-body">
            <h2 id={titleId}>Share your other wheels too?</h2>
            <p>
              {others.length === 1
                ? `You also have results on your ${others[0].title}. Tick it to send it with your ${wheel.title}.`
                : `You also have results on these wheels. Tick any you’d like to send with your ${wheel.title}.`}
            </p>
            <ul className="share-choices">
              {others.map((w) => (
                <li key={w.id}>
                  <label>
                    <input type="checkbox" checked={asking.picked.includes(w.id)} onChange={() => toggle(w.id)} />
                    <span>{w.title}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="share-note" role="status" aria-live="polite">
              {asking.note}
            </p>
            <div className="share-dialog-buttons">
              <button type="button" className="btn btn-cancel" onClick={close}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-share-chosen" onClick={onShareChosen} disabled={busy}>
                <Icon name="share-network" size={20} />
                <span className="btn-text">
                  {busy ? 'Preparing…' : count === 1 ? 'Share this wheel' : `Share ${count} wheels`}
                </span>
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
