import { useEffect, useState } from 'react';

// Changes whenever web fonts finish loading, so text can be re-measured with
// the real font instead of the fallback.
export function useFontsVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    if (!fonts) return undefined;
    let alive = true;
    const bump = () => {
      if (alive) setVersion((v) => v + 1);
    };
    fonts.ready?.then(bump, () => {});
    fonts.addEventListener?.('loadingdone', bump);
    return () => {
      alive = false;
      fonts.removeEventListener?.('loadingdone', bump);
    };
  }, []);
  return version;
}
