import { useState } from 'react';
import { Icon } from './Icon.jsx';
import { install, installWay, isAppleMobile, useInstallOffer } from '../pwa.js';

// "Get the app": how to put the wheels on this phone's home screen. Android
// browsers that offer it get one button; iPhone and iPad get Safari's steps;
// any other browser gets its menu's steps.
export function GetApp() {
  const offer = useInstallOffer();
  const [appleMobile] = useState(() => typeof navigator !== 'undefined' && isAppleMobile(navigator));
  const way = installWay({ standalone: false, appleMobile, ...offer });

  if (way === 'installed') {
    return <p>It’s on your home screen now. Open it from there any time, even without the internet.</p>;
  }

  return (
    <>
      <p>
        Put the wheels on your home screen. They open like an app, work without the internet, and your scores stay on
        your phone.
      </p>
      {way === 'button' && (
        <button type="button" className="btn btn-primary btn-install" onClick={() => install()}>
          <Icon name="download-simple" size={20} />
          <span className="btn-text">Install the app</span>
        </button>
      )}
      {way === 'apple' && (
        <ol className="app-steps">
          <li>
            Tap Share <Icon name="export" size={20} className="app-step-icon" />
            <small>In Safari it may be under ••• first.</small>
          </li>
          <li>
            Choose Add to Home Screen <Icon name="plus-square" size={20} className="app-step-icon" />
            <small>If you can’t see it, scroll down the list.</small>
          </li>
          <li>Tap Add.</li>
        </ol>
      )}
      {way === 'menu' && (
        <ol className="app-steps">
          <li>
            Open your browser’s menu <Icon name="dots-three-vertical" size={20} className="app-step-icon" />
            <small>Opened this from another app? Choose Open in Chrome (or your browser) first.</small>
          </li>
          <li>Choose Install app or Add to Home screen.</li>
        </ol>
      )}
    </>
  );
}
