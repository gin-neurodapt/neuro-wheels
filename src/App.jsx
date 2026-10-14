import { useCallback, useEffect, useState } from 'react';
import logoUrl from './assets/logo.svg';
import { WHEELS, findWheel } from './wheels/config.js';
import { tapLevel, stepLevel, emptyLevels } from './wheels/scores.js';
import { loadState, saveState, initialState, parseState, wheelFromHash, STORAGE_KEY } from './wheels/storage.js';
import { WheelPicker } from './components/WheelPicker.jsx';
import { WheelChart } from './components/WheelChart.jsx';
import { ScoreList } from './components/ScoreList.jsx';
import { Actions } from './components/Actions.jsx';
import { AreaCard, usePeek } from './components/AreaCard.jsx';

function deviceStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function startingState() {
  const state = loadState(deviceStorage());
  const fromLink = wheelFromHash(window.location.hash);
  return fromLink ? { ...state, active: fromLink } : state;
}

export default function App() {
  const [state, setState] = useState(startingState);
  const wheel = findWheel(state.active) || WHEELS[0];
  const levels = state.scores[wheel.id];

  useEffect(() => saveState(deviceStorage(), state), [state]);

  // Keep the address showing the open wheel (#life, #relationships,
  // #business) without adding history entries, and follow it if it changes.
  useEffect(() => {
    const hash = `#${wheel.id}`;
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
    document.title = `${wheel.title} · NeuroDapt`;
  }, [wheel.id, wheel.title]);

  useEffect(() => {
    const onHash = () => {
      const id = wheelFromHash(window.location.hash);
      if (id) setState((s) => (s.active === id ? s : { ...s, active: id }));
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Another open tab changed the scores: take them, keep this tab's wheel.
  // (Without this, whichever tab saved last would wipe the other's scores.)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || e.newValue == null) return;
      const theirs = parseState(e.newValue);
      setState((s) => ({ ...theirs, active: s.active }));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateLevel = useCallback((sliceIndex, next) => {
    setState((s) => {
      const current = s.scores[s.active];
      const value = next(current[sliceIndex]);
      if (value === current[sliceIndex]) return s;
      const updated = [...current];
      updated[sliceIndex] = value;
      return { ...s, scores: { ...s.scores, [s.active]: updated } };
    });
  }, []);

  const onTap = useCallback((i, level) => updateLevel(i, (cur) => tapLevel(cur, level)), [updateLevel]);
  const onStep = useCallback((i, delta) => updateLevel(i, (cur) => stepLevel(cur, delta)), [updateLevel]);
  const onChoose = useCallback((id) => setState((s) => ({ ...s, active: id })), []);
  const onLabel = useCallback((label) => setState((s) => ({ ...s, label })), []);
  const onResetWheel = useCallback(
    () => setState((s) => ({ ...s, scores: { ...s.scores, [s.active]: emptyLevels(findWheel(s.active)) } })),
    [],
  );
  const onResetAll = useCallback(() => setState((s) => ({ ...initialState(), active: s.active, label: s.label })), []);

  // Which area's description is open (one at a time, on the open wheel).
  const [about, setAbout] = useState(null);
  const openArea = about?.wheelId === wheel.id ? about.index : null;
  const onAbout = useCallback(
    (i) => setAbout((a) => (a?.wheelId === wheel.id && a.index === i ? null : { wheelId: wheel.id, index: i })),
    [wheel.id],
  );
  // Another wheel closes it (so coming back to this one finds it closed too).
  useEffect(() => setAbout(null), [wheel.id]);

  // The description card shown while a mouse points at an area.
  const { peek, show: onPeek, hide: hidePeek } = usePeek();
  useEffect(() => hidePeek(), [wheel.id, hidePeek]);
  // Not over a list row whose description is already open under it.
  const card = peek && !(peek.source === 'list' && peek.index === openArea) ? peek : null;

  const anyScores = Object.values(state.scores).some((l) => l.some(Boolean));

  return (
    <div
      className="page"
      style={{ '--accent': wheel.ink, '--accent-fill': wheel.fill, '--rows': wheel.slices.length }}
    >
      <header className="site-header">
        <a className="brand" href="https://www.neurodapt.au/" target="_top" rel="noopener">
          <img src={logoUrl} alt="NeuroDapt" width="115" height="79" />
        </a>
        <h1 className="site-title">{wheel.title}</h1>
        <WheelPicker wheels={WHEELS} activeId={wheel.id} onChoose={onChoose} />
      </header>

      <main className="main">
        <p className="hint">
          <span className="on-touch">Tap a ring to score an area, and tap it again to clear it.</span>
          <span className="on-mouse">
            Click a ring to score an area, and click it again to clear it. Point at an area to read about it.
          </span>
        </p>

        <WheelChart wheel={wheel} levels={levels} onTap={onTap} onAbout={onAbout} onPeek={onPeek} />

        <ScoreList
          wheel={wheel}
          levels={levels}
          onStep={onStep}
          openArea={openArea}
          onAbout={onAbout}
          onPeek={onPeek}
        />

        <Actions
          wheel={wheel}
          levels={levels}
          label={state.label}
          onLabel={onLabel}
          onResetWheel={onResetWheel}
          onResetAll={onResetAll}
          anyScores={anyScores}
          logoUrl={logoUrl}
        />
      </main>

      <AreaCard wheel={wheel} peek={card} />

      <footer className="site-footer">
        <p>Your scores stay on this device. Nothing is sent anywhere.</p>
        <p>
          Developed by Gin Maher, Clinical Hypnotherapist and Strategic Psychotherapist, Sydney.
          <br />© {new Date().getFullYear()} NeuroDapt. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
