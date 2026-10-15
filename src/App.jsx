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
import { Hint } from './components/Hint.jsx';
import { AboutWheel } from './components/AboutWheel.jsx';
import { SiteFooter } from './components/SiteFooter.jsx';
import { pageFor, wheelFromPath } from './wheels/pages.js';

function deviceStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// An address that names a wheel opens it: its own page (/wheel-of-business)
// or an older link (/#business). The home page opens the wheel last used on
// this device, or the Wheel of Life.
function startingState() {
  const state = loadState(deviceStorage());
  const fromLink = wheelFromHash(window.location.hash) || wheelFromPath(window.location.pathname);
  return fromLink ? { ...state, active: fromLink } : state;
}

// `start` is given when the pages are built ahead of time (entry-server.jsx):
// there is no browser then, and nothing saved.
export default function App({ start }) {
  const [state, setState] = useState(() => start ?? startingState());
  const wheel = findWheel(state.active) || WHEELS[0];
  const levels = state.scores[wheel.id];

  useEffect(() => saveState(deviceStorage(), state), [state]);

  // Keep the address on the open wheel's own page (/, /wheel-of-relationships,
  // /wheel-of-business) without adding history entries, and follow an older
  // #link if one is opened.
  useEffect(() => {
    const page = pageFor(wheel.id);
    const { pathname, search, hash } = window.location;
    if (pathname !== page.path || hash) window.history.replaceState(null, '', page.path + search);
    document.title = page.title;
  }, [wheel.id]);

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
    <div className="page" data-wheel={wheel.id}>
      <header className="site-header">
        <a className="brand" href="https://www.neurodapt.au/" target="_top" rel="noopener">
          <img src={logoUrl} alt="NeuroDapt" width="115" height="79" />
        </a>
        <h1 className="site-title">{wheel.title}</h1>
        <WheelPicker wheels={WHEELS} activeId={wheel.id} onChoose={onChoose} />
      </header>

      <main className="main">
        <Hint place="top" />

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
          scores={state.scores}
          label={state.label}
          onLabel={onLabel}
          onResetWheel={onResetWheel}
          onResetAll={onResetAll}
          anyScores={anyScores}
          logoUrl={logoUrl}
        />
      </main>

      <AboutWheel wheel={wheel} onChoose={onChoose} />

      <AreaCard wheel={wheel} peek={card} />

      <SiteFooter logoUrl={logoUrl} />
    </div>
  );
}
